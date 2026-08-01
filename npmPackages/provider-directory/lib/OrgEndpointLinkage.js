// npmPackages/provider-directory/lib/OrgEndpointLinkage.js
//
// Tier-1 org→endpoint linkage: connect NPPES Directory.Organizations rows to
// connectable core Endpoints so the console can offer "Connect via <endpoint>"
// on org rows. PRECISION OVER RECALL — a wrong link sends a patient to the
// wrong health system's login. Tier-1 is EXACT normalized-name membership:
//
//   - lantern endpoints: `name` is a semicolon-joined list of the org names
//     the endpoint serves (Lantern's api_information_source_name) — exact
//     membership is the strongest evidence available ('lantern-list')
//   - epic-open / cerner-ignite: the health-system display name (+ cerner
//     alias / managingOrganization.display) — national brand names
//     ('vendor-name')
//
// Named traps this design handles:
//   - Beth Israel Deaconess never links via a Deaconess-Evansville name:
//     exact equality after normalization, no token matching.
//   - Homonym orgs (Spokane's "Deaconess Hospital" in an athena list vs
//     Evansville's NPPES org of the same name): 'lantern-list' evidence is
//     flagged requiresLocalityGuard — the worker refuses the link when NPPES
//     orgs sharing that name span multiple states. 'vendor-name' evidence
//     skips the guard (health systems are multi-state by nature).
//   - Generic names ("clinic", "family medicine") and short names never link.
//   - A name appearing in MULTIPLE lantern endpoints' lists is ambiguous
//     (genuinely different practices share names nationally) — refused.
//
// Pure and dependency-free: node --test via
// tests/unit/npmPackages/provider-directory/OrgEndpointLinkage.test.mjs
// (npm run test:org-linkage). The worker (server/methods.linkage.js) streams
// orgs through matchOrgTier1 and applies the locality guard.

export const LEGAL_SUFFIXES = new Set([
  'inc', 'incorporated', 'llc', 'llp', 'lp', 'ltd', 'limited',
  'pc', 'pa', 'pllc', 'psc', 'sc', 'co', 'corp', 'corporation'
]);

export const GENERIC_NAMES = new Set([
  'clinic', 'hospital', 'medical center', 'the medical center', 'medical group',
  'family medicine', 'family practice', 'family medicine associates',
  'pharmacy', 'urgent care', 'health center', 'community health center',
  'medical associates', 'health system', 'primary care', 'internal medicine',
  'pediatrics', 'womens health', 'behavioral health', 'wellness center'
]);

const MIN_NAME_LENGTH = 5;

// Tag rank for same-name preference (lower = better).
const TAG_RANK = { 'epic-open': 0, 'cerner-ignite': 1, 'epic-sandbox': 2, 'lantern': 3 };
const VENDOR_TAGS = new Set(['epic-open', 'cerner-ignite']);

// casefold → '&'→' and ' → punctuation→spaces → collapse → strip trailing
// legal-suffix tokens (repeatedly: "x inc llc" → "x", but never empty a name).
export function normalizeOrgName(raw) {
  if (typeof raw !== 'string') {
    return '';
  }
  let normalized = raw.toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\./g, '')            // "P.C." → "pc" before punctuation splits it into "p c"
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  for (;;) {
    const tokens = normalized.split(' ');
    if (tokens.length < 2) {
      break;
    }
    const last = tokens[tokens.length - 1];
    if (!LEGAL_SUFFIXES.has(last)) {
      break;
    }
    tokens.pop();
    normalized = tokens.join(' ');
  }
  return normalized;
}

function endpointTag(endpointDoc) {
  const tags = (endpointDoc && endpointDoc.meta && endpointDoc.meta.tag) || [];
  return (Array.isArray(tags) && tags.length && tags[0].code) || 'unknown';
}

