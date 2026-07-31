// tests/unit/server/lib/outboundUrlGuard.test.mjs
//
// CR-10 reproduction + regression test (security audit 2026-07-01).
//
// The hole: the UDAP registration flow fetches URLs extracted verbatim from a
// caller-supplied certificate's authorityInfoAccess / cRLDistributionPoints
// extensions (OAuthEndpoints.js recursive fetchCertificate / fetchRevokationList),
// with no host validation. A crafted cert makes the server fetch internal
// endpoints — cloud metadata (169.254.169.254), loopback, private ranges (SSRF).
//
// Drives server/lib/outboundUrlGuard.js — isSafeOutboundUrl(), which the fetch
// sites now consult before making a request.
// Run: node --test tests/unit/server/lib/outboundUrlGuard.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import outboundUrlGuardModule from '../../../../server/lib/outboundUrlGuard.js';
const { isSafeOutboundUrl } = outboundUrlGuardModule;

// --- the vulnerability: internal / metadata / private targets are blocked -----

test('blocks the cloud-metadata IMDS address (the sharpest SSRF)', () => {
  assert.equal(isSafeOutboundUrl('http://169.254.169.254/latest/meta-data/').safe, false);
});

test('blocks loopback (v4 + v6) and localhost', () => {
  assert.equal(isSafeOutboundUrl('http://127.0.0.1/x').safe, false);
  assert.equal(isSafeOutboundUrl('http://localhost:8080/x').safe, false);
  assert.equal(isSafeOutboundUrl('http://[::1]/x').safe, false);
});

test('blocks RFC-1918 private ranges', () => {
  for (const h of ['http://10.0.0.5/', 'http://172.16.0.1/', 'http://172.31.255.1/', 'http://192.168.1.1/']) {
    assert.equal(isSafeOutboundUrl(h).safe, false, h);
  }
});

test('blocks internal-looking hostnames and metadata alias', () => {
  assert.equal(isSafeOutboundUrl('http://foo.internal/x').safe, false);
  assert.equal(isSafeOutboundUrl('http://db.local/x').safe, false);
  assert.equal(isSafeOutboundUrl('http://metadata.google.internal/x').safe, false);
});

test('blocks non-http(s) schemes', () => {
  assert.equal(isSafeOutboundUrl('file:///etc/passwd').safe, false);
  assert.equal(isSafeOutboundUrl('gopher://x/').safe, false);
});

test('rejects an unparseable url', () => {
  assert.equal(isSafeOutboundUrl('not a url').safe, false);
  assert.equal(isSafeOutboundUrl('').safe, false);
});

// --- legitimate public CA endpoints are allowed ------------------------------

test('allows a public https CA endpoint', () => {
  assert.equal(isSafeOutboundUrl('https://certs.ca.example.com/aia/intermediate.crt').safe, true);
  assert.equal(isSafeOutboundUrl('http://crl.ca.example.com/list.crl').safe, true);
});

// --- optional allowlist tightens to specific hosts ---------------------------

test('an allowlist, when configured, restricts to matching hosts (suffix match)', () => {
  const opts = { allowlist: ['ca.example.com'] };
  assert.equal(isSafeOutboundUrl('https://certs.ca.example.com/x', opts).safe, true, 'subdomain matches');
  assert.equal(isSafeOutboundUrl('https://ca.example.com/x', opts).safe, true, 'exact matches');
  assert.equal(isSafeOutboundUrl('https://evil.example.org/x', opts).safe, false, 'non-listed host blocked');
});

test('an internal target is still blocked even if the allowlist would match', () => {
  const opts = { allowlist: ['internal'] };
  assert.equal(isSafeOutboundUrl('http://foo.internal/x', opts).safe, false);
});
