// tests/unit/imports/lib/loggerRedact.test.mjs
//
// The PHI redaction walker must be safe to point at ARBITRARY runtime values —
// log call sites pass whatever they have, including accidental host objects
// (React SyntheticEvents whose .view is `window`). A path-based cycle guard
// re-walks shared references once per path, which is exponential on dense
// graphs and froze/crashed the browser tab (Add Member dialog, 2026-08-01).

import test from 'node:test';
import assert from 'node:assert/strict';

import redactModule from '../../../../imports/lib/loggerRedact.js';
const { redactPhi } = redactModule;

test('redacts PHI fields on a plain FHIR-ish object', function() {
  const out = redactPhi({
    resourceType: 'Observation',
    status: 'final',
    name: 'should be redacted',
    subject: { display: 'ok', family: 'redact-me' }
  });
  assert.equal(out.status, 'final');
  assert.deepEqual(out.name, { redacted: true });
  assert.deepEqual(out.subject.family, { redacted: true });
  assert.equal(out.subject.display, 'ok');
});

test('patient-compartment resources collapse to a stub', function() {
  const out = redactPhi({ resourceType: 'Patient', id: 'p1', name: 'secret' });
  assert.deepEqual(out, { redacted: true, resourceType: 'Patient', id: 'p1' });
});

test('true cycles terminate with a marker', function() {
  const a = { label: 'a' };
  a.self = a;
  const out = redactPhi(a);
  assert.equal(out.label, 'a');
  assert.deepEqual(out.self, { redacted: true, circular: true });
});

test('shared references are visited once, not once per path', function() {
  // A "diamond DAG": both x and y point at the same object. A path-based
  // guard walks it twice (exponential on deep diamonds); a visited-set walks
  // it once and marks the second sighting.
  const shared = { v: 1 };
  const out = redactPhi({ x: shared, y: shared });
  const copies = [out.x, out.y].filter(function(o) { return o && o.v === 1; });
  const markers = [out.x, out.y].filter(function(o) { return o && o.circular === true; });
  assert.equal(copies.length, 1, 'shared object should be materialized exactly once');
  assert.equal(markers.length, 1, 'second sighting should be a marker');
});

test('a deep diamond DAG returns quickly instead of exponentially exploding', function() {
  // 40 levels, each object referenced twice by the level above: 2^40 paths.
  // Path-based guarding never returns; visited-set returns instantly.
  let node = { leaf: true };
  for (let i = 0; i < 40; i++) {
    node = { left: node, right: node };
  }
  const started = Date.now();
  redactPhi(node);
  assert.ok(Date.now() - started < 2000, 'walk should finish in bounded time');
});

test('depth is capped', function() {
  let deep = { end: true };
  for (let i = 0; i < 200; i++) {
    deep = { child: deep };
  }
  const out = redactPhi(deep);
  let cursor = out;
  let depth = 0;
  while (cursor && typeof cursor === 'object' && cursor.child) {
    cursor = cursor.child;
    depth++;
  }
  assert.ok(depth < 64, 'walker should truncate long chains, got depth ' + depth);
});

test('Error objects keep message and stack', function() {
  const err = new Error('boom');
  const out = redactPhi(err);
  assert.equal(out.message, 'boom');
  assert.ok(typeof out.stack === 'string');
});
