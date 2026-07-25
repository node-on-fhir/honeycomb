// server/lib/patientCompartment.js
//
// CR-3 remediation (security audit 2026-07-01): shared patient-compartment
// authorization for the FHIR instance handlers — GET/DELETE/PATCH
// /baseR4/<Resource>/:id in server/FhirEndpoints.js. Those handlers looked
// records up by `id` alone, applying none of the compartment filtering the
// SEARCH handler builds inline (FhirEndpoints.js:1259-1339), so a
// patient-scoped token could read/delete/patch any patient's record by id.
//
// Pure and dependency-light (lodash only) so it unit-tests offline — see
// tests/unit/server/lib/patientCompartment.test.mjs. It mirrors the search
// handler's role gate + authQuery $or so the two cannot diverge; unifying the
// search path onto this module is a follow-up (kept out of this security commit
// to avoid touching the passing (g)(10) search path).

// lodash is CommonJS; default-import + destructure so this resolves under BOTH
// plain `node --test` (the unit tests) and the Meteor server bundle. A named
// ESM import (`import { get } from 'lodash'`) works only under Meteor's
// transpiler and throws in node.
import lodash from 'lodash';
const { get } = lodash;

// Resource types OUTSIDE the patient compartment per FHIR R4 — organizational /
// directory resources reachable by scope alone. Mirrors FhirEndpoints.js:1264.
const REFERENCE_RESOURCES = ['Location', 'Practitioner', 'PractitionerRole', 'Organization', 'HealthcareService', 'Endpoint'];

// True when the patient-compartment filter should NOT be applied for a request:
// privileged roles and non-compartment resource types. Fail-closed — only
// KNOWN-exempt roles bypass; any other role (patient, the 'PAT' default,
// anything unrecognized) gets filtered. Mirrors the search handler's gate
// (practitioner-full-access / reference-resource / noauth / SYSTEM).
export function isCompartmentExempt({ role, resourceType, practitionerFullAccess = true } = {}) {
  if (role === 'SYSTEM' || role === 'noauth') {
    return true;
  }
  const isPractitioner = (role === 'healthcare practitioner' || role === 'healthcare provider');
  if (isPractitioner && practitionerFullAccess) {
    return true;
  }
  if (REFERENCE_RESOURCES.includes(resourceType)) {
    return true;
  }
  return false;
}

// The three reference formats a compartment record may store for a patient
// (mirrors FhirEndpoints.js:1298-1302).
function patientRefVariants(patientId) {
  return [patientId, 'Patient/' + patientId, 'urn:uuid:' + patientId];
}

// The MongoDB $or query form of the compartment, for the SEARCH handler (which
// filters at the database, not per-record). This is the SAME membership
// definition recordMatchesCompartment() applies as a predicate — kept in one
// place so the search filter and the instance-handler checks can never diverge.
// Callers gate on isCompartmentExempt() first; this builds the filter for
// non-exempt requests. Mirrors the (now-removed) inline authQuery.
export function buildPatientCompartmentQuery(authorizationContext, resourceType) {
  const orClauses = [{ 'meta.security.display': { $eq: 'unrestricted' } }];
  const patientId = get(authorizationContext, 'patientId');

  if (resourceType === 'Patient') {
    if (patientId) {
      orClauses.push({ 'id': patientId });
    }
    const practitionerId = get(authorizationContext, 'practitionerId');
    if (practitionerId) {
      orClauses.push({ 'generalPractitioner.reference': { $regex: practitionerId } });
    }
  } else if (patientId) {
    const refs = patientRefVariants(patientId);
    orClauses.push({ 'subject.reference': { $in: refs } });
    orClauses.push({ 'patient.reference': { $in: refs } });
    orClauses.push({ 'beneficiary.reference': { $in: refs } });
  }

  return { $or: orClauses };
}

// Post-fetch predicate: does this already-loaded record belong to the
// requester's patient compartment? Mirrors the search authQuery $or
// (FhirEndpoints.js:1279-1306):
//   - any meta.security entry with display 'unrestricted' is public
//   - Patient: the record IS the token's patient (by id), or names the token's
//     practitioner as generalPractitioner
//   - all other resources: subject/patient/beneficiary.reference is the token's
//     patient (in any of the three ref formats)
// Callers must first check isCompartmentExempt() (and the disableAccessControl
// setting); this predicate is the per-record membership test only.
export function recordMatchesCompartment(record, authorizationContext, resourceType) {
  if (!record) {
    return false;
  }

  // Public 'unrestricted' records are readable regardless of compartment. The
  // search query matches ANY array element, so check all of them.
  const securityLabels = get(record, 'meta.security', []);
  if (Array.isArray(securityLabels) && securityLabels.some(function(label) { return get(label, 'display') === 'unrestricted'; })) {
    return true;
  }

  const patientId = get(authorizationContext, 'patientId');
  if (!patientId) {
    // No patient context → nothing in a patient compartment matches (fail closed).
    return false;
  }

  if (resourceType === 'Patient') {
    if (get(record, 'id') === patientId) {
      return true;
    }
    const practitionerId = get(authorizationContext, 'practitionerId');
    const generalPractitioners = get(record, 'generalPractitioner', []);
    if (practitionerId && Array.isArray(generalPractitioners) && generalPractitioners.some(function(gp) {
      return (get(gp, 'reference') || '').includes(practitionerId);
    })) {
      return true;
    }
    return false;
  }

  const refs = patientRefVariants(patientId);
  for (const path of ['subject.reference', 'patient.reference', 'beneficiary.reference']) {
    if (refs.includes(get(record, path))) {
      return true;
    }
  }
  return false;
}

export default { isCompartmentExempt, recordMatchesCompartment, buildPatientCompartmentQuery };
