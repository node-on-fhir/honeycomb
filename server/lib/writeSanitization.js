// server/lib/writeSanitization.js
//
// CR-4 remediation (security audit 2026-07-01): govern server-controlled
// resource metadata on inbound writes (POST/PUT/PATCH in server/FhirEndpoints.js).
// Those handlers persisted req.body wholesale, so a non-privileged client could
// set its own meta.security access labels — e.g. POST a resource with
// meta.security:[{display:'unrestricted'}] to self-publish PHI as world-readable
// (the compartment filter treats 'unrestricted' as public), or relabel a
// record's access class. The server, not the client, owns security labels.
//
// CommonJS module (require + module.exports), NOT ESM export — consumed both by
// the Meteor server bundle and by `node --test` on CI's node 20, where a .js
// under a type:commonjs package loads as CommonJS. Genuine CJS + default-import
// is the repo's proven dual-context pattern (see imports/lib/loggerRedact.js).

const { get, set, unset, cloneDeep } = require('lodash');

// Return a copy of incomingRecord with meta.security governed by the server:
//   - privileged writers (callerMaySetSecurity: system / clinician) keep their
//     supplied labels — clinical/system labeling is legitimate.
//   - everyone else: the client cannot set meta.security. On UPDATE the existing
//     record's labels are preserved; on CREATE any client-supplied labels are
//     dropped.
// Pure — does not mutate its inputs.
function governSecurityLabels(incomingRecord, { existingRecord = null, callerMaySetSecurity = false } = {}) {
  const result = cloneDeep(incomingRecord);
  if (callerMaySetSecurity) {
    return result;
  }
  const existingSecurity = existingRecord ? get(existingRecord, 'meta.security') : undefined;
  if (existingSecurity !== undefined) {
    // Preserve the server's existing labels; the client cannot change them.
    set(result, 'meta.security', cloneDeep(existingSecurity));
  } else if (get(result, 'meta.security') !== undefined) {
    // No prior label; drop any client-supplied one.
    unset(result, 'meta.security');
  }
  return result;
}

module.exports = { governSecurityLabels };
