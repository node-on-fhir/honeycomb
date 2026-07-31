// imports/lib/EndpointConformanceProbe.js
//
// The Endpoint Conformance Spider's shared probe core (see
// fable/2026-07-01-endpoint-conformance-spider-design.md §5.1).
//
// Pure and dependency-injected: no Meteor, no Mongo, no module-level I/O —
// `fetchImpl` and `now` are injected so the whole probe runs under node --test
// with a mock SMART server. Drivers (extensions/lantern probe method, later
// the sweep workers) do the fetching wiring and the persistence.
//
// Contract guarantees (design doc §5.1):
//   - probeEndpoint NEVER throws — DNS/TLS/timeout/404/malformed JSON all
//     resolve to { reachable:false|degraded..., probeError } results.
//   - Stores NO response bodies — only classified fields.
//   - Sends no Authorization header; https-only; blocks loopback/RFC1918
//     literals (SSRF guard); bounded redirects + body size are requested via
//     fetch init hints (honored by node-fetch/meteor fetch).

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

// ---------------------------------------------------------------------------
// URL safety (SSRF guard) — https only, no loopback / private literals
// ---------------------------------------------------------------------------

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^\[?::1\]?$/,
  /^\[?fc/i,
  /^\[?fe80/i
];

export function isBlockedBaseUrl(baseUrl) {
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch (error) {
    return 'blocked: unparseable URL';
  }
  if (parsed.protocol !== 'https:') {
    return 'blocked: non-https scheme';
  }
  const host = parsed.hostname;
  for (const pattern of PRIVATE_HOST_PATTERNS) {
    if (pattern.test(host)) {
      return 'blocked: loopback/private address';
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Pure classifiers
// ---------------------------------------------------------------------------

export function classifySmartConfig(smartConfigJson) {
  const json = smartConfigJson || {};
  const capabilities = Array.isArray(json.capabilities) ? json.capabilities : [];
  const challengeMethods = Array.isArray(json.code_challenge_methods_supported)
    ? json.code_challenge_methods_supported
    : [];
  return {
    authorizationEndpoint: json.authorization_endpoint || '',
    tokenEndpoint: json.token_endpoint || '',
    capabilities: capabilities,
    grantTypes: Array.isArray(json.grant_types_supported) ? json.grant_types_supported : [],
    scopesSupported: Array.isArray(json.scopes_supported) ? json.scopes_supported : [],
    // Standalone patient launch: advertised capability, or (permissively) the
    // presence of an authorization endpoint when capabilities are omitted.
    supportsStandaloneLaunch: capabilities.includes('launch-standalone') ||
      (capabilities.length === 0 && !!json.authorization_endpoint),
    supportsPkce: challengeMethods.includes('S256')
  };
}

export function classifyCapabilityStatement(capabilityJson) {
  const json = capabilityJson || {};
  const rest = Array.isArray(json.rest)
    ? (json.rest.find(function(r) { return r && r.mode === 'server'; }) || json.rest[0] || {})
    : {};

  // Security: first restful-security-service coding code, if present.
  let security = '';
  const services = (rest.security && Array.isArray(rest.security.service)) ? rest.security.service : [];
  for (const service of services) {
    const codings = Array.isArray(service && service.coding) ? service.coding : [];
    if (codings.length && codings[0].code) {
      security = codings[0].code;
      break;
    }
  }

  const resources = [];
  const restResources = Array.isArray(rest.resource) ? rest.resource : [];
  for (const resource of restResources) {
    if (!resource || !resource.type) {
      continue;
    }
    const interactions = Array.isArray(resource.interaction)
      ? resource.interaction.map(function(i) { return i && i.code; }).filter(Boolean)
      : [];
    resources.push({ type: resource.type, interactions: interactions });
  }

  // Bulk export advertised?
  const operations = Array.isArray(rest.operation) ? rest.operation : [];
  const bulkExport = operations.some(function(op) {
    return op && typeof op.name === 'string' && op.name.toLowerCase().includes('export');
  }) || (Array.isArray(json.instantiates) && json.instantiates.some(function(url) {
    return typeof url === 'string' && url.includes('bulk');
  }));

  // USCDI hint: the core patient-record triad is present with read/search.
  function readable(type) {
    const entry = resources.find(function(r) { return r.type === type; });
    if (!entry) {
      return false;
    }
    return entry.interactions.length === 0 ||
      entry.interactions.includes('read') ||
      entry.interactions.includes('search-type');
  }
  const usCoreHint = readable('Patient') && readable('Condition') && readable('Observation');

  return {
    fhirVersion: json.fhirVersion || '',
    softwareName: (json.software && json.software.name) || '',
    softwareVersion: (json.software && json.software.version) || '',
    security: security,
    bulkExport: !!bulkExport,
    resources: resources,
    usCoreHint: usCoreHint
  };
}

export function classifyVendor({ baseUrl, softwareName }) {
  const url = (baseUrl || '').toLowerCase();
  const software = (softwareName || '').toLowerCase();

  function match(vendor, confidence) {
    return { vendor: vendor, confidence: confidence };
  }

  if (software.includes('epic') || url.includes('epic') || url.includes('interconnect')) {
    return match('epic', software.includes('epic') ? 0.95 : 0.75);
  }
  if (software.includes('cerner') || software.includes('millennium') ||
      url.includes('cerner') || url.includes('millennium')) {
    return match('oracle-cerner', 0.9);
  }
  if (software.includes('meditech') || url.includes('meditech')) {
    return match('meditech', 0.9);
  }
  if (software.includes('athena') || url.includes('athena')) {
    return match('athena', 0.9);
  }
  if (software) {
    return match('other', 0.5);
  }
  return match('unknown', 0);
}

// result: { reachable, fhirVersion, usCoreHint, smart: {...}, smartConfigOk, metadataOk }
export function gradeReadiness(result) {
  const notes = [];
  const smart = (result && result.smart) || {};

  let healthTag = 'down';
  if (result && result.reachable) {
    healthTag = (result.smartConfigOk && result.metadataOk) ? 'up' : 'degraded';
  }
  if (healthTag === 'degraded') {
    notes.push(result.metadataOk ? 'smart-configuration missing or unparseable' : 'metadata missing or unparseable');
  }

  const r4 = typeof (result && result.fhirVersion) === 'string' && result.fhirVersion.indexOf('4.') === 0;
  if (!r4) {
    notes.push('not R4');
  }
  if (!smart.supportsStandaloneLaunch) {
    notes.push('no standalone launch');
  }
  if (!(result && result.usCoreHint)) {
    notes.push('no USCDI hint (Patient/Condition/Observation)');
  }

  const patientLaunchable = !!(result && result.reachable && r4 &&
    smart.authorizationEndpoint && smart.supportsStandaloneLaunch && result.usCoreHint);

  return { patientLaunchable: patientLaunchable, healthTag: healthTag, notes: notes };
}

// ---------------------------------------------------------------------------
// The probe
// ---------------------------------------------------------------------------

function redactError(error) {
  // Keep the failure class, drop anything that looks like a token/query blob.
  const message = String((error && error.message) || error || 'unknown error');
  return message.split(/[?&]/)[0].slice(0, 200);
}

async function fetchJson(fetchImpl, url, timeoutMs) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(function() { controller.abort(); }, timeoutMs) : null;
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json, application/fhir+json' },
      redirect: 'follow',
      follow: MAX_REDIRECTS,
      size: MAX_BODY_BYTES,
      signal: controller ? controller.signal : undefined
    });
    const status = response && typeof response.status === 'number' ? response.status : 0;
    if (!response || !response.ok) {
      return { ok: false, status: status, json: null, error: 'HTTP ' + status };
    }
    const text = await response.text();
    if (text.length > MAX_BODY_BYTES) {
      return { ok: false, status: status, json: null, error: 'body too large' };
    }
    try {
      return { ok: true, status: status, json: JSON.parse(text), error: null };
    } catch (parseError) {
      return { ok: false, status: status, json: null, error: 'malformed JSON' };
    }
  } catch (error) {
    return { ok: false, status: 0, json: null, error: redactError(error) };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

// Probes {baseUrl}/.well-known/smart-configuration + {baseUrl}/metadata and
// returns the classified conformance sub-doc. NEVER throws.
export async function probeEndpoint({ baseUrl, fetchImpl, timeoutMs = DEFAULT_TIMEOUT_MS, now = function() { return new Date(); } } = {}) {
  const startedAt = Date.now();

  function baseResult() {
    return {
      lastProbedAt: now(),
      reachable: false,
      healthTag: 'down',
      httpStatus: 0,
      tlsOk: false,
      probeMs: Date.now() - startedAt,
      fhirVersion: '',
      softwareName: '',
      softwareVersion: '',
      security: '',
      bulkExport: false,
      resources: [],
      usCoreHint: false,
      smart: classifySmartConfig(null),
      vendor: 'unknown',
      patientLaunchable: false
    };
  }

  try {
    const blocked = isBlockedBaseUrl(baseUrl);
    if (blocked) {
      const result = baseResult();
      result.probeError = blocked;
      return result;
    }

    const base = String(baseUrl).replace(/\/+$/, '');
    const [smartFetch, metadataFetch] = await Promise.all([
      fetchJson(fetchImpl, base + '/.well-known/smart-configuration', timeoutMs),
      fetchJson(fetchImpl, base + '/metadata', timeoutMs)
    ]);

    const result = baseResult();
    result.httpStatus = metadataFetch.status || smartFetch.status || 0;
    result.reachable = smartFetch.ok || metadataFetch.ok;
    result.tlsOk = result.reachable;
    result.probeMs = Date.now() - startedAt;

    if (metadataFetch.ok) {
      Object.assign(result, classifyCapabilityStatement(metadataFetch.json));
    }
    if (smartFetch.ok) {
      result.smart = classifySmartConfig(smartFetch.json);
    }

    const vendor = classifyVendor({ baseUrl: base, softwareName: result.softwareName });
    result.vendor = vendor.vendor;

    const grade = gradeReadiness(Object.assign({}, result, {
      smartConfigOk: smartFetch.ok,
      metadataOk: metadataFetch.ok
    }));
    result.healthTag = grade.healthTag;
    result.patientLaunchable = grade.patientLaunchable;

    if (!result.reachable) {
      result.probeError = redactError(metadataFetch.error || smartFetch.error || 'unreachable');
    }

    return result;
  } catch (error) {
    // Belt and suspenders — the contract says never throw.
    const result = baseResult();
    result.probeMs = Date.now() - startedAt;
    result.probeError = redactError(error);
    return result;
  }
}
