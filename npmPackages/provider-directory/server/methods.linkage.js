// npmPackages/provider-directory/server/methods.linkage.js
//
// Org→Endpoint tier-1 linkage worker + methods (lib/OrgEndpointLinkage.js is
// the pure matcher). Streams the 2.69M NPPES Directory.Organizations rows
// through an in-memory endpoint-name hash join and writes FHIR-native links:
//
//   Organization.endpoint = [{ reference: 'Endpoint/<id>', display }]
//   Organization._linkage = { method, evidence, confidence, endpointId,
//                             endpointTag, matchedName, patientLaunchable,
//                             linkedAt, runId }
//
// Every link is auditable (_linkage provenance), reversible (clearLinkage),
// and idempotent (re-runs converge; prune drops links not re-confirmed by
// the current run). Lantern-list evidence passes the locality guard first:
// candidate orgs sharing the matched name must sit in a single state, or the
// whole name group is refused (the Spokane-vs-Evansville homonym trap).
//
//   providerDirectory.linkEndpoints  — background job {dryRun, prune}
//   providerDirectory.linkageStats   — progress + link counts
//   providerDirectory.clearLinkage   — $unset all links
//
// NOTE: the NPPES national install (methods.directory.js) uses replaceOne —
// a re-install wipes endpoint/_linkage (and nameLower); re-run linkage after
// re-installs. Run AFTER a conformance sweep so patientLaunchable preference
// and the console's chip gating have data.

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { getDirectoryCollection } from '../lib/DirectoryCollections.js';
import { Endpoints as CoreEndpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints.js';
import {
  normalizeOrgName,
  buildEndpointNameIndex,
  matchOrgTier1,
  passesLocalityGuard
} from '../lib/OrgEndpointLinkage.js';

const log = (Meteor.Logger ? Meteor.Logger.for('provider-directory') : console);

const CONFIG_TYPE = 'directoryLinkage';
const WRITE_BATCH = 1000;
const PROGRESS_EVERY = 100000;
const SAMPLE_LIMIT = 50;

let linking = false;

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

function linkWrite(orgId, hit, runId, now) {
  return {
    updateOne: {
      filter: { _id: orgId },
      update: {
        $set: {
          endpoint: [{ reference: 'Endpoint/' + hit.endpointId, display: hit.rawName }],
          _linkage: {
            method: 'tier1-exact-name',
            evidence: hit.evidence,
            confidence: hit.confidence,
            endpointId: hit.endpointId,
            endpointTag: hit.endpointTag,
            matchedName: hit.rawName,
            patientLaunchable: !!hit.patientLaunchable,
            linkedAt: now,
            runId: runId
          }
        }
      }
    }
  };
}

export async function runLinkEndpoints({ dryRun = false, prune = false } = {}) {
  const runId = Random.id();
  const now = new Date();
  const Organizations = getDirectoryCollection('Organization');
  const orgsRaw = Organizations.rawCollection();

  // Phase 1: endpoint-name index (91K endpoints; a few hundred K names).
  const endpointDocs = await CoreEndpoints.rawCollection()
    .find(
      { name: { $type: 'string', $ne: '' } },
      { projection: { name: 1, alias: 1, managingOrganization: 1, 'meta.tag': 1, 'conformance.patientLaunchable': 1 } }
    )
    .toArray();
  const launchableById = new Map(endpointDocs.map(function (d) {
    return [String(d._id), !!get(d, 'conformance.patientLaunchable', false)];
  }));
  const index = buildEndpointNameIndex(endpointDocs);
  log.info('linkage endpoint index built', { endpoints: endpointDocs.length, names: index.exact.size });

  // Phase 2: stream orgs, collect matches. Vendor-evidence hits are final;
  // lantern-list hits group by matched name for the locality guard.
  const counters = { orgsScanned: 0, vendorLinked: 0, lanternCandidates: 0, lanternLinked: 0, refusedLocality: 0 };
  const vendorWrites = [];
  const lanternGroups = new Map();   // normalizedName -> { hit, orgs: [{orgId, state}] }
  const samples = [];
  let flushed = 0;

  async function flushVendor(force) {
    if (dryRun) {
      vendorWrites.length = 0;
      return;
    }
    if (vendorWrites.length >= WRITE_BATCH || (force && vendorWrites.length)) {
      const batch = vendorWrites.splice(0, vendorWrites.length);
      await orgsRaw.bulkWrite(batch, { ordered: false });
      flushed += batch.length;
    }
  }

  const cursor = orgsRaw.find(
    { name: { $type: 'string' } },
    { projection: { name: 1, 'address.state': 1 } }
  );
  for await (const org of cursor) {
    counters.orgsScanned++;
    const normalized = normalizeOrgName(org.name);
    const hit = matchOrgTier1(normalized, index);
    if (hit) {
      hit.patientLaunchable = launchableById.get(String(hit.endpointId)) || false;
      if (hit.requiresLocalityGuard) {
        counters.lanternCandidates++;
        if (!lanternGroups.has(normalized)) {
          lanternGroups.set(normalized, { hit: hit, orgs: [] });
        }
        lanternGroups.get(normalized).orgs.push({ orgId: org._id, state: get(org, 'address.0.state') });
      } else {
        counters.vendorLinked++;
        if (samples.length < SAMPLE_LIMIT) {
          samples.push({ org: org.name, endpoint: hit.rawName, evidence: hit.evidence, tag: hit.endpointTag });
        }
        vendorWrites.push(linkWrite(org._id, hit, runId, now));
        await flushVendor(false);
      }
    }
    if (counters.orgsScanned % PROGRESS_EVERY === 0) {
      await stampProgress({ progress: Object.assign({ running: true, phase: 'scan', runId: runId }, counters) });
      log.info('linkage scan progress', counters);
    }
  }
  await flushVendor(true);

  // Phase 3: locality guard over lantern-evidence name groups.
  let lanternWrites = [];
  for (const [name, group] of lanternGroups) {
    const states = group.orgs.map(function (o) { return o.state; });
    if (!passesLocalityGuard(states)) {
      counters.refusedLocality += group.orgs.length;
      if (samples.length < SAMPLE_LIMIT) {
        samples.push({ org: name, refused: 'locality (' + Array.from(new Set(states.filter(Boolean))).join(',') + ')' });
      }
      continue;
    }
    for (const orgRef of group.orgs) {
      counters.lanternLinked++;
      if (samples.length < SAMPLE_LIMIT) {
        samples.push({ org: name, endpoint: group.hit.rawName, evidence: 'lantern-list', state: orgRef.state });
      }
      if (!dryRun) {
        lanternWrites.push(linkWrite(orgRef.orgId, group.hit, runId, now));
        if (lanternWrites.length >= WRITE_BATCH) {
          await orgsRaw.bulkWrite(lanternWrites, { ordered: false });
          flushed += lanternWrites.length;
          lanternWrites = [];
        }
      }
    }
  }
  if (!dryRun && lanternWrites.length) {
    await orgsRaw.bulkWrite(lanternWrites, { ordered: false });
    flushed += lanternWrites.length;
  }

  // Phase 4: prune links not re-confirmed by this run.
  let pruned = 0;
  if (prune && !dryRun) {
    const result = await orgsRaw.updateMany(
      { '_linkage.runId': { $exists: true, $ne: runId } },
      { $unset: { endpoint: 1, _linkage: 1 } }
    );
    pruned = result.modifiedCount;
  }

  const summary = Object.assign({}, counters, {
    linked: counters.vendorLinked + counters.lanternLinked,
    written: flushed,
    pruned: pruned,
    dryRun: dryRun,
    runId: runId,
    finishedAt: new Date()
  });
  await stampProgress({ progress: Object.assign({ running: false, phase: 'done' }, summary), lastRunAt: now, samples: samples });
  log.info('linkage run complete', summary);
  return Object.assign({ samples: samples }, summary);
}

Meteor.ServerMethods.define('providerDirectory.linkEndpoints', {
  description: 'Link NPPES organizations to connectable endpoints (tier-1 exact-name). Background job — poll providerDirectory.linkageStats. dryRun reports without writing; prune drops links not re-confirmed.',
  requireAuth: true,
  positionalParams: [],
  schemaObject: {
    type: 'object',
    properties: {
      dryRun: { type: 'boolean' },
      prune: { type: 'boolean' }
    }
  }
}, async function (params, context) {
  if (linking) {
    throw new Meteor.Error('busy', 'A linkage run is already in progress.');
  }
  linking = true;
  const options = { dryRun: !!get(params, 'dryRun', false), prune: !!get(params, 'prune', false) };
  runLinkEndpoints(options)
    .catch(function (error) {
      log.error('linkage run failed', { error: error.message });
      return stampProgress({ progress: { running: false, phase: 'failed', error: error.message } });
    })
    .finally(function () { linking = false; });
  return { started: true, dryRun: options.dryRun };
});

Meteor.ServerMethods.define('providerDirectory.linkageStats', {
  description: 'Linkage progress, last-run summary + samples, and current link counts.',
  requireAuth: false,
  positionalParams: [],
  schemaObject: { type: 'object', properties: {} }
}, async function (params, context) {
  const Organizations = getDirectoryCollection('Organization');
  const raw = Organizations.rawCollection();
  const [linked, launchableLinked] = await Promise.all([
    raw.countDocuments({ _linkage: { $exists: true } }, { maxTimeMS: 5000 }).catch(function () { return -1; }),
    raw.countDocuments({ '_linkage.patientLaunchable': true }, { maxTimeMS: 5000 }).catch(function () { return -1; })
  ]);
  let data = null;
  const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
  if (ServerConfiguration) {
    const doc = await ServerConfiguration.findOneAsync({ configType: CONFIG_TYPE });
    data = get(doc, 'data', null);
  }
  return {
    running: linking,
    linked: linked,
    launchableLinked: launchableLinked,
    progress: get(data, 'progress', null),
    samples: get(data, 'samples', []),
    lastRunAt: get(data, 'lastRunAt', null)
  };
});

Meteor.ServerMethods.define('providerDirectory.clearLinkage', {
  description: 'Remove all org→endpoint links (full reversibility).',
  requireAuth: true,
  positionalParams: [],
  schemaObject: { type: 'object', properties: {} }
}, async function (params, context) {
  const Organizations = getDirectoryCollection('Organization');
  const result = await Organizations.rawCollection().updateMany(
    { _linkage: { $exists: true } },
    { $unset: { endpoint: 1, _linkage: 1 } }
  );
  log.info('linkage cleared', { modified: result.modifiedCount });
  return { cleared: result.modifiedCount };
});
