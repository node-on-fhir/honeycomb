// npmPackages/provider-directory/server/methods.searchIndex.js
//
// nameLower shadow-field backfill for the directory search indexes.
//
//   providerDirectory.searchIndexStatus   — per-collection {total, missing, ready}
//   providerDirectory.backfillSearchIndex — background job: one server-side
//     updateMany (aggregation pipeline, lib/searchShadow.js) per collection.
//
// The backfill is BUTTON-triggered, never automatic — an unsolicited write
// over 4.7M documents on boot of a desktop app is hostile. It is idempotent
// by construction: the filter only matches docs missing the shadow, and the
// hydration writers (installResource, lantern bulkUpsertEndpoints) stamp new
// rows going forward, so re-runs converge to zero work.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { getDirectoryCollection } from '../lib/DirectoryCollections.js';
import { Endpoints as CoreEndpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints.js';
import { nameLowerPipeline, backfillFilter } from '../lib/searchShadow.js';

const log = (Meteor.Logger ? Meteor.Logger.for('provider-directory') : console);

const CONFIG_TYPE = 'directorySearchIndex';
const MISSING_COUNT_CAP = 1001;   // "1000+" is enough signal for the UI
const COUNT_TIMEOUT_MS = 5000;

// One backfill at a time (module-level; mirrors methods.directory.js activeJob).
let backfillRunning = false;

// The five searchable surfaces. resourceName drives the pipeline/filter
// shape (Practitioner is the multikey special case); core Endpoints reuses
// the Endpoint scalar shape.
function backfillTargets() {
  return [
    { label: 'Directory.Organizations', resourceName: 'Organization', collection: getDirectoryCollection('Organization') },
    { label: 'Directory.Locations', resourceName: 'Location', collection: getDirectoryCollection('Location') },
    { label: 'Directory.Practitioners', resourceName: 'Practitioner', collection: getDirectoryCollection('Practitioner') },
    { label: 'Directory.Endpoints', resourceName: 'Endpoint', collection: getDirectoryCollection('Endpoint') },
    { label: 'Endpoints', resourceName: 'Endpoint', collection: CoreEndpoints }
  ];
}

async function stampProgress(patch) {
  const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
  if (!ServerConfiguration) {
    return;
  }
  const existing = await ServerConfiguration.findOneAsync({ configType: CONFIG_TYPE });
  const nextData = Object.assign({}, get(existing, 'data', {}), patch);
  if (existing) {
    await ServerConfiguration.updateAsync({ _id: existing._id }, { $set: { data: nextData, updatedAt: new Date() } });
  } else {
    await ServerConfiguration.insertAsync({ configType: CONFIG_TYPE, data: nextData, updatedAt: new Date() });
  }
}

async function runBackfill() {
  const startedAt = new Date();
  const summary = [];
  try {
    for (const target of backfillTargets()) {
      if (!target.collection) {
        continue;
      }
      await stampProgress({ running: true, phase: target.label, startedAt: startedAt });
      const t0 = Date.now();
      const result = await target.collection.rawCollection().updateMany(
        backfillFilter(target.resourceName),
        nameLowerPipeline(target.resourceName)
      );
      const entry = { collection: target.label, modified: result.modifiedCount, ms: Date.now() - t0 };
      summary.push(entry);
      log.info('search-index backfill pass complete', entry);
    }
  } catch (error) {
    log.error('search-index backfill failed', { error: error.message });
    await stampProgress({ running: false, error: error.message, finishedAt: new Date() });
    return;
  } finally {
    backfillRunning = false;
  }
  await stampProgress({ running: false, phase: 'done', summary: summary, error: null, finishedAt: new Date() });
  log.info('search-index backfill complete', { collections: summary.length });
}

Meteor.ServerMethods.define('providerDirectory.searchIndexStatus', {
  description: 'Per-collection readiness of the nameLower search shadow (total, missing, ready).',
  requireAuth: false,
  positionalParams: [],
  schemaObject: { type: 'object', properties: {} }
}, async function (params, context) {
  const collections = [];
  for (const target of backfillTargets()) {
    if (!target.collection) {
      continue;
    }
    const raw = target.collection.rawCollection();
    const total = await raw.estimatedDocumentCount().catch(function () { return 0; });
    const missing = await raw.countDocuments(backfillFilter(target.resourceName), {
      limit: MISSING_COUNT_CAP,
      maxTimeMS: COUNT_TIMEOUT_MS
    }).catch(function () { return -1; });
    collections.push({
      collection: target.label,
      total: total,
      missing: missing,
      missingCapped: missing >= MISSING_COUNT_CAP,
      ready: missing === 0
    });
  }

  let progress = null;
  const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
  if (ServerConfiguration) {
    const doc = await ServerConfiguration.findOneAsync({ configType: CONFIG_TYPE });
    progress = get(doc, 'data', null);
  }
  return { collections: collections, running: backfillRunning, progress: progress };
});

Meteor.ServerMethods.define('providerDirectory.backfillSearchIndex', {
  description: 'Backfill the nameLower search shadow across the directory collections (background job; poll searchIndexStatus).',
  requireAuth: true,
  positionalParams: [],
  schemaObject: { type: 'object', properties: {} }
}, async function (params, context) {
  if (backfillRunning) {
    throw new Meteor.Error('busy', 'A search-index backfill is already running.');
  }
  backfillRunning = true;
  // Fire and return — the panel polls providerDirectory.searchIndexStatus.
  runBackfill().catch(function (error) {
    backfillRunning = false;
    log.error('search-index backfill crashed', { error: error.message });
  });
  return { started: true };
});
