// imports/lib/SmartLaunch.js
//
// Pure SMART-on-FHIR standalone patient-launch builders — no Meteor imports,
// node --test-able (tests/unit/imports/lib/SmartLaunch.test.mjs). The server
// connect module (server/connect/methods.js) supplies the PKCE pair, state,
// and vendor config; these functions only compose wire formats.
//
// From the Patient Records Connect campaign (fable/2026-07-01-patient-records-
// connect.md Task 5): PKCE S256 + state on every launch; `aud` equals the
// FHIR base URL per the SMART App Launch spec.

export function buildAuthorizeUrl(options) {
  const url = new URL(options.authorizationEndpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', options.clientId);
  url.searchParams.set('redirect_uri', options.redirectUri);
  url.searchParams.set('scope', options.scope);
  url.searchParams.set('state', options.state);
  url.searchParams.set('aud', options.aud);
  url.searchParams.set('code_challenge', options.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export function buildTokenExchangeBody(options) {
  const params = new URLSearchParams();
  params.set('grant_type', 'authorization_code');
  params.set('code', options.code);
  params.set('redirect_uri', options.redirectUri);
  params.set('client_id', options.clientId);
  params.set('code_verifier', options.codeVerifier);
  return params.toString();
}
