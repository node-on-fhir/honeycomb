// tests/unit/imports/lib/sessionKeyGroups.test.mjs
//
// Unit tests for the Session Inspector grouping lib.
// Run: npm run test:session-key-groups
// (node --experimental-detect-module --test — the lib and SessionKeys.js are
// ESM-syntax .js files in a CJS-default package, same setup as
// WorkflowRegistry.test.mjs.)

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SESSION_KEY_GROUPS,
  classifySessionKey,
  isSensitiveSessionKey,
  groupSessionSnapshot
} from '../../../../imports/lib/sessionKeyGroups.js';

test('contract families classify into their themed groups', function() {
  assert.equal(classifySessionKey('selectedPatient'), 'patient');
  assert.equal(classifySessionKey('selectedPatientId'), 'patient');
  assert.equal(classifySessionKey('selectedPatientMongoId'), 'patient');
  assert.equal(classifySessionKey('selectedPractitionerId'), 'patient');
  assert.equal(classifySessionKey('currentUser'), 'auth');
  assert.equal(classifySessionKey('accountsAccessToken'), 'auth');
  assert.equal(classifySessionKey('MainSearch.postalCode'), 'mainSearch');
  assert.equal(classifySessionKey('simulatorMissionId'), 'simulator');
  assert.equal(classifySessionKey('selectedCrewedVehicle'), 'simulator');
  assert.equal(classifySessionKey('hexgridSelectedHex'), 'hexgrid');
  assert.equal(classifySessionKey('timelineStart'), 'timeline');
  assert.equal(classifySessionKey('activeTimelineResourceType'), 'timeline');
  assert.equal(classifySessionKey('selectedEndpointId'), 'endpoints');
  assert.equal(classifySessionKey('selectedBiomarkerCode'), 'biomarkers');
  assert.equal(classifySessionKey('theme'), 'chrome');
  assert.equal(classifySessionKey('displayNavbars'), 'chrome');
  assert.equal(classifySessionKey('sessionInspectorOpen'), 'chrome');
  assert.equal(classifySessionKey('showFhirIds'), 'toggles');
});

test('selectedXId catch-all catches per-resource selections but not the named families', function() {
  assert.equal(classifySessionKey('selectedObservationId'), 'selectedResources');
  assert.equal(classifySessionKey('selectedConditionId'), 'selectedResources');
  // named families won before the catch-all
  assert.equal(classifySessionKey('selectedPatientId'), 'patient');
  assert.equal(classifySessionKey('selectedEndpoint'), 'endpoints');
});

test('dialog/overlay heuristic and Other fallback', function() {
  assert.equal(classifySessionKey('logoutDialogOpen'), 'dialogs');
  assert.equal(classifySessionKey('shareModalExpanded'), 'dialogs');
  assert.equal(classifySessionKey('lastUpdated'), 'other');
  assert.equal(classifySessionKey(''), 'other');
  assert.equal(classifySessionKey(null), 'other');
});

test('sensitive keys are flagged for redaction', function() {
  assert.equal(isSensitiveSessionKey('accountsAccessToken'), true);
  assert.equal(isSensitiveSessionKey('accountsRefreshToken'), true);
  assert.equal(isSensitiveSessionKey('someApiKey'), true);
  assert.equal(isSensitiveSessionKey('oauthClientSecret'), true);
  assert.equal(isSensitiveSessionKey('selectedPatientId'), false);
  assert.equal(isSensitiveSessionKey('theme'), false);
});

test('groupSessionSnapshot orders groups, sorts entries, omits empty groups', function() {
  const snapshot = {
    'showFhirIds': true,
    'selectedPatientId': 'abc',
    'selectedPatient': { resourceType: 'Patient' },
    'accountsAccessToken': 'sekrit',
    'zzUnknownThing': 42
  };
  const groups = groupSessionSnapshot(snapshot);
  const ids = groups.map(function(g) { return g.id; });

  // Order follows SESSION_KEY_GROUPS declaration order
  assert.deepEqual(ids, ['patient', 'auth', 'toggles', 'other']);

  const patient = groups.find(function(g) { return g.id === 'patient'; });
  assert.deepEqual(
    patient.entries.map(function(e) { return e.key; }),
    ['selectedPatient', 'selectedPatientId']  // sorted
  );

  const auth = groups.find(function(g) { return g.id === 'auth'; });
  assert.equal(auth.entries[0].sensitive, true);

  // every declared group id is unique
  const declared = SESSION_KEY_GROUPS.map(function(g) { return g.id; });
  assert.equal(new Set(declared).size, declared.length);
});

test('groupSessionSnapshot tolerates empty/null snapshots', function() {
  assert.deepEqual(groupSessionSnapshot({}), []);
  assert.deepEqual(groupSessionSnapshot(null), []);
});
