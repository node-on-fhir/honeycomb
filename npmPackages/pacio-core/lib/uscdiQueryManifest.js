// npmPackages/pacio-core/lib/uscdiQueryManifest.js
//
// USCDI patient-record query manifest — the per-resource fallback sweep used
// by pacio.fetchPatientEverything when the vendor does not offer
// Patient/$everything to patient-facing apps (Epic and Cerner generally
// don't). Pure and dependency-free so it runs under node --test.
//
// Shape follows jmandel/health-skillz (MIT): deliberately OVER-BROAD — some
// vendors won't grant every resource, and a per-type 403 is informational,
// never a failure. Observation searches are category-scoped because major
// vendors reject uncategorized Observation?patient= searches outright.

// Patient-scoped searches. `params.patient` is added automatically.
export const USCDI_SEARCH_QUERIES = [
  { resourceType: 'Patient', label: 'Patient', params: {}, patientInPath: true },
  // Observations by category
  ...[
    ['laboratory', 'Labs'],
    ['vital-signs', 'Vitals'],
    ['social-history', 'Social History'],
    ['survey', 'Surveys'],
    ['exam', 'Exams'],
    ['therapy', 'Therapy'],
    ['activity', 'Activity'],
    ['imaging', 'Imaging'],
    ['procedure', 'Obs Procedures'],
    ['sdoh', 'SDOH'],
    ['functional-status', 'Functional'],
    ['disability-status', 'Disability'],
    ['cognitive-status', 'Cognitive'],
    ['clinical-test', 'Clinical Tests']
  ].map(function(pair) {
    return { resourceType: 'Observation', label: pair[1], params: { category: pair[0] } };
  }),
  // Conditions by category
  ...[
    ['problem-list-item', 'Problems'],
    ['health-concern', 'Health Concerns'],
    ['encounter-diagnosis', 'Diagnoses']
  ].map(function(pair) {
    return { resourceType: 'Condition', label: pair[1], params: { category: pair[0] } };
  }),
  // DiagnosticReports
  { resourceType: 'DiagnosticReport', label: 'Lab Reports',
    params: { category: 'http://terminology.hl7.org/CodeSystem/v2-0074|LAB' } },
  { resourceType: 'DiagnosticReport', label: 'Radiology',
    params: { category: 'http://loinc.org|LP29708-2' } },
  // Documents — the clinical notes are the highest-value payload
  { resourceType: 'DocumentReference', label: 'Clinical Notes',
    params: { category: 'clinical-note' } },
  { resourceType: 'DocumentReference', label: 'Documents', params: {} },
  // Care plans + service requests
  { resourceType: 'CarePlan', label: 'Care Plan',
    params: { category: 'http://hl7.org/fhir/us/core/CodeSystem/careplan-category|assess-plan' } },
  { resourceType: 'ServiceRequest', label: 'Services', params: {} },
  // Flat patient-scoped resources
  ...[
    ['AllergyIntolerance', 'Allergies', {}],
    ['CareTeam', 'Care Team', { status: 'active' }],
    ['Coverage', 'Coverage', {}],
    ['Device', 'Devices', {}],
    ['Encounter', 'Encounters', {}],
    ['FamilyMemberHistory', 'Family History', {}],
    ['Goal', 'Goals', {}],
    ['Immunization', 'Immunizations', {}],
    ['MedicationDispense', 'Med Dispensing', {}],
    ['MedicationRequest', 'Medications', { intent: 'order' }],
    ['MedicationStatement', 'Med History', {}],
    ['Procedure', 'Procedures', {}],
    ['QuestionnaireResponse', 'Questionnaires', {}],
    ['RelatedPerson', 'Related Persons', {}]
  ].map(function(triple) {
    return { resourceType: triple[0], label: triple[1], params: triple[2] };
  })
];

// Resources we don't search directly but chase by reference so meds, notes,
// and reports resolve their authors/orgs/medications locally.
export const REFERENCE_RESOURCE_TYPES = new Set([
  'Practitioner',
  'PractitionerRole',
  'Organization',
  'Location',
  'Medication',
  'Specimen',
  'Questionnaire',
  'Provenance'
]);

function stripSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

// → [{ resourceType, label, url, patientInPath }]
export function buildUscdiQueryUrls({ fhirBase, patientId, count = 100 }) {
  const base = stripSlash(fhirBase);
  return USCDI_SEARCH_QUERIES.map(function(query) {
    if (query.patientInPath) {
      return {
        resourceType: query.resourceType,
        label: query.label,
        url: base + '/' + query.resourceType + '/' + patientId,
        patientInPath: true
      };
    }
    const params = new URLSearchParams(query.params);
    params.set('patient', patientId);
    params.set('_count', String(count));
    return {
      resourceType: query.resourceType,
      label: query.label,
      url: base + '/' + query.resourceType + '?' + params.toString(),
      patientInPath: false
    };
  });
}

// Walk fetched resources for chaseable `reference` values.
// → { Practitioner: Set(ids), Organization: Set(ids), ... } (only present types)
export function collectReferences(resources) {
  const wanted = {};

  function scan(value) {
    if (Array.isArray(value)) {
      for (const item of value) {
        scan(item);
      }
      return;
    }
    if (value && typeof value === 'object') {
      const reference = value.reference;
      if (typeof reference === 'string' && reference.includes('/')) {
        const parts = reference.split('/');
        const resourceType = parts[parts.length - 2];
        const id = parts[parts.length - 1];
        if (REFERENCE_RESOURCE_TYPES.has(resourceType) && id) {
          if (!wanted[resourceType]) {
            wanted[resourceType] = new Set();
          }
          wanted[resourceType].add(id);
        }
      }
      for (const key of Object.keys(value)) {
        scan(value[key]);
      }
    }
  }

  scan(resources);
  return wanted;
}
