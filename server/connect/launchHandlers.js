// server/connect/launchHandlers.js
//
// OAuth redirect landing for the SMART standalone patient launch
// (/connect/callback). The vendor redirects the user's browser here with
// ?code=...&state=... after login+consent. This handler does NOT exchange the
// code itself — it 302s into the app (/patient-fetch) carrying the code+state
// as query params, and the signed-in client completes the exchange via the
// auth-guarded connect.completeLaunch method. The code is single-use and
// PKCE-bound to the server-held verifier, so relaying it through the client
// adds no authority.
//
// Registered redirect URIs (Epic/Cerner app registrations):
//   https://orbital.healthcare/connect/callback   (hosted)
//   http://localhost:3000/connect/callback        (Electron/dev loopback)

import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';

const log = (Meteor.Logger ? Meteor.Logger.for('Connect') : console);

WebApp.connectHandlers.use('/connect/callback', function(req, res) {
  const requestUrl = new URL(req.url, 'http://localhost');
  const code = requestUrl.searchParams.get('code') || '';
  const state = requestUrl.searchParams.get('state') || '';
  const vendorError = requestUrl.searchParams.get('error') || '';

  const target = new URL('/patient-fetch', 'http://localhost');
  target.searchParams.set('view', 'identifier');
  if (vendorError) {
    log.warn('callback carried vendor error', { error: vendorError });
    target.searchParams.set('connect-error', vendorError);
  } else if (code && state) {
    target.searchParams.set('connect-code', code);
    target.searchParams.set('connect-state', state);
  } else {
    log.warn('callback missing code/state');
    target.searchParams.set('connect-error', 'missing_code_or_state');
  }

  res.writeHead(302, { Location: target.pathname + target.search });
  res.end();
});

console.log('[Connect] /connect/callback handler registered');
