// tests/unit/npmPackages/pacio-core/uscdiQueryManifest.test.mjs
//
// node --test tests/unit/npmPackages/pacio-core/uscdiQueryManifest.test.mjs
// Pure USCDI query manifest — the per-resource fallback sweep used when a
// vendor doesn't offer Patient/$everything to patient apps. Shape follows
// jmandel/health-skillz (MIT).

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  USCDI_SEARCH_QUERIES,
  REFERENCE_RESOURCE_TYPES,
  buildUscdiQueryUrls,
  collectReferences
} from '../../../../npmPackages/pacio-core/lib/uscdiQueryManifest.js';

test('manifest is broad: 35+ queries, category splits, clinical notes included', () => {
  // 38 queries as of the initial port (1 Patient + 14 Observation categories +
  // 3 Condition categories + 2 DiagnosticReport + 2 DocumentReference +
  // CarePlan + ServiceRequest + 14 flat types) — health-skillz shape.
  assert.ok(USCDI_SEARCH_QUERIES.length >= 35, 'expected 35+ queries, got ' + USCDI_SEARCH_QUERIES.length);

  const observationCategories = USCDI_SEARCH_QUERIES
    .filter(function(q) { return q.resourceType === 'Observation'; });
  assert.ok(observationCategories.length >= 10, 'Observation split into 10+ categories');
  assert.ok(observationCategories.every(function(q) { return q.params.category; }),
    'every Observation query is category-scoped (Epic 400s uncategorized searches)');

  const conditionCategories = USCDI_SEARCH_QUERIES
    .filter(function(q) { return q.resourceType === 'Condition'; })
    .map(function(q) { return q.params.category; });
  assert.ok(conditionCategories.includes('problem-list-item'));
  assert.ok(conditionCategories.includes('encounter-diagnosis'));

  const docRefs = USCDI_SEARCH_QUERIES.filter(function(q) { return q.resourceType === 'DocumentReference'; });
  assert.ok(docRefs.some(function(q) { return q.params.category === 'clinical-note'; }),
    'clinical notes are queried explicitly');
});

test('buildUscdiQueryUrls composes patient-scoped search URLs with _count', () => {
  const urls = buildUscdiQueryUrls({ fhirBase: 'https://ehr.example/FHIR/R4/', patientId: 'p123' });
  assert.equal(urls.length, USCDI_SEARCH_QUERIES.length);

  const patientRead = urls.find(function(u) { return u.patientInPath; });
  assert.equal(patientRead.url, 'https://ehr.example/FHIR/R4/Patient/p123');

  const labs = urls.find(function(u) { return u.label === 'Labs'; });
  assert.ok(labs.url.startsWith('https://ehr.example/FHIR/R4/Observation?'));
  assert.ok(labs.url.includes('category=laboratory'));
  assert.ok(labs.url.includes('patient=p123'));
  assert.ok(labs.url.includes('_count=100'));
});

test('collectReferences finds chaseable references recursively, skips others', () => {
  const resources = [
    {
      resourceType: 'MedicationRequest',
      id: 'm1',
      subject: { reference: 'Patient/p123' },
      requester: { reference: 'Practitioner/dr-1' },
      medicationReference: { reference: 'Medication/med-9' },
      encounter: { reference: 'Encounter/e-5' }
    },
    {
      resourceType: 'DocumentReference',
      id: 'd1',
      custodian: { reference: 'Organization/org-2' },
      context: { related: [{ reference: 'Provenance/prov-3' }] }
    }
  ];
  const wanted = collectReferences(resources);
  assert.deepEqual(Array.from(wanted.Practitioner), ['dr-1']);
  assert.deepEqual(Array.from(wanted.Medication), ['med-9']);
  assert.deepEqual(Array.from(wanted.Organization), ['org-2']);
  assert.deepEqual(Array.from(wanted.Provenance), ['prov-3']);
  // Patient + Encounter are not in the chase set (Patient fetched directly)
  assert.equal(wanted.Patient, undefined);
  assert.equal(wanted.Encounter, undefined);
  assert.ok(REFERENCE_RESOURCE_TYPES.has('Practitioner'));
});
