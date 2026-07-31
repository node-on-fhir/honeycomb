// /packages/pacio-core/server/methods/fetchPatientEverything.js
//
// Fetch a patient's record from a remote FHIR server and land it in the
// local collections. Two acquisition modes:
//
//   1. $everything (the original path) — one operation, paginated via
//      Bundle.link[rel=next].
//   2. USCDI sweep fallback — when $everything is refused (Epic/Cerner do not
//      offer it to patient-facing apps), run the per-resource manifest from
//      lib/uscdiQueryManifest.js (health-skillz shape): category-scoped
//      searches, tolerant per-type 403s, reference chasing, and
//      DocumentReference/DiagnosticReport attachment download into GridFS.
//
// Auth: pass `sessionToken` (from connect.completeLaunch) and the method
// resolves the bearer token server-side from Meteor.EhrTokenVault — the raw
// access token never rides through the client. The token is EPHEMERAL and is
// deleted from the vault when the pull finishes (success or failure).
//
// Provenance: every landed resource is stamped
// meta.source = 'urn:honeycomb:smart-fetch:<fhirBase>' (the stampSource
// lineage convention) and deduped by { id, meta.source } — fresh Mongo _id on
// insert, updates by the found record's _id only (never id||_id).

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get, set } from 'lodash';
import { fetch } from 'meteor/fetch';
import moment from 'moment';
import {
  buildUscdiQueryUrls,
  collectReferences
} from '../../lib/uscdiQueryManifest.js';

const log = (Meteor.Logger ? Meteor.Logger.for('fetchPatientEverything') : console);

const MAX_PAGES_PER_QUERY = 50;
const MAX_ATTACHMENTS = 200;

let FhirUtilities;
Meteor.startup(function(){
  FhirUtilities = Meteor.FhirUtilities;
});

// ---------------------------------------------------------------------------
// Landing — provenance-stamped upsert
// ---------------------------------------------------------------------------

function collectionFor(resourceType) {
  const collectionName = resourceType === 'Patient' ? 'Patients' : resourceType + 's';
  return get(global, ['Collections', collectionName]) || null;
}

