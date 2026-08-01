// tests/unit/npmPackages/provider-directory/OrgEndpointLinkage.test.mjs
//
// node --test tests/unit/npmPackages/provider-directory/OrgEndpointLinkage.test.mjs
//
// Tier-1 org→endpoint linkage: exact normalized-name membership only,
// precision over recall. The named traps these tests pin down:
//   - Beth Israel Deaconess must NEVER link via a Deaconess-Evansville name
//   - Spokane's "Deaconess Hospital" (athena lantern list) vs Evansville's
//     NPPES org of the same name → lantern-list evidence carries a locality
//     guard (refused when the org name spans multiple states)
//   - generic names ("clinic", "family medicine") never link
//   - vendor system names (epic-open/cerner) are preferred over lantern lists

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOrgName,
  splitEndpointDisplayNames,
  buildEndpointNameIndex,
  matchOrgTier1,
  passesLocalityGuard,
  GENERIC_NAMES
} from '../../../../npmPackages/provider-directory/lib/OrgEndpointLinkage.js';

test('normalizeOrgName casefolds, strips punctuation and stacked legal suffixes', () => {
  assert.equal(normalizeOrgName('DEACONESS HOSPITAL, INC.'), 'deaconess hospital');
  assert.equal(normalizeOrgName('Deaconess Health System'), 'deaconess health system');
  assert.equal(normalizeOrgName('Acme Medical Group, LLC, Inc'), 'acme medical group');
  assert.equal(normalizeOrgName('Smith & Jones, P.C.'), 'smith and jones');
  assert.equal(normalizeOrgName('  Waco   Family  Medicine  '), 'waco family medicine');
  assert.equal(normalizeOrgName(''), '');
  assert.equal(normalizeOrgName(null), '');
  // suffix token alone never empties a real name
  assert.equal(normalizeOrgName('INC'), 'inc');
});

test('splitEndpointDisplayNames handles the three lineage shapes', () => {
  const lantern = {
    _id: 'l1',
    name: 'Deaconess Hospital; LIBERTY LAKE; VALLEY HOSPITAL AND MEDICAL CENTER',
    meta: { tag: [{ code: 'lantern' }] }
  };
  assert.deepEqual(splitEndpointDisplayNames(lantern), [
    { raw: 'Deaconess Hospital', normalized: 'deaconess hospital' },
    { raw: 'LIBERTY LAKE', normalized: 'liberty lake' },
    { raw: 'VALLEY HOSPITAL AND MEDICAL CENTER', normalized: 'valley hospital and medical center' }
  ]);

  const epic = { _id: 'e1', name: 'Deaconess Health System', meta: { tag: [{ code: 'epic-open' }] } };
  assert.deepEqual(splitEndpointDisplayNames(epic), [
    { raw: 'Deaconess Health System', normalized: 'deaconess health system' }
  ]);

  const cerner = {
    _id: 'c1',
    name: 'Centra Health, Inc.',
    alias: ['Centra'],
    managingOrganization: { display: 'Centra Health, Inc.' },
    meta: { tag: [{ code: 'cerner-ignite' }] }
  };
  const cernerNames = splitEndpointDisplayNames(cerner).map(function (n) { return n.normalized; });
  assert.deepEqual(cernerNames.sort(), ['centra', 'centra health']);
});

