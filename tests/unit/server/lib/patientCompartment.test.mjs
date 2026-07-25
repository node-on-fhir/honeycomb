// tests/unit/server/lib/patientCompartment.test.mjs
//
// CR-3 reproduction + regression test (security audit 2026-07-01).
//
// The hole: the FHIR instance handlers — GET/DELETE/PATCH /baseR4/<Resource>/:id
// — looked resources up by `id` alone, with none of the patient-compartment
// filtering the SEARCH handler applies. A patient-scoped token could read,
// delete, or patch ANY patient's resource by guessing/knowing its id (IDOR).
//
// These tests drive server/lib/patientCompartment.js — the extracted predicate
// (recordMatchesCompartment) and role gate (isCompartmentExempt) the instance
// handlers now consult before touching a record. The logic mirrors the search
// handler's inline authQuery (FhirEndpoints.js:1259-1339) as the single source
// of truth.
//
// Run: node --test tests/unit/server/lib/patientCompartment.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isCompartmentExempt, recordMatchesCompartment, buildPatientCompartmentQuery } from '../../../../server/lib/patientCompartment.js';

// --- the vulnerability: a patient must not match another patient's record -----

test('a patient token does NOT match another patient\'s resource (subject.reference)', () => {
  const record = { resourceType: 'Observation', id: 'obs1', subject: { reference: 'Patient/A' } };
  const ctxOther = { role: 'patient', patientId: 'B' };
  assert.equal(recordMatchesCompartment(record, ctxOther, 'Observation'), false);
});

test('a patient token DOES match its own resource across the three ref formats', () => {
  const ctx = { role: 'patient', patientId: 'A' };
  for (const ref of ['A', 'Patient/A', 'urn:uuid:A']) {
    assert.equal(recordMatchesCompartment({ subject: { reference: ref } }, ctx, 'Observation'), true, ref);
    assert.equal(recordMatchesCompartment({ patient: { reference: ref } }, ctx, 'AllergyIntolerance'), true, ref);
    assert.equal(recordMatchesCompartment({ beneficiary: { reference: ref } }, ctx, 'Coverage'), true, ref);
  }
});

test('Patient resource: token matches only its own Patient record by id', () => {
  const ctx = { role: 'patient', patientId: 'A' };
  assert.equal(recordMatchesCompartment({ resourceType: 'Patient', id: 'A' }, ctx, 'Patient'), true);
  assert.equal(recordMatchesCompartment({ resourceType: 'Patient', id: 'B' }, ctx, 'Patient'), false);
});

test('an unrestricted meta.security label is public to any compartment', () => {
  const record = { subject: { reference: 'Patient/A' }, meta: { security: [{ display: 'unrestricted' }] } };
  assert.equal(recordMatchesCompartment(record, { role: 'patient', patientId: 'B' }, 'Observation'), true);
});

test('no patient context in the token matches nothing (fail closed)', () => {
  const record = { subject: { reference: 'Patient/A' } };
  assert.equal(recordMatchesCompartment(record, { role: 'patient' }, 'Observation'), false);
});

test('a record with no matching reference is denied', () => {
  const record = { resourceType: 'Observation', id: 'x' };
  assert.equal(recordMatchesCompartment(record, { role: 'patient', patientId: 'A' }, 'Observation'), false);
});

// --- the role gate: who bypasses the compartment ------------------------------

test('SYSTEM and noauth roles are exempt (no compartment filtering)', () => {
  assert.equal(isCompartmentExempt({ role: 'SYSTEM', resourceType: 'Observation' }), true);
  assert.equal(isCompartmentExempt({ role: 'noauth', resourceType: 'Observation' }), true);
});

test('a practitioner is exempt only when practitionerFullAccess is on', () => {
  assert.equal(isCompartmentExempt({ role: 'healthcare practitioner', resourceType: 'Observation', practitionerFullAccess: true }), true);
  assert.equal(isCompartmentExempt({ role: 'healthcare practitioner', resourceType: 'Observation', practitionerFullAccess: false }), false);
});

