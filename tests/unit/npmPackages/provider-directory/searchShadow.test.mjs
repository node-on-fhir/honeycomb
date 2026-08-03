// tests/unit/npmPackages/provider-directory/searchShadow.test.mjs
//
// node --test tests/unit/npmPackages/provider-directory/searchShadow.test.mjs
//
// The nameLower shadow field powers index-bounded case-sensitive prefix
// search in omniSearch (case-insensitive $regex cannot use a B-tree index,
// and Mongo collation does not apply to $regex). These are the pure shapes:
// per-doc stamping for writers, the updateMany aggregation pipeline for
// backfill, and the missing-docs filter that drives both backfill and the
// readiness check.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toNameLower,
  stampNameShadow,
  nameLowerPipeline,
  backfillFilter
} from '../../../../npmPackages/provider-directory/lib/searchShadow.js';

test('toNameLower lowercases strings and refuses everything else', () => {
  assert.equal(toNameLower('DEACONESS HOSPITAL INC'), 'deaconess hospital inc');
  assert.equal(toNameLower('Waco Family Medicine'), 'waco family medicine');
  assert.equal(toNameLower(''), undefined);
  assert.equal(toNameLower(null), undefined);
  assert.equal(toNameLower(undefined), undefined);
  assert.equal(toNameLower(42), undefined);
  assert.equal(toNameLower({ div: 'x' }), undefined);
});

test('stampNameShadow stamps scalar collections from name', () => {
  const org = { name: 'DEACONESS HOSPITAL INC' };
  stampNameShadow('Organization', org);
  assert.equal(org.nameLower, 'deaconess hospital inc');

  const endpoint = { name: 'Deaconess Health System', address: 'https://x' };
  stampNameShadow('Endpoint', endpoint);
  assert.equal(endpoint.nameLower, 'deaconess health system');

  // nameless doc → no field (never null — the field is simply absent)
  const bare = { address: 'https://y' };
  stampNameShadow('Endpoint', bare);
  assert.equal('nameLower' in bare, false);

  // non-string name → no field
  const junk = { name: { weird: true } };
  stampNameShadow('Location', junk);
  assert.equal('nameLower' in junk, false);
});

test('stampNameShadow builds the multikey array for Practitioner', () => {
  const practitioner = {
    name: [
      { text: 'Dr. Jane Doe', family: 'Doe', given: ['Jane'] },
      { family: 'DOE-SMITH' },
      { given: ['NoFamily'] },        // no text/family → contributes nothing
      null                             // junk entry tolerated
    ]
  };
  stampNameShadow('Practitioner', practitioner);
  assert.deepEqual(practitioner.nameLower, ['dr. jane doe', 'doe', 'doe-smith']);

  const empty = { name: [] };
  stampNameShadow('Practitioner', empty);
  assert.equal('nameLower' in empty, false);

  const missing = {};
  stampNameShadow('Practitioner', missing);
  assert.equal('nameLower' in missing, false);
});

test('nameLowerPipeline scalar shape guards $type and uses $$REMOVE', () => {
  const pipeline = nameLowerPipeline('Organization');
  assert.ok(Array.isArray(pipeline) && pipeline.length === 1);
  const setStage = pipeline[0].$set.nameLower;
  assert.deepEqual(setStage.$cond[0], { $eq: [{ $type: '$name' }, 'string'] });
  assert.deepEqual(setStage.$cond[1], { $toLower: '$name' });
  assert.equal(setStage.$cond[2], '$$REMOVE');
});

test('nameLowerPipeline Practitioner shape tolerates missing arrays and fields', () => {
  const pipeline = nameLowerPipeline('Practitioner');
  const expr = pipeline[0].$set.nameLower;
  // Must guard non-array name and filter out empty strings.
  const asJson = JSON.stringify(expr);
  assert.ok(asJson.includes('$isArray'), 'guards non-array name');
  assert.ok(asJson.includes('$filter'), 'filters empty contributions');
  assert.ok(asJson.includes('$$n.text') && asJson.includes('$$n.family'), 'covers text and family');
});

test('backfillFilter selects docs with a string name but no shadow', () => {
  assert.deepEqual(backfillFilter('Organization'), {
    name: { $type: 'string' },
    nameLower: { $exists: false }
  });
  // Practitioner: name is an array of HumanName
  assert.deepEqual(backfillFilter('Practitioner'), {
    name: { $type: 'array', $ne: [] },
    nameLower: { $exists: false }
  });
});
