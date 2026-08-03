// npmPackages/provider-directory/server/startup.indexes.js
//
// Directory search indexes. omniSearch queries the nameLower shadow field
// (lib/searchShadow.js) with case-sensitive ^prefix regexes, which are
// index-bounded — these indexes are what turn the 5s directory search into
// a sub-second one. {address:1} on the two Endpoint collections keeps the
// unified endpoint band's $or fully indexed (one unindexable branch would
// degrade the whole $or to a scan).
//
// createIndexAsync is idempotent (no-op when the index already exists).
// Index creation is safe BEFORE the backfill runs — docs without the field
// simply index as null and never match a ^prefix regex.

import { Meteor } from 'meteor/meteor';
import { getDirectoryCollection } from '../lib/DirectoryCollections.js';
import { Endpoints as CoreEndpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints.js';

const log = (Meteor.Logger ? Meteor.Logger.for('provider-directory') : console);

Meteor.startup(async function () {
  const specs = [
    { label: 'Directory.Organizations', collection: getDirectoryCollection('Organization'), keys: [{ nameLower: 1 }, { '_linkage.runId': 1 }] },
    { label: 'Directory.Locations', collection: getDirectoryCollection('Location'), keys: [{ nameLower: 1 }] },
    { label: 'Directory.Practitioners', collection: getDirectoryCollection('Practitioner'), keys: [{ nameLower: 1 }] },
    { label: 'Directory.Endpoints', collection: getDirectoryCollection('Endpoint'), keys: [{ nameLower: 1 }, { address: 1 }] },
    { label: 'Endpoints (core)', collection: CoreEndpoints, keys: [{ nameLower: 1 }, { address: 1 }] }
  ];

  for (const spec of specs) {
    if (!spec.collection) {
      log.warn('search index skipped — collection missing', { label: spec.label });
      continue;
    }
    for (const keys of spec.keys) {
      try {
        // _linkage.runId is sparse — only linked orgs carry it (WS3 prune/stats).
        const options = keys['_linkage.runId'] ? { sparse: true } : {};
        await spec.collection.createIndexAsync(keys, options);
      } catch (error) {
        log.warn('search index create failed', { label: spec.label, keys: keys, error: error.message });
      }
    }
  }
  log.info('directory search indexes ensured');
});
