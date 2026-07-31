// tests/unit/imports/lib/SmartLaunch.test.mjs
//
// node --test tests/unit/imports/lib/SmartLaunch.test.mjs
// Pure SMART standalone-launch builders (PKCE S256 + state + aud).

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthorizeUrl, buildTokenExchangeBody } from '../../../../imports/lib/SmartLaunch.js';

test('buildAuthorizeUrl includes PKCE S256, state, aud, and encoded params', () => {
  const url = buildAuthorizeUrl({
    authorizationEndpoint: 'https://ehr.example/authorize',
    clientId: 'abc',
    redirectUri: 'https://app/connect/callback',
    scope: 'launch/patient patient/*.read',
    state: 'xyz',
    codeChallenge: 'CH',
    aud: 'https://ehr.example/fhir'
  });
  const u = new URL(url);
  assert.equal(u.origin + u.pathname, 'https://ehr.example/authorize');
  assert.equal(u.searchParams.get('response_type'), 'code');
  assert.equal(u.searchParams.get('client_id'), 'abc');
  assert.equal(u.searchParams.get('redirect_uri'), 'https://app/connect/callback');
  assert.equal(u.searchParams.get('scope'), 'launch/patient patient/*.read');
  assert.equal(u.searchParams.get('code_challenge'), 'CH');
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(u.searchParams.get('state'), 'xyz');
  assert.equal(u.searchParams.get('aud'), 'https://ehr.example/fhir');
});

test('buildAuthorizeUrl preserves existing query params on the authorize endpoint', () => {
  const url = buildAuthorizeUrl({
    authorizationEndpoint: 'https://ehr.example/authorize?tenant=t1',
    clientId: 'abc',
    redirectUri: 'https://app/cb',
    scope: 's',
    state: 'st',
    codeChallenge: 'CH',
    aud: 'https://ehr.example/fhir'
  });
  const u = new URL(url);
  assert.equal(u.searchParams.get('tenant'), 't1');
  assert.equal(u.searchParams.get('client_id'), 'abc');
});

test('buildTokenExchangeBody is a urlencoded authorization_code grant with verifier', () => {
  const body = buildTokenExchangeBody({
    code: 'C',
    redirectUri: 'https://app/cb',
    clientId: 'abc',
    codeVerifier: 'V'
  });
  const p = new URLSearchParams(body);
  assert.equal(p.get('grant_type'), 'authorization_code');
  assert.equal(p.get('code'), 'C');
  assert.equal(p.get('redirect_uri'), 'https://app/cb');
  assert.equal(p.get('client_id'), 'abc');
  assert.equal(p.get('code_verifier'), 'V');
});
