// imports/lib/loggerRedact.js
// PHI redaction net for LogRecords. Plain CJS, no Meteor imports.
//
// Safety contract: log call sites pass ARBITRARY runtime values, including
// accidental host objects (React SyntheticEvents whose .view is `window`,
// DOM nodes, etc.). The walker must terminate in bounded time on ANY input:
//  - `seen` is a visited-set for the whole walk (never deleted from), so a
//    shared reference is materialized once and marked on later sightings.
//    A path-based guard (delete-on-exit) re-walks shared subtrees once per
//    path — exponential on dense graphs; it froze and OOM-crashed the tab
//    when a click handler logged a SyntheticEvent (2026-08-01).
//  - MAX_DEPTH caps nesting; host objects are stubbed out entirely.
const PHI_FIELDS = ['name', 'given', 'family', 'birthDate', 'address', 'telecom', 'photo', 'contact', 'maritalStatus', 'communication', 'email', 'phone'];
const PATIENT_COMPARTMENT = ['Patient', 'RelatedPerson', 'Person', 'Practitioner'];
const MAX_DEPTH = 32;

function isHostObject(value) {
  /* global window, Node, Event */
  if (typeof window !== 'undefined' && value === window) { return '[window]'; }
  if (typeof Node !== 'undefined' && value instanceof Node) { return '[dom-node]'; }
  if (typeof Event !== 'undefined' && value instanceof Event) { return '[event]'; }
  // React SyntheticEvent (not an Event instance): duck-type on its signature
  if (value.nativeEvent !== undefined && typeof value.stopPropagation === 'function') { return '[synthetic-event]'; }
  return null;
}

function redactPhiInner(value, seen, depth) {
  if (value === null || typeof value !== 'object') { return value; }
  // Preserve Error objects: extract message + stack so diagnostics survive
  if (value instanceof Error) {
    const errOut = { message: value.message, stack: value.stack };
    // Redact any enumerable properties on the error that might carry PHI
    Object.keys(value).forEach(function(key) {
      errOut[key] = redactPhiInner(value[key], seen, depth + 1);
    });
    return errOut;
  }
  // Preserve Date objects as ISO strings
  if (value instanceof Date) { return value.toISOString(); }
  const hostStub = isHostObject(value);
  if (hostStub) { return hostStub; }
  if (depth >= MAX_DEPTH) { return '[max-depth]'; }
  // Visited-set: cycles AND shared references collapse to a marker after
  // their first materialization (safety over duplicate-subtree fidelity)
  if (seen.has(value)) { return { redacted: true, circular: true }; }
  seen.add(value);
  if (PATIENT_COMPARTMENT.includes(value.resourceType)) {
    return { redacted: true, resourceType: value.resourceType, id: value.id };
  }
  if (Array.isArray(value)) {
    return value.map(function(item) { return redactPhiInner(item, seen, depth + 1); });
  }
  const out = {};
  Object.keys(value).forEach(function(key) {
    if (PHI_FIELDS.includes(key)) {
      out[key] = { redacted: true };
    } else if (key === 'identifier') {
      out[key] = { redacted: true };
    } else {
      out[key] = redactPhiInner(value[key], seen, depth + 1);
    }
  });
  return out;
}

function redactPhi(value) {
  return redactPhiInner(value, new WeakSet(), 0);
}

module.exports = { redactPhi };
