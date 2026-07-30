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

const RESULT_LIMIT_DEFAULT = 8;
const RESULT_LIMIT_MAX = 25;
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
    projection: { name: 1, alias: 1, address: 1, telecom: 1, active: 1, id: 1 }
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
  },
  {
    resourceName: 'Endpoint',
    nameFields: ['name', 'address'],
    projection: { name: 1, address: 1, status: 1, connectionType: 1, managingOrganization: 1, id: 1 }
  }
];

function buildNameSelector(nameFields, regex, extra) {
  const or = nameFields.map(function(field) {
    const clause = {};
    clause[field] = regex;
    return clause;
  });
  const selector = or.length === 1 ? or[0] : { $or: or };
  return Object.assign({}, selector, extra);
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

async function searchOneType(target, q, facets, limit) {
  const raw = getDirectoryCollection(target.resourceName).rawCollection();
  const escaped = escapeRegex(q);
  const prefixRegex = { $regex: '^' + escaped, $options: 'i' };
  const prefixSelector = buildNameSelector(target.nameFields, prefixRegex, facets);

  let hits = await raw.find(prefixSelector, { projection: target.projection })
    .limit(limit)
    .maxTimeMS(PRIMARY_TIMEOUT_MS)
    .toArray()
    .catch(function() { return []; });

  let matchCount = await raw.countDocuments(prefixSelector, {
    limit: COUNT_CAP,
    maxTimeMS: PRIMARY_TIMEOUT_MS
  }).catch(function() { return hits.length; });

  // Wide-band pass — mid-string matches when the prefix pass ran thin.
  if (hits.length < 3 && q.length >= WIDEBAND_MIN_QUERY) {
    const wideRegex = { $regex: escaped, $options: 'i' };
    const wideSelector = buildNameSelector(target.nameFields, wideRegex, facets);
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

Meteor.ServerMethods.define('providerDirectory.omniSearch', {
  description: 'Free-text search across the National Directory (organizations, practitioners, locations, endpoints) with bounded counts and estimated totals.',
  requireAuth: false,
  positionalParams: ['q'],
  schemaObject: {
    type: 'object',
    properties: {
      q: { type: 'string' },
      city: { type: 'string' },
      state: { type: 'string' },
      postalCode: { type: 'string' },
      limit: { type: 'number' }
    },
    required: ['q']
  }
}, async function(params, context) {
  const q = (get(params, 'q', '') || '').trim();
  const limit = Math.min(Math.max(get(params, 'limit', RESULT_LIMIT_DEFAULT), 1), RESULT_LIMIT_MAX);
  const facets = buildFacetSelector(params);
  const startedAt = Date.now();

  // Fast estimated totals for the stat ticker — always returned, even for an
  // empty query, so the console can render the grid census on load.
  const totals = {};
  await Promise.all(SEARCH_TARGETS.map(async function(target) {
    totals[target.resourceName] = await getDirectoryCollection(target.resourceName)
      .rawCollection().estimatedDocumentCount()
      .catch(function() { return 0; });
  }));

  if (q.length < 2) {
    return { q: q, totals: totals, results: [], searchMs: Date.now() - startedAt };
  }

  const results = await Promise.all(SEARCH_TARGETS.map(function(target) {
    return searchOneType(target, q, facets, limit);
  }));

  const searchMs = Date.now() - startedAt;
  console.log('[provider-directory] omniSearch "' + q + '" → ' +
    results.map(function(r) { return r.resourceName + ':' + r.matchCount + (r.countCapped ? '+' : ''); }).join(' ') +
    ' in ' + searchMs + 'ms');

  return { q: q, totals: totals, results: results, searchMs: searchMs };
});
