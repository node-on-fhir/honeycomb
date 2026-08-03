// npmPackages/provider-directory/server/methods.omniSearch.js
//
// providerDirectory.omniSearch — the free-text "hail the grid" search behind
// the /provider-directory console. One query string, searched across the
// Directory.* collections in parallel, returning top matches + bounded match
// counts per resource type, plus fast estimated totals for the stat ticker.
//
// Performance posture (millions of rows, no text index):
//   - primary pass: case-insensitive PREFIX regex on the name field, bounded
//     by limit + maxTimeMS — worst case a capped scan, typical case fast;
//   - wide-band pass: if the prefix pass comes back thin and the query is
//     long enough, one unanchored pass (also time-boxed) fills in mid-string
//     matches;
//   - counts: countDocuments with {limit: COUNT_CAP} so the UI can render
//     "1,000+" instead of paying for a full count;
//   - totals: estimatedDocumentCount (collection metadata, effectively free).
//
// Public directory data (NPPES-derived, no PHI) — requireAuth: false, same
// posture as providerDirectory.directoryCounts.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { getDirectoryCollection } from '../lib/DirectoryCollections.js';
import { Endpoints as CoreEndpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints.js';
import { backfillFilter } from '../lib/searchShadow.js';

// Endpoints live in TWO physical collections (a deliberate scale split — see
// lib/DirectoryCollections.js): the CMS National Directory mirror
// (Directory.Endpoints, ~630K, mostly Direct secure-messaging) and the core
// Endpoints collection (~91K: lantern / epic-open / cerner-ignite — the
// connectable FHIR base URLs the spider probes and /patient-fetch launches
// against). We unify them at the READ layer here, tagging each hit with its
// meta.source lineage so the console shows one logical directory.

// 200 per band by default (operator decision 2026-08-01): with the nameLower
// indexes the query cost is trivial, and the console renders whole cohorts
// (e.g. all 167 Deaconess-Evansville orgs) instead of an unreachable tail.
// LOAD MORE pages the rest via {resourceName, skip}.
const RESULT_LIMIT_DEFAULT = 200;
const RESULT_LIMIT_MAX = 500;
const COUNT_CAP = 1000;
const PRIMARY_TIMEOUT_MS = 5000;
const WIDEBAND_TIMEOUT_MS = 3000;
const WIDEBAND_MIN_QUERY = 4;

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Per-type search descriptors: which fields the free text runs against and
// which fields ship to the client (keep the wire payload lean).
const SEARCH_TARGETS = [
  {
    resourceName: 'Organization',
    nameFields: ['name'],
    // endpoint + _linkage feed the console's "CONNECT VIA" chip (methods.linkage.js)
    projection: { name: 1, alias: 1, address: 1, telecom: 1, active: 1, id: 1, endpoint: 1, _linkage: 1 }
  },
  {
    resourceName: 'Practitioner',
    nameFields: ['name.text', 'name.family'],
    projection: { name: 1, address: 1, telecom: 1, qualification: 1, active: 1, id: 1 }
  },
  {
    resourceName: 'Location',
    nameFields: ['name'],
    projection: { name: 1, address: 1, telecom: 1, status: 1, id: 1 }
  }
];

// Endpoint is special-cased (unified across both collections), so it carries
// meta + connectionType in its projection to derive source + connectability.
const ENDPOINT_TARGET = {
  resourceName: 'Endpoint',
  nameFields: ['name', 'address'],
  projection: { name: 1, address: 1, status: 1, connectionType: 1, managingOrganization: 1, meta: 1, id: 1 }
};

// meta.tag.code → the source chip the console shows. Core Endpoints carry
// lantern / epic-open / cerner-ignite; Directory.Endpoints (NPPES) carry none,
// so we label those 'nppes' by origin collection.
function endpointSourceLabel(hit, originIsCore) {
  const tags = get(hit, 'meta.tag', []);
  const code = Array.isArray(tags) && tags.length ? get(tags, '0.code') : null;
  if (code === 'epic-open') { return 'epic'; }
  if (code === 'cerner-ignite') { return 'cerner'; }
  if (code === 'lantern') { return 'lantern'; }
  return originIsCore ? 'other' : 'nppes';
}

// connectionType code → is this a SMART-launchable FHIR REST endpoint (vs a
// Direct secure-messaging address)? Handles the several shapes it comes in.
function isConnectable(hit) {
  const ct = get(hit, 'connectionType');
  let code = null;
  if (Array.isArray(ct)) {
    code = get(ct, '0.coding.0.code') || get(ct, '0.code');
  } else if (ct && typeof ct === 'object') {
    code = get(ct, 'coding.0.code') || get(ct, 'code');
  }
  return code === 'hl7-fhir-rest';
}

function buildNameSelector(nameFields, regex, extra) {
  const or = nameFields.map(function(field) {
    const clause = {};
    clause[field] = regex;
    return clause;
  });
  const selector = or.length === 1 ? or[0] : { $or: or };
  return Object.assign({}, selector, extra);
}

// ---------------------------------------------------------------------------
// nameLower shadow readiness (lib/searchShadow.js)
//
// When a collection's shadow backfill is complete, the primary pass switches
// from `$regex ^q i` on the name fields (unindexable) to a CASE-SENSITIVE
// `^q.toLowerCase()` regex on the indexed nameLower field. Until then, the
// legacy selector runs unchanged. Readiness is a capped count (limit 1) with
// a 60s TTL cache — cheap, and self-heals after an NPPES re-install wipes
// shadows (replaceOne) or a backfill completes.

const SHADOW_TTL_MS = 60 * 1000;
const shadowReadiness = new Map();   // cacheKey -> { ready, checkedAt }

async function isShadowReady(rawCollection, resourceName, cacheKey) {
  const cached = shadowReadiness.get(cacheKey);
  // STICKY once ready: proving "zero missing" is a full-collection scan
  // (there is no index on field absence), so a ready verdict holds for the
  // process lifetime. Safe because every writer stamps nameLower at write
  // time — this probe only bridges the pre-backfill window. Not-ready
  // verdicts recheck on the TTL so a finished backfill is picked up.
  if (cached && cached.ready) {
    return true;
  }
  if (cached && (Date.now() - cached.checkedAt) < SHADOW_TTL_MS) {
    return cached.ready;
  }
  let ready = false;
  try {
    const missing = await rawCollection.countDocuments(backfillFilter(resourceName), {
      limit: 1,
      maxTimeMS: 2000
    });
    ready = missing === 0;
  } catch (error) {
    ready = false;
  }
  shadowReadiness.set(cacheKey, { ready: ready, checkedAt: Date.now() });
  return ready;
}

// Warm the readiness cache off the boot path so no user's first search pays
// the proof-of-zero-missing collection scans (one-time per process).
Meteor.startup(function() {
  Meteor.setTimeout(async function() {
    const warmTargets = [
      { resourceName: 'Organization', cacheKey: 'Organization' },
      { resourceName: 'Practitioner', cacheKey: 'Practitioner' },
      { resourceName: 'Location', cacheKey: 'Location' },
      { resourceName: 'Endpoint', cacheKey: 'Endpoint.core', raw: function() { return CoreEndpoints.rawCollection(); } },
      { resourceName: 'Endpoint', cacheKey: 'Endpoint.directory', raw: function() { return getDirectoryCollection('Endpoint').rawCollection(); } }
    ];
    for (const target of warmTargets) {
      const raw = target.raw ? target.raw() : getDirectoryCollection(target.resourceName).rawCollection();
      await isShadowReady(raw, target.resourceName, target.cacheKey).catch(function() {});
    }
    console.log('[provider-directory] search shadow readiness warmed');
  }, 20 * 1000);
});

// Selector builder that understands both modes. Endpoint keeps its address
// branch (URLs are effectively lowercase already; queried as typed, anchored
// or not, so the $or stays fully indexed alongside {address:1}).
function buildModeSelector(target, q, facets, { useShadow, anchored }) {
  const escaped = escapeRegex(q);
  if (!useShadow) {
    const regex = anchored
      ? { $regex: '^' + escaped, $options: 'i' }
      : { $regex: escaped, $options: 'i' };
    return buildNameSelector(target.nameFields, regex, facets);
  }
  const lowered = escapeRegex(q.toLowerCase());
  const shadowRegex = anchored ? { $regex: '^' + lowered } : { $regex: lowered };
  const clauses = [{ nameLower: shadowRegex }];
  if (target.nameFields.indexOf('address') >= 0) {
    clauses.push({ address: anchored ? { $regex: '^' + escaped } : { $regex: escaped } });
  }
  const selector = clauses.length === 1 ? clauses[0] : { $or: clauses };
  return Object.assign({}, selector, facets);
}

// Optional facet narrowing (the "precision scan" drawer).
function buildFacetSelector(params) {
  const extra = {};
  const city = (get(params, 'city', '') || '').trim();
  const state = (get(params, 'state', '') || '').trim();
  const postalCode = (get(params, 'postalCode', '') || '').trim();
  if (city) {
    extra['address.city'] = { $regex: '^' + escapeRegex(city), $options: 'i' };
  }
  if (state) {
    extra['address.state'] = { $regex: '^' + escapeRegex(state), $options: 'i' };
  }
  if (postalCode) {
    extra['address.postalCode'] = { $regex: '^' + escapeRegex(postalCode) };
  }
  return extra;
}

async function searchOneType(target, q, facets, limit, rawOverride, cacheKey, skip) {
  const raw = rawOverride || getDirectoryCollection(target.resourceName).rawCollection();
  const useShadow = await isShadowReady(raw, target.resourceName, cacheKey || target.resourceName);
  const prefixSelector = buildModeSelector(target, q, facets, { useShadow: useShadow, anchored: true });
  const offset = skip > 0 ? skip : 0;

  let hits = await raw.find(prefixSelector, { projection: target.projection })
    .skip(offset)
    .limit(limit)
    .maxTimeMS(PRIMARY_TIMEOUT_MS)
    .toArray()
    .catch(function() { return []; });

  let matchCount = await raw.countDocuments(prefixSelector, {
    limit: COUNT_CAP,
    maxTimeMS: PRIMARY_TIMEOUT_MS
  }).catch(function() { return hits.length; });

  // Wide-band pass — mid-string matches when the prefix pass ran thin.
  // (Still a scan either way, but case-sensitive on nameLower is several
  // times cheaper than $options:'i' over the raw name fields.) First page
  // only — LOAD MORE pages walk the stable prefix selector, and the client
  // dedupes by _id anyway.
  if (offset === 0 && hits.length < 3 && q.length >= WIDEBAND_MIN_QUERY) {
    const wideSelector = buildModeSelector(target, q, facets, { useShadow: useShadow, anchored: false });
    const wideHits = await raw.find(wideSelector, { projection: target.projection })
      .limit(limit)
      .maxTimeMS(WIDEBAND_TIMEOUT_MS)
      .toArray()
      .catch(function() { return []; });
    const seen = new Set(hits.map(function(hit) { return String(hit._id); }));
    for (const hit of wideHits) {
      if (!seen.has(String(hit._id)) && hits.length < limit) {
        hits.push(hit);
      }
    }
    if (wideHits.length > matchCount) {
      matchCount = wideHits.length;
    }
  }

  return {
    resourceName: target.resourceName,
    matchCount: matchCount,
    countCapped: matchCount >= COUNT_CAP,
    hits: hits
  };
}

// Unified Endpoint band: search BOTH the connectable core Endpoints collection
// and the NPPES Directory.Endpoints mirror, tag each hit with its source +
// connectability, and interleave with connectable (FHIR REST) results first so
// the actionable endpoints surface at the top.
async function searchEndpointsUnified(q, facets, limit, skip) {
  const coreRaw = CoreEndpoints.rawCollection();
  const directoryRaw = getDirectoryCollection('Endpoint').rawCollection();

  // Pagination note: skip applies to BOTH collections, so a page can carry up
  // to 2×limit candidates before the merge trims to limit — approximate but
  // stable for console browsing, and the client dedupes appended pages by _id.
  const [core, directory] = await Promise.all([
    searchOneType(ENDPOINT_TARGET, q, facets, limit, coreRaw, 'Endpoint.core', skip),
    searchOneType(ENDPOINT_TARGET, q, facets, limit, directoryRaw, 'Endpoint.directory', skip)
  ]);

  const coreHits = core.hits.map(function(hit) {
    return Object.assign({}, hit, {
      _source: endpointSourceLabel(hit, true),
      _connectable: isConnectable(hit)
    });
  });
  const directoryHits = directory.hits.map(function(hit) {
    return Object.assign({}, hit, {
      _source: endpointSourceLabel(hit, false),
      _connectable: isConnectable(hit)
    });
  });

  // Connectable (FHIR REST) first, then the rest; cap at limit.
  const merged = coreHits.concat(directoryHits);
  merged.sort(function(a, b) { return (b._connectable ? 1 : 0) - (a._connectable ? 1 : 0); });

  return {
    resourceName: 'Endpoint',
    matchCount: core.matchCount + directory.matchCount,
    countCapped: core.countCapped || directory.countCapped,
    hits: merged.slice(0, limit)
  };
}

Meteor.ServerMethods.define('providerDirectory.omniSearch', {
  description: 'Free-text search across the National Directory (organizations, practitioners, locations, endpoints) with bounded counts and estimated totals. Pass resourceName + skip to page a single band (LOAD MORE).',
  requireAuth: false,
  positionalParams: ['q'],
  schemaObject: {
    type: 'object',
    properties: {
      q: { type: 'string' },
      city: { type: 'string' },
      state: { type: 'string' },
      postalCode: { type: 'string' },
      limit: { type: 'number' },
      resourceName: { type: 'string', enum: ['Organization', 'Practitioner', 'Location', 'Endpoint'] },
      skip: { type: 'number' }
    },
    required: ['q']
  }
}, async function(params, context) {
  const q = (get(params, 'q', '') || '').trim();
  const limit = Math.min(Math.max(get(params, 'limit', RESULT_LIMIT_DEFAULT), 1), RESULT_LIMIT_MAX);
  const skip = Math.max(get(params, 'skip', 0), 0);
  const onlyResource = get(params, 'resourceName', null);
  const facets = buildFacetSelector(params);
  const startedAt = Date.now();

  // Single-band page (LOAD MORE): skip the totals/lastUpdated ceremony and
  // return just the requested band.
  if (onlyResource && q.length >= 2) {
    const band = onlyResource === 'Endpoint'
      ? await searchEndpointsUnified(q, {}, limit, skip)
      : await searchOneType(
          SEARCH_TARGETS.find(function(t) { return t.resourceName === onlyResource; }),
          q, facets, limit, null, onlyResource, skip
        );
    const pageMs = Date.now() - startedAt;
    console.log('[provider-directory] omniSearch page "' + q + '" ' + onlyResource +
      ' skip=' + skip + ' → ' + band.hits.length + ' in ' + pageMs + 'ms');
    return { q: q, results: [band], searchMs: pageMs };
  }

  // Last-updated signal for the masthead: the most recent endpoint-directory
  // sync (lantern/epic/cerner all stamp ServerConfiguration.lanternSync.lastSyncAt).
  // The NPPES national install writes no timestamp, so this reflects the
  // connectable-endpoint hydration — the part that actually changes.
  let lastUpdated = null;
  try {
    const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
    if (ServerConfiguration) {
      const doc = await ServerConfiguration.findOneAsync({ configType: 'lanternSync' });
      const stamp = get(doc, 'data.lastSyncAt', null);
      lastUpdated = stamp ? new Date(stamp).toISOString() : null;
    }
  } catch (error) {
    lastUpdated = null;
  }

  // Fast estimated totals for the stat ticker — always returned, even for an
  // empty query, so the console can render the grid census on load. Endpoint
  // total is the union of both collections (Directory mirror + connectable core).
  const totals = {};
  await Promise.all(SEARCH_TARGETS.map(async function(target) {
    totals[target.resourceName] = await getDirectoryCollection(target.resourceName)
      .rawCollection().estimatedDocumentCount()
      .catch(function() { return 0; });
  }));
  const [directoryEndpointCount, coreEndpointCount] = await Promise.all([
    getDirectoryCollection('Endpoint').rawCollection().estimatedDocumentCount().catch(function() { return 0; }),
    CoreEndpoints.rawCollection().estimatedDocumentCount().catch(function() { return 0; })
  ]);
  totals.Endpoint = directoryEndpointCount + coreEndpointCount;

  if (q.length < 2) {
    return { q: q, totals: totals, lastUpdated: lastUpdated, results: [], searchMs: Date.now() - startedAt };
  }

  // Postal facets (city/state/postalCode) never apply to the Endpoint band:
  // FHIR Endpoint.address is a URL, not an Address, so any geographic facet
  // would silence the band entirely (address.city can never match). Narrow
  // the org/practitioner/location bands and let endpoints ride the free text.
  const results = await Promise.all(
    SEARCH_TARGETS.map(function(target) { return searchOneType(target, q, facets, limit); })
      .concat([searchEndpointsUnified(q, {}, limit)])
  );

  const searchMs = Date.now() - startedAt;
  console.log('[provider-directory] omniSearch "' + q + '" → ' +
    results.map(function(r) { return r.resourceName + ':' + r.matchCount + (r.countCapped ? '+' : ''); }).join(' ') +
    ' in ' + searchMs + 'ms');

  return { q: q, totals: totals, lastUpdated: lastUpdated, results: results, searchMs: searchMs };
});
