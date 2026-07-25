// tests/unit/server/lib/writeSanitization.test.mjs
//
// CR-4 reproduction + regression test (security audit 2026-07-01).
//
// The hole: POST/PUT/PATCH persisted req.body wholesale, so a client could set
// its own meta.security access labels — e.g. POST a resource with
// meta.security:[{display:'unrestricted'}] to self-publish PHI as world-readable
// (the compartment filter treats 'unrestricted' as public), or relabel a
// record's access class. The server, not the client, must own security labels.
//
// These tests drive server/lib/writeSanitization.js — governSecurityLabels(),
// which the write handlers now apply to inbound resources.
//
// Run: node --test tests/unit/server/lib/writeSanitization.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Default-import + destructure (see verifyClientAssertion.test.mjs): named ESM
// imports of a type:commonjs .js throw on CI's node 20; the default export works.
import writeSanitizationModule from '../../../../server/lib/writeSanitization.js';
const { governSecurityLabels } = writeSanitizationModule;

// --- the vulnerability: a non-privileged client cannot set security labels ----

test('CREATE: a client-supplied unrestricted label is stripped for a non-privileged writer', () => {
  const incoming = { resourceType: 'Observation', subject: { reference: 'Patient/A' }, meta: { security: [{ display: 'unrestricted' }] } };
  const out = governSecurityLabels(incoming, { existingRecord: null, callerMaySetSecurity: false });
  assert.equal(out.meta.security, undefined, 'client security label must not survive create');
});

test('UPDATE: the existing server label is preserved, not the client-supplied one', () => {
  const existing = { meta: { security: [{ display: 'restricted' }] } };
  const incoming = { resourceType: 'Observation', meta: { security: [{ display: 'unrestricted' }] } };
  const out = governSecurityLabels(incoming, { existingRecord: existing, callerMaySetSecurity: false });
  assert.deepEqual(out.meta.security, [{ display: 'restricted' }], 'server label must win over client label on update');
});

test('UPDATE with no prior label: a client-supplied label is dropped', () => {
  const existing = { resourceType: 'Observation' }; // no meta.security
  const incoming = { meta: { security: [{ display: 'unrestricted' }] } };
  const out = governSecurityLabels(incoming, { existingRecord: existing, callerMaySetSecurity: false });
  assert.equal(out.meta.security, undefined);
});

// --- privileged writers (system / clinician) may label legitimately -----------

test('a privileged writer keeps its supplied security label', () => {
  const incoming = { meta: { security: [{ display: 'restricted' }] } };
  const out = governSecurityLabels(incoming, { existingRecord: null, callerMaySetSecurity: true });
  assert.deepEqual(out.meta.security, [{ display: 'restricted' }]);
});

// --- benign passthrough + purity ---------------------------------------------

test('a resource with no security label is unchanged for a non-privileged writer', () => {
  const incoming = { resourceType: 'Observation', subject: { reference: 'Patient/A' } };
  const out = governSecurityLabels(incoming, { existingRecord: null, callerMaySetSecurity: false });
  assert.equal(out.meta && out.meta.security, undefined);
  assert.equal(out.subject.reference, 'Patient/A', 'non-security fields pass through untouched');
});

test('does not mutate the input record', () => {
  const incoming = { meta: { security: [{ display: 'unrestricted' }] } };
  governSecurityLabels(incoming, { existingRecord: null, callerMaySetSecurity: false });
  assert.deepEqual(incoming.meta.security, [{ display: 'unrestricted' }], 'input must be left intact (pure)');
});
