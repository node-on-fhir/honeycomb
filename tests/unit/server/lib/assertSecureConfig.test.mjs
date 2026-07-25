// tests/unit/server/lib/assertSecureConfig.test.mjs
//
// CR-2 reproduction + regression test (security audit 2026-07-01).
//
// The hole: disableOauth:true (and disableAccessControl:true) ship in settings
// files. A production profile inheriting one opens the FHIR API to
// unauthenticated access. The reads already default secure (absent = enabled),
// so the teeth is a startup assertion that refuses to boot a PRODUCTION
// deployment with either flag set — while leaving local dev (which legitimately
// runs disableOauth:true) untouched.
//
// Drives server/lib/assertSecureConfig.js — the pure checker the startup
// assertion calls. Run: node --test tests/unit/server/lib/assertSecureConfig.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import assertSecureConfigModule from '../../../../server/lib/assertSecureConfig.js';
const { checkProductionAuthConfig } = assertSecureConfigModule;

// --- dev is never blocked (localhost runs disableOauth:true by design) --------

test('development is always secure — the flags are allowed in dev', () => {
  const settings = { private: { fhir: { disableOauth: true, disableAccessControl: true } } };
  const r = checkProductionAuthConfig({ settings, isProduction: false });
  assert.equal(r.secure, true);
  assert.equal(r.violations.length, 0);
});

// --- production with the flags off is fine ------------------------------------

test('production with auth enabled (flags absent) is secure', () => {
  const r = checkProductionAuthConfig({ settings: { private: { fhir: {} } }, isProduction: true });
  assert.equal(r.secure, true);
});

// --- the vulnerability: production must refuse the disable flags ---------------

test('production with disableOauth:true is INSECURE (would refuse boot)', () => {
  const settings = { private: { fhir: { disableOauth: true } } };
  const r = checkProductionAuthConfig({ settings, isProduction: true });
  assert.equal(r.secure, false);
  assert.ok(r.violations.some(v => v.includes('disableOauth')));
});

test('production with disableAccessControl:true is INSECURE', () => {
  const settings = { private: { fhir: { disableAccessControl: true } } };
  const r = checkProductionAuthConfig({ settings, isProduction: true });
  assert.equal(r.secure, false);
  assert.ok(r.violations.some(v => v.includes('disableAccessControl')));
});

test('both flags produce two violations', () => {
  const settings = { private: { fhir: { disableOauth: true, disableAccessControl: true } } };
  const r = checkProductionAuthConfig({ settings, isProduction: true });
  assert.equal(r.secure, false);
  assert.equal(r.violations.length, 2);
});

// --- intentional open sandbox is a supported first-class mode -----------------

test('a declared open sandbox lets production boot with auth off (supported mode)', () => {
  const settings = { private: { fhir: { disableOauth: true } } };
  const r = checkProductionAuthConfig({ settings, isProduction: true, sandboxAcknowledged: true });
  assert.equal(r.secure, true, 'a declared open sandbox is allowed to boot');
  assert.equal(r.sandboxMode, true, 'flagged as sandbox mode for the informational notice');
  assert.ok(r.violations.length > 0, 'the disabled flags are still reported');
});

test('the sandbox declaration is a no-op when config is already secure', () => {
  const r = checkProductionAuthConfig({ settings: { private: { fhir: {} } }, isProduction: true, sandboxAcknowledged: true });
  assert.equal(r.secure, true);
  assert.equal(r.sandboxMode, false);
});