// The display names an endpoint serves, per lineage shape. Deduped by
// normalized form; empty normals dropped.
export function splitEndpointDisplayNames(endpointDoc) {
  const tag = endpointTag(endpointDoc);
  const rawNames = [];
  const name = endpointDoc && endpointDoc.name;
  if (tag === 'lantern') {
    if (typeof name === 'string') {
      name.split(';').forEach(function (part) { rawNames.push(part.trim()); });
    }
  } else {
    if (typeof name === 'string') {
      rawNames.push(name.trim());
    }
    if (Array.isArray(endpointDoc && endpointDoc.alias)) {
      endpointDoc.alias.forEach(function (alias) {
        if (typeof alias === 'string') { rawNames.push(alias.trim()); }
      });
    }
    const managing = endpointDoc && endpointDoc.managingOrganization && endpointDoc.managingOrganization.display;
    if (typeof managing === 'string') {
      rawNames.push(managing.trim());
    }
  }
  const seen = new Set();
  const names = [];
  for (const raw of rawNames) {
    const normalized = normalizeOrgName(raw);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    names.push({ raw: raw, normalized: normalized });
  }
  return names;
}

// normalizedName -> [{ endpointId, tagCode, rawName, patientLaunchable }]
export function buildEndpointNameIndex(endpointDocs) {
  const exact = new Map();
  for (const doc of endpointDocs || []) {
    const tag = endpointTag(doc);
    const launchable = !!(doc && doc.conformance && doc.conformance.patientLaunchable);
    for (const name of splitEndpointDisplayNames(doc)) {
      if (!exact.has(name.normalized)) {
        exact.set(name.normalized, []);
      }
      exact.get(name.normalized).push({
        endpointId: doc._id,
        tagCode: tag,
        rawName: name.raw,
        patientLaunchable: launchable
      });
    }
  }
  return { exact: exact };
}

function pickPreferred(entries) {
  const sorted = entries.slice().sort(function (a, b) {
    if (a.patientLaunchable !== b.patientLaunchable) {
      return a.patientLaunchable ? -1 : 1;
    }
    const rankA = TAG_RANK[a.tagCode] !== undefined ? TAG_RANK[a.tagCode] : 9;
    const rankB = TAG_RANK[b.tagCode] !== undefined ? TAG_RANK[b.tagCode] : 9;
    return rankA - rankB;
  });
  return sorted[0];
}

// Exact-membership match with the tier-1 guards. Returns null (no link) or:
//   { endpointId, endpointTag, rawName, evidence, confidence,
//     requiresLocalityGuard }
export function matchOrgTier1(normalizedOrgName, index) {
  if (!normalizedOrgName || normalizedOrgName.length < MIN_NAME_LENGTH) {
    return null;
  }
  if (GENERIC_NAMES.has(normalizedOrgName)) {
    return null;
  }
  const entries = index.exact.get(normalizedOrgName);
  if (!entries || !entries.length) {
    return null;
  }

  const vendorEntries = entries.filter(function (e) { return VENDOR_TAGS.has(e.tagCode); });
  if (vendorEntries.length) {
    // A national system name. Multi-endpoint same-name is fine within the
    // vendor lists (prefer launchable, then tag rank).
    const preferred = pickPreferred(vendorEntries);
    return {
      endpointId: preferred.endpointId,
      endpointTag: preferred.tagCode,
      rawName: preferred.rawName,
      evidence: 'vendor-name',
      confidence: 0.95,
      requiresLocalityGuard: false
    };
  }

  // Lantern-list-only evidence: refuse when the same name appears in the
  // lists of DIFFERENT endpoints — genuinely distinct practices share names
  // nationally, and we cannot tell which one the org is.
  const distinctEndpoints = new Set(entries.map(function (e) { return String(e.endpointId); }));
  if (distinctEndpoints.size > 1) {
    return null;
  }
  const preferred = pickPreferred(entries);
  return {
    endpointId: preferred.endpointId,
    endpointTag: preferred.tagCode,
    rawName: preferred.rawName,
    evidence: 'lantern-list',
    confidence: 0.85,
    requiresLocalityGuard: true
  };
}

// Homonym tell for lantern-list evidence: the NPPES orgs sharing a matched
// name must sit in (at most) one state. Missing/empty states are ignored;
// a group with no state data at all has nothing contradicting locality.
export function passesLocalityGuard(states) {
  const distinct = new Set();
  for (const state of states || []) {
    if (typeof state === 'string' && state.trim()) {
      distinct.add(state.trim().toUpperCase());
    }
  }
  return distinct.size <= 1;
}