// Upsert one resource. When sourceUri is present: dedupe by {id, meta.source}
// (same record from the same source updates in place; the same FHIR id from a
// DIFFERENT source stays a separate record). Legacy rows without meta.source
// are adopted-and-stamped rather than duplicated. Updates go by the found
// record's Mongo _id only.
async function landResource(resource, sourceUri) {
  if (!resource || !resource.resourceType || !resource.id) {
    return false;
  }
  const Collection = collectionFor(resource.resourceType);
  if (!Collection) {
    console.warn('No collection found for resource type: ' + resource.resourceType);
    return false;
  }

  const doc = Object.assign({}, resource);
  delete doc._id;
  if (sourceUri) {
    set(doc, 'meta.source', sourceUri);
  }

  try {
    let existing = null;
    if (sourceUri) {
      existing = await Collection.findOneAsync({ id: doc.id, 'meta.source': sourceUri });
      if (!existing) {
        existing = await Collection.findOneAsync({ id: doc.id, 'meta.source': { $exists: false } });
      }
    } else {
      existing = await Collection.findOneAsync({ id: doc.id });
    }

    if (existing) {
      await Collection.updateAsync({ _id: existing._id }, { $set: doc });
    } else {
      await Collection.insertAsync(doc);
    }
    return true;
  } catch (err) {
    console.error('Error landing ' + resource.resourceType + ' ' + resource.id + ':', err.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Paginated fetch of one search URL
// ---------------------------------------------------------------------------

async function fetchAllPages(initialUrl, { headers = {}, sourceUri = null, land = true } = {}) {
  let currentUrl = initialUrl;
  let pageNumber = 0;
  const entries = [];
  const resourceCounts = {};
  let patientResource = null;
  let firstStatus = null;

  while (currentUrl && pageNumber < MAX_PAGES_PER_QUERY) {
    pageNumber += 1;
    const response = await fetch(currentUrl, {
      method: 'GET',
      headers: Object.assign({ 'Accept': 'application/fhir+json' }, headers)
    });
    if (firstStatus === null) {
      firstStatus = response.status;
    }
    if (!response.ok) {
      const err = new Meteor.Error('fetch-failed', 'HTTP ' + response.status + ': ' + response.statusText);
      err.httpStatus = response.status;
      throw err;
    }

    const body = await response.json();

    // A direct read (Patient/{id}) returns the resource, not a Bundle.
    if (body && body.resourceType && body.resourceType !== 'Bundle') {
      entries.push({ resource: body });
      resourceCounts[body.resourceType] = (resourceCounts[body.resourceType] || 0) + 1;
      if (body.resourceType === 'Patient') {
        patientResource = body;
      }
      if (land) {
        await landResource(body, sourceUri);
      }
      break;
    }

    if (!body || body.resourceType !== 'Bundle') {
      throw new Meteor.Error('invalid-response', 'Expected a FHIR Bundle resource');
    }

    for (const entry of (body.entry || [])) {
      const resource = entry && entry.resource;
      if (!resource || !resource.resourceType) {
        continue;
      }
      entries.push({ resource: resource });
      resourceCounts[resource.resourceType] = (resourceCounts[resource.resourceType] || 0) + 1;
      if (resource.resourceType === 'Patient') {
        patientResource = resource;
      }
      if (land) {
        await landResource(resource, sourceUri);
      }
    }

    currentUrl = null;
    const links = Array.isArray(body.link) ? body.link : [];
    const nextLink = links.find(function(link) { return link.relation === 'next'; });
    if (nextLink && nextLink.url) {
      currentUrl = nextLink.url;
    }
  }

  return {
    entries: entries,
    resourceCounts: resourceCounts,
    patientResource: patientResource,
    pagesFetched: pageNumber,
    httpStatus: firstStatus
  };
}

// ---------------------------------------------------------------------------
// USCDI sweep fallback (per-resource manifest, tolerant 403s)
// ---------------------------------------------------------------------------

async function runUscdiSweep({ fhirBase, patientId, headers, sourceUri }) {
  const queries = buildUscdiQueryUrls({ fhirBase: fhirBase, patientId: patientId });
  const allEntries = [];
  const resourceCounts = {};
  const deniedResourceTypes = [];
  let patientResource = null;
  let pagesFetched = 0;

  // Bounded concurrency (5 in flight) — polite to the vendor, fast enough.
  const queue = queries.slice();
  async function worker() {
    while (queue.length) {
      const query = queue.shift();
      try {
        const result = await fetchAllPages(query.url, { headers: headers, sourceUri: sourceUri });
        allEntries.push(...result.entries);
        pagesFetched += result.pagesFetched;
        for (const [type, count] of Object.entries(result.resourceCounts)) {
          resourceCounts[type] = (resourceCounts[type] || 0) + count;
        }
        if (result.patientResource) {
          patientResource = result.patientResource;
        }
      } catch (err) {
        // Per-type denial is informational, never fatal — the manifest is
        // deliberately over-broad and vendors don't grant every resource.
        const status = get(err, 'httpStatus', 0);
        if (status === 403 || status === 401 || status === 404 || status === 400) {
          log.info('sweep query not granted', { label: query.label, status: status });
          deniedResourceTypes.push({ label: query.label, resourceType: query.resourceType, status: status });
        } else {
          log.warn('sweep query failed', { label: query.label, error: err.message });
          deniedResourceTypes.push({ label: query.label, resourceType: query.resourceType, status: status || 'error' });
        }
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker(), worker()]);

  // Reference chasing — resolve Practitioner/Organization/Medication/... so
  // meds and notes name people and places that exist locally.
  const wanted = collectReferences(allEntries.map(function(entry) { return entry.resource; }));
  const base = String(fhirBase).replace(/\/+$/, '');
  const chaseQueue = [];
  for (const [resourceType, ids] of Object.entries(wanted)) {
    for (const id of ids) {
      chaseQueue.push({ url: base + '/' + resourceType + '/' + id, resourceType: resourceType });
    }
  }
  async function chaseWorker() {
    while (chaseQueue.length) {
      const item = chaseQueue.shift();
      try {
        const result = await fetchAllPages(item.url, { headers: headers, sourceUri: sourceUri });
        allEntries.push(...result.entries);
        for (const [type, count] of Object.entries(result.resourceCounts)) {
          resourceCounts[type] = (resourceCounts[type] || 0) + count;
        }
      } catch (err) {
        // Individual reference misses are fine.
      }
    }
  }
  if (chaseQueue.length) {
    log.info('reference chasing', { referenced: chaseQueue.length });
    await Promise.all([chaseWorker(), chaseWorker(), chaseWorker(), chaseWorker(), chaseWorker()]);
  }

  return {
    entries: allEntries,
    resourceCounts: resourceCounts,
    deniedResourceTypes: deniedResourceTypes,
    patientResource: patientResource,
    pagesFetched: pagesFetched
  };
}

// ---------------------------------------------------------------------------
// Attachment download → GridFS (bearer path only; token dies after the pull)
// ---------------------------------------------------------------------------

function attachmentTargets(entries) {
  const targets = [];
  for (const entry of entries) {
    const resource = entry && entry.resource;
    if (!resource) {
      continue;
    }
    if (resource.resourceType === 'DocumentReference') {
      const contents = Array.isArray(resource.content) ? resource.content : [];
      contents.forEach(function(content, index) {
        const url = get(content, 'attachment.url');
        if (url) {
          targets.push({
            resource: resource,
            url: url,
            contentType: get(content, 'attachment.contentType', 'application/octet-stream'),
            slot: 'content.' + index
          });
        }
      });
    }
    if (resource.resourceType === 'DiagnosticReport') {
      const forms = Array.isArray(resource.presentedForm) ? resource.presentedForm : [];
      forms.forEach(function(form, index) {
        if (form && form.url) {
          targets.push({
            resource: resource,
            url: form.url,
            contentType: form.contentType || 'application/octet-stream',
            slot: 'presentedForm.' + index
          });
        }
      });
    }
  }
  return targets;
}

async function downloadAttachments({ entries, fhirBase, headers, sourceUri }) {
  const GridFSManager = get(global, 'GridFSManager');
  if (!GridFSManager || !GridFSManager.isInitialized()) {
    log.warn('GridFS unavailable — skipping attachment download');
    return { downloaded: 0, skipped: 0 };
  }

  const base = String(fhirBase).replace(/\/+$/, '');
  const targets = attachmentTargets(entries).slice(0, MAX_ATTACHMENTS);
  let downloaded = 0;
  let skipped = 0;

  for (const target of targets) {
    try {
      const absoluteUrl = target.url.startsWith('http')
        ? target.url
        : base + '/' + target.url.replace(/^\/+/, '');
      const response = await fetch(absoluteUrl, {
        method: 'GET',
        headers: Object.assign({ 'Accept': target.contentType + ', */*' }, headers)
      });
      if (!response.ok) {
        skipped += 1;
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = target.resource.resourceType + '-' + target.resource.id + '-' + target.slot;

      const gridfsFileId = await new Promise(function(resolve, reject) {
        const uploadStream = GridFSManager.openUploadStream(filename, {
          contentType: target.contentType,
          sourceUri: sourceUri,
          resourceType: target.resource.resourceType,
          resourceId: target.resource.id,
          sourceUrl: absoluteUrl
        });
        uploadStream.on('error', reject);
        uploadStream.on('finish', function() { resolve(uploadStream.id.toString()); });
        uploadStream.end(buffer);
      });

      // Record the GridFS id on the landed resource (extension on the record,
      // original attachment url preserved).
      const Collection = collectionFor(target.resource.resourceType);
      if (Collection) {
        const selector = sourceUri
          ? { id: target.resource.id, 'meta.source': sourceUri }
          : { id: target.resource.id };
        const existing = await Collection.findOneAsync(selector);
        if (existing) {
          const extensions = Array.isArray(existing.extension) ? existing.extension : [];
          extensions.push({
            url: 'https://honeycomb.fhir.org/gridfs-attachment',
            valueString: JSON.stringify({ slot: target.slot, gridfsFileId: gridfsFileId, contentType: target.contentType })
          });
          await Collection.updateAsync({ _id: existing._id }, { $set: { extension: extensions } });
        }
      }
      downloaded += 1;
    } catch (err) {
      log.warn('attachment download failed', { error: err.message });
      skipped += 1;
    }
  }

  log.info('attachments complete', { downloaded: downloaded, skipped: skipped, found: targets.length });
  return { downloaded: downloaded, skipped: skipped };
}

// ---------------------------------------------------------------------------
// The method
// ---------------------------------------------------------------------------

Meteor.ServerMethods.define('pacio.fetchPatientEverything', {
  description: 'Fetch and persist a patient record from a remote FHIR server ($everything, with USCDI-sweep fallback; optional SMART sessionToken for bearer auth)',
  phi: true,
  positionalParams: ['url', 'patientId'],
  schemaObject: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      patientId: { type: 'string' },
      sessionToken: { type: 'string' }
    },
    required: []
  }
}, async function(params, context) {
    let url = get(params, 'url', '');
    let patientId = get(params, 'patientId', '');
    const sessionToken = get(params, 'sessionToken', '');

    // Resolve the bearer handle server-side — the client only holds the
    // opaque sessionToken; the access token never leaves this process.
    let handle = null;
    const headers = {};
    if (sessionToken) {
      const vault = get(Meteor, 'EhrTokenVault');
      handle = vault ? vault.get(sessionToken) : null;
      if (!handle) {
        throw new Meteor.Error('invalid-session', 'No live token for this session — reconnect to the EHR.');
      }
      if (handle.userId && handle.userId !== context.userId) {
        throw new Meteor.Error('not-authorized', 'Session token belongs to a different user.');
      }
      headers['Authorization'] = 'Bearer ' + handle.accessToken;
      patientId = handle.patient || patientId;
      if (!url) {
        url = String(handle.fhirBaseUrl).replace(/\/+$/, '') + '/Patient/' + patientId + '/$everything';
      }
    }

    if (!url || !patientId) {
      throw new Meteor.Error('bad-request', 'Provide url + patientId, or a sessionToken from connect.completeLaunch.');
    }

    // Derive the FHIR base + lineage stamp from the fetch URL.
    const fhirBase = handle
      ? String(handle.fhirBaseUrl).replace(/\/+$/, '')
      : url.split('/Patient/')[0].replace(/\/+$/, '');
    const sourceUri = 'urn:honeycomb:smart-fetch:' + fhirBase;

    log.phi('Starting patient data fetch from', { url }, { action: 'read' });
    const startedAt = new Date();

    try {
      let mode = '$everything';
      let entries = [];
      let resourceCounts = {};
      let deniedResourceTypes = [];
      let patientResource = null;
      let pagesFetched = 0;

      try {
        const everything = await fetchAllPages(url, { headers: headers, sourceUri: sourceUri });
        entries = everything.entries;
        resourceCounts = everything.resourceCounts;
        patientResource = everything.patientResource;
        pagesFetched = everything.pagesFetched;
      } catch (everythingError) {
        const status = get(everythingError, 'httpStatus', 0);
        // Vendors that don't offer $everything to patient apps answer 4xx —
        // fall back to the per-resource USCDI sweep (bearer path only; an
        // open-endpoint $everything failure stays a real error).
        if (handle && status >= 400 && status < 500) {
          log.info('$everything refused (' + status + ') — falling back to USCDI sweep');
          mode = 'uscdi-sweep';
          const sweep = await runUscdiSweep({
            fhirBase: fhirBase,
            patientId: patientId,
            headers: headers,
            sourceUri: sourceUri
          });
          entries = sweep.entries;
          resourceCounts = sweep.resourceCounts;
          deniedResourceTypes = sweep.deniedResourceTypes;
          patientResource = sweep.patientResource;
          pagesFetched = sweep.pagesFetched;
        } else {
          throw everythingError;
        }
      }

      // Clinical-note / report binaries — must happen inside the live session
      // (the token is discarded in finally).
      let attachments = { downloaded: 0, skipped: 0 };
      if (handle && entries.length) {
        attachments = await downloadAttachments({
          entries: entries,
          fhirBase: fhirBase,
          headers: headers,
          sourceUri: sourceUri
        });
      }

      const totalEntries = entries.length;
      console.log('=== Fetch Summary ===');
      console.log('Mode: ' + mode + ' · pages: ' + pagesFetched + ' · entries: ' + totalEntries);
      console.log('Resource counts:', resourceCounts);
      if (deniedResourceTypes.length) {
        console.log('Not granted (' + deniedResourceTypes.length + '):',
          deniedResourceTypes.map(function(d) { return d.label + ' (' + d.status + ')'; }).join(', '));
      }

      // Save the complete bundle-of-record to the Bundles collection.
      const completeBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: totalEntries,
        entry: entries
      };
      let bundleId = null;
      if (totalEntries > 0) {
        try {
          const BundlesCollection = await global.Collections.Bundles;
          if (BundlesCollection) {
            const bundleToSave = Object.assign({}, completeBundle, {
              id: Random.id(),
              _patientId: patientId,
              meta: {
                source: sourceUri,
                lastUpdated: new Date().toISOString(),
                tag: [{
                  system: 'https://honeycomb.fhir.org/bundle-source',
                  code: mode === '$everything' ? 'patient-everything' : 'uscdi-sweep',
                  display: 'Patient record fetch (' + mode + ') for ' + patientId
                }]
              },
              identifier: [{
                system: 'https://honeycomb.fhir.org/bundle-identifier',
                value: 'patient-fetch-' + patientId + '-' + Date.now()
              }],
              extension: [{
                url: 'https://honeycomb.fhir.org/fetch-details',
                valueCode: JSON.stringify({
                  sourceUrl: url,
                  mode: mode,
                  patientId: patientId,
                  fetchedAt: new Date().toISOString(),
                  fetchedBy: context.userId,
                  pagesFetched: pagesFetched,
                  resourceCounts: resourceCounts,
                  deniedResourceTypes: deniedResourceTypes,
                  attachments: attachments
                })
              }]
            });
            bundleId = await BundlesCollection.insertAsync(bundleToSave);
            log.debug('Saved patient fetch bundle', { bundleId });
          }
        } catch (bundleError) {
          console.error('Error saving bundle to Bundles collection:', bundleError);
        }
      }

      // Connection provenance report (bearer path).
      if (handle) {
        try {
          const ConnectedSources = get(global, 'Collections.ConnectedSources');
          if (ConnectedSources) {
            await ConnectedSources.updateAsync(
              { userId: context.userId, endpointId: handle.endpointId },
              {
                $set: {
                  lastPull: {
                    mode: mode,
                    resourceCounts: resourceCounts,
                    deniedResourceTypes: deniedResourceTypes,
                    attachments: attachments,
                    startedAt: startedAt,
                    finishedAt: new Date(),
                    ok: true
                  },
                  status: 'connected'
                }
              }
            );
          }
        } catch (provenanceError) {
          log.warn('could not update ConnectedSources', { error: provenanceError.message });
        }
      }

      const maxDetailsToShow = 100;
      const resourceDetails = entries.slice(0, maxDetailsToShow).map(function(entry) {
        return { resourceType: entry.resource.resourceType, id: entry.resource.id };
      });

      return {
        success: true,
        mode: mode,
        resourceCount: totalEntries,
        resourcesProcessed: totalEntries,
        resourceCounts: resourceCounts,
        deniedResourceTypes: deniedResourceTypes,
        attachments: attachments,
        pagesFetched: pagesFetched,
        patientId: get(patientResource, 'id', patientId),
        patientResource: patientResource,
        timestamp: new Date(),
        resourceDetails: resourceDetails,
        bundle: completeBundle,
        bundleId: bundleId
      };

    } catch (error) {
      log.error('Error in fetchPatientEverything', { error: error?.message });
      if (handle) {
        try {
          const ConnectedSources = get(global, 'Collections.ConnectedSources');
          if (ConnectedSources) {
            await ConnectedSources.updateAsync(
              { userId: context.userId, endpointId: handle.endpointId },
              { $set: { lastPull: { startedAt: startedAt, finishedAt: new Date(), ok: false, error: error.message }, status: 'error' } }
            );
          }
        } catch (ignore) { /* provenance best-effort */ }
      }
      throw new Meteor.Error('fetch-error', error.message || 'Failed to fetch patient data');
    } finally {
      // NEVER persist tokens — the pull consumes the session.
      if (sessionToken) {
        const vault = get(Meteor, 'EhrTokenVault');
        if (vault) {
          vault.delete(sessionToken);
          log.info('session token discarded', { remaining: vault.size() });
        }
      }
    }
});
