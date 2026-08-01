// tests/unit/imports/lib/updateCheck.test.mjs
//
// node --test tests/unit/imports/lib/updateCheck.test.mjs
//
// Pure release-feed evaluation for the self-distribution updater: semver-ish
// comparison + feed → status derivation. The network/startup side lives in
// server/UpdateChecker.js; this layer must stay dependency-free.

import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, evaluateReleaseFeed } from '../../../../imports/lib/updateCheck.js';

test('compareVersions orders semver-ish strings', () => {
  assert.equal(compareVersions('1.0.0', '0.9.9'), 1);
  assert.equal(compareVersions('0.9.0', '0.10.0'), -1);
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0);
  assert.equal(compareVersions('1.2', '1.2.0'), 0);
  assert.equal(compareVersions('v1.3.0', '1.2.9'), 1);   // tolerant of v-prefix
  assert.equal(compareVersions('garbage', '1.0.0'), -1); // unparseable sorts lowest
});

test('evaluateReleaseFeed reports an available update', () => {
  const feed = {
    updatedAt: '2026-07-31',
    products: {
      'chronicle-desktop': {
        latest: '0.9.1',
        released: '2026-07-31',
        notes: 'SMART connect to Epic.',
        downloadUrl: 'https://orbital.healthcare/downloads/chronicle-0.9.1.dmg'
      }
    }
  };
  const status = evaluateReleaseFeed(feed, 'chronicle-desktop', '0.9.0');
  assert.equal(status.updateAvailable, true);
  assert.equal(status.latest, '0.9.1');
  assert.equal(status.current, '0.9.0');
  assert.equal(status.notes, 'SMART connect to Epic.');
  assert.equal(status.downloadUrl, 'https://orbital.healthcare/downloads/chronicle-0.9.1.dmg');
});

test('evaluateReleaseFeed reports up-to-date when current >= latest', () => {
  const feed = { products: { app: { latest: '1.0.0' } } };
  assert.equal(evaluateReleaseFeed(feed, 'app', '1.0.0').updateAvailable, false);
  assert.equal(evaluateReleaseFeed(feed, 'app', '1.1.0').updateAvailable, false);
});

test('evaluateReleaseFeed degrades gracefully on bad input', () => {
  assert.equal(evaluateReleaseFeed(null, 'app', '1.0.0').updateAvailable, false);
  assert.equal(evaluateReleaseFeed({}, 'app', '1.0.0').updateAvailable, false);
  assert.equal(evaluateReleaseFeed({ products: {} }, 'app', '1.0.0').updateAvailable, false);
  // unknown current version → never nag
  const feed = { products: { app: { latest: '2.0.0' } } };
  assert.equal(evaluateReleaseFeed(feed, 'app', '').updateAvailable, false);
  assert.equal(evaluateReleaseFeed(feed, 'app', null).updateAvailable, false);
});