test('reference/organizational resource types are exempt', () => {
  for (const rt of ['Location', 'Practitioner', 'Organization', 'HealthcareService', 'Endpoint', 'PractitionerRole']) {
    assert.equal(isCompartmentExempt({ role: 'patient', resourceType: rt }), true, rt);
  }
});

test('a patient role on a compartment resource is NOT exempt (the case that closes the hole)', () => {
  assert.equal(isCompartmentExempt({ role: 'patient', resourceType: 'Observation', practitionerFullAccess: true }), false);
  // unknown/default roles also fall through to filtering (fail closed)
  assert.equal(isCompartmentExempt({ role: 'PAT', resourceType: 'Observation' }), false);
});

// --- the search query form (buildPatientCompartmentQuery) ---------------------

test('search query for a compartment resource includes unrestricted + the three ref paths', () => {
  const q = buildPatientCompartmentQuery({ role: 'patient', patientId: 'A' }, 'Observation');
  assert.ok(Array.isArray(q.$or));
  const refs = ['A', 'Patient/A', 'urn:uuid:A'];
  assert.deepEqual(q.$or[0], { 'meta.security.display': { $eq: 'unrestricted' } });
  assert.deepEqual(q.$or.find(c => c['subject.reference']), { 'subject.reference': { $in: refs } });
  assert.deepEqual(q.$or.find(c => c['patient.reference']), { 'patient.reference': { $in: refs } });
  assert.deepEqual(q.$or.find(c => c['beneficiary.reference']), { 'beneficiary.reference': { $in: refs } });
});

test('search query for Patient resource keys on id + generalPractitioner', () => {
  const q = buildPatientCompartmentQuery({ role: 'patient', patientId: 'A', practitionerId: 'P1' }, 'Patient');
  assert.deepEqual(q.$or.find(c => c.id), { id: 'A' });
  assert.deepEqual(q.$or.find(c => c['generalPractitioner.reference']), { 'generalPractitioner.reference': { $regex: 'P1' } });
});

test('search query with no patient context is just the unrestricted clause', () => {
  const q = buildPatientCompartmentQuery({ role: 'patient' }, 'Observation');
  assert.deepEqual(q.$or, [{ 'meta.security.display': { $eq: 'unrestricted' } }]);
});

// The query (search) and the predicate (instance handlers) must agree on the
// SAME record set — that agreement is the whole point of the shared module.
// Evaluate the $or against sample records the way MongoDB would, and confirm it
// matches recordMatchesCompartment for each.
test('search query and instance predicate agree on the same records (coherence)', () => {
  const ctx = { role: 'patient', patientId: 'A' };
  const q = buildPatientCompartmentQuery(ctx, 'Observation');

  // Resolve a dotted path the way MongoDB does — traversing INTO arrays, so
  // 'meta.security.display' yields every array element's display value.
  function valuesAtPath(record, path) {
    return path.split('.').reduce(function(acc, key) {
      const next = [];
      for (const node of acc) {
        if (node == null) { continue; }
        const v = node[key];
        if (Array.isArray(v)) { next.push(...v); }
        else if (v !== undefined) { next.push(v); }
      }
      return next;
    }, [record]);
  }

  function matchesOr(record) {
    return q.$or.some(function(clause) {
      const [path, cond] = Object.entries(clause)[0];
      const values = valuesAtPath(record, path);
      return values.some(function(value) {
        if (cond && cond.$eq !== undefined) { return value === cond.$eq; }
        if (cond && cond.$in !== undefined) { return cond.$in.includes(value); }
        return value === cond;
      });
    });
  }

  const records = [
    { subject: { reference: 'Patient/A' } },                                   // own → match
    { subject: { reference: 'Patient/B' } },                                   // other → deny
    { patient: { reference: 'urn:uuid:A' } },                                  // own (alt path) → match
    { beneficiary: { reference: 'A' } },                                       // own (bare) → match
    { subject: { reference: 'Patient/B' }, meta: { security: [{ display: 'unrestricted' }] } }, // public → match
    { id: 'z' }                                                                // nothing → deny
  ];
  for (const r of records) {
    assert.equal(matchesOr(r), recordMatchesCompartment(r, ctx, 'Observation'),
      'query and predicate disagree on ' + JSON.stringify(r));
  }
});