test('buildEndpointNameIndex maps names and prefers vendor entries at match time', () => {
  const endpoints = [
    { _id: 'epicDeac', name: 'Deaconess Health System', meta: { tag: [{ code: 'epic-open' }] }, conformance: { patientLaunchable: true } },
    // The same system name also appears inside an athena lantern list
    { _id: 'athena13205', name: 'Ardmore Ortho Plus, LLC; Deaconess Health System; Diesselhorst', meta: { tag: [{ code: 'lantern' }] } },
    // Spokane's Deaconess Hospital in a different athena list
    { _id: 'athena11921', name: 'Deaconess Hospital; LIBERTY LAKE; VALLEY HOSPITAL', meta: { tag: [{ code: 'lantern' }] } }
  ];
  const index = buildEndpointNameIndex(endpoints);

  // Vendor system-name evidence wins over the lantern list containing the same name.
  const system = matchOrgTier1('deaconess health system', index);
  assert.equal(system.endpointId, 'epicDeac');
  assert.equal(system.evidence, 'vendor-name');
  assert.equal(system.requiresLocalityGuard, false);
  assert.ok(system.confidence >= 0.9);

  // Lantern-list-only evidence links, but flagged for the locality guard.
  const listOnly = matchOrgTier1('deaconess hospital', index);
  assert.equal(listOnly.endpointId, 'athena11921');
  assert.equal(listOnly.evidence, 'lantern-list');
  assert.equal(listOnly.requiresLocalityGuard, true);

  // Beth Israel Deaconess: exact equality means NO entry matches.
  assert.equal(matchOrgTier1('beth israel deaconess medical center', index), null);
});

test('ambiguous lantern names (same name in multiple lantern endpoints) are refused', () => {
  const endpoints = [
    { _id: 'a1', name: 'Sunrise Family Practice; Other One', meta: { tag: [{ code: 'lantern' }] } },
    { _id: 'a2', name: 'Sunrise Family Practice; Different Group', meta: { tag: [{ code: 'lantern' }] } }
  ];
  const index = buildEndpointNameIndex(endpoints);
  assert.equal(matchOrgTier1('sunrise family practice', index), null);
});

test('generic and short names never link', () => {
  const endpoints = [
    { _id: 'g1', name: 'Clinic; The Medical Center; Family Medicine', meta: { tag: [{ code: 'lantern' }] } },
    { _id: 'g2', name: 'Acme', meta: { tag: [{ code: 'epic-open' }] } }
  ];
  const index = buildEndpointNameIndex(endpoints);
  assert.ok(GENERIC_NAMES.has('clinic'));
  assert.equal(matchOrgTier1('clinic', index), null);               // generic
  assert.equal(matchOrgTier1('medical center', index), null);       // generic (article stripped upstream is fine either way)
  assert.equal(matchOrgTier1('acme', index), null);                 // too short (<5)
});

test('vendor multi-endpoint same name prefers patientLaunchable, then tag rank', () => {
  const endpoints = [
    { _id: 'cernerX', name: 'Mercy Health System', meta: { tag: [{ code: 'cerner-ignite' }] }, conformance: { patientLaunchable: true } },
    { _id: 'epicX', name: 'Mercy Health System', meta: { tag: [{ code: 'epic-open' }] } }
  ];
  const index = buildEndpointNameIndex(endpoints);
  const hit = matchOrgTier1('mercy health system', index);
  // launchable cerner beats unprobed epic
  assert.equal(hit.endpointId, 'cernerX');

  const endpoints2 = [
    { _id: 'cernerY', name: 'Mercy Health System', meta: { tag: [{ code: 'cerner-ignite' }] } },
    { _id: 'epicY', name: 'Mercy Health System', meta: { tag: [{ code: 'epic-open' }] } }
  ];
  const hit2 = matchOrgTier1('mercy health system', buildEndpointNameIndex(endpoints2));
  // neither probed → epic-open outranks cerner-ignite
  assert.equal(hit2.endpointId, 'epicY');
});

test('passesLocalityGuard: single-state groups pass, multi-state homonyms fail', () => {
  assert.equal(passesLocalityGuard(['IN', 'IN', 'IN']), true);
  assert.equal(passesLocalityGuard(['IN']), true);
  assert.equal(passesLocalityGuard([]), true);                       // no state data at all → nothing contradicts locality
  assert.equal(passesLocalityGuard(['IN', undefined, 'IN']), true);  // missing states ignored
  assert.equal(passesLocalityGuard(['WA', 'IN']), false);            // Spokane vs Evansville
});
