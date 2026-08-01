// server/UpdateChecker.js
//
// Self-distribution update check: ping the homepage's /releases.json ONCE
// at startup (plus on explicit request from the About dialog) and cache the
// result for the client. This is deliberately not an auto-updater — it only
// surfaces "a newer build exists" so the Header can show the Update
// Available affordance.
//
// Privacy posture: a bare GET with no query params, no machine ids, no
// version beacon — the feed operator learns nothing but a hit in the
// access log. Settings-gated; absent config disables the check entirely.
//
//   Meteor.settings.public.updates = {
//     "releasesUrl": "https://orbital.healthcare/releases.json",
//     "product": "chronicle-desktop",
//     "currentVersion": "0.9.0"        // stamped by the desktop build
//   }

import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import { get } from 'lodash';
import { evaluateReleaseFeed } from '/imports/lib/updateCheck.js';

const log = (Meteor.Logger ? Meteor.Logger.for('UpdateChecker') : console);

const STARTUP_DELAY_MS = 15 * 1000;   // stay out of the boot path
const FETCH_TIMEOUT_MS = 10 * 1000;

// Cached result of the most recent check (null until the first one runs).
let lastStatus = null;
let lastCheckedAt = null;
let lastError = null;

function updateSettings() {
  return get(Meteor, 'settings.public.updates', null);
}

export async function runUpdateCheck(reason) {
  const settings = updateSettings();
  const releasesUrl = get(settings, 'releasesUrl', '');
  if (!releasesUrl) {
    log.info('update check skipped — no settings.public.updates.releasesUrl configured');
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(releasesUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error('release feed returned HTTP ' + response.status);
    }
    const feed = JSON.parse(text);
    lastStatus = evaluateReleaseFeed(
      feed,
      get(settings, 'product', ''),
      get(settings, 'currentVersion', '')
    );
    lastCheckedAt = new Date();
    lastError = null;
    log.info('update check complete', {
      reason: reason,
      updateAvailable: lastStatus.updateAvailable,
      current: lastStatus.current,
      latest: lastStatus.latest
    });
  } catch (error) {
    // An updater must never break the app it updates — record and move on.
    lastError = error.message;
    lastCheckedAt = new Date();
    log.warn('update check failed', { reason: reason, error: error.message });
  } finally {
    clearTimeout(timeout);
  }
  return lastStatus;
}

Meteor.startup(function() {
  if (!get(updateSettings(), 'releasesUrl', '')) {
    log.info('update check disabled (no releasesUrl)');
    return;
  }
  // Once per process start, off the boot path.
  Meteor.setTimeout(function() {
    runUpdateCheck('startup').catch(function(error) {
      log.warn('startup update check crashed', { error: error.message });
    });
  }, STARTUP_DELAY_MS);
});

Meteor.ServerMethods.define('updates.getStatus', {
  description: 'Cached update-check result + host runtime info for the About dialog.',
  requireAuth: true,
  positionalParams: [],
  schemaObject: { type: 'object', properties: {} }
}, async function(params, context){
  const settings = updateSettings();
  return {
    configured: !!get(settings, 'releasesUrl', ''),
    releasesUrl: get(settings, 'releasesUrl', ''),
    product: get(settings, 'product', ''),
    currentVersion: get(settings, 'currentVersion', ''),
    status: lastStatus,
    checkedAt: lastCheckedAt,
    error: lastError,
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      meteorRelease: Meteor.release,
      // Present only when the server runs inside an Electron bundle; the
      // renderer-side Electron version is parsed from the userAgent instead.
      electronVersion: get(process, 'versions.electron', '')
    }
  };
});

Meteor.ServerMethods.define('updates.checkNow', {
  description: 'Re-fetch the release feed on demand (About dialog button).',
  requireAuth: true,
  positionalParams: [],
  schemaObject: { type: 'object', properties: {} }
}, async function(params, context){
  await runUpdateCheck('manual');
  return { status: lastStatus, checkedAt: lastCheckedAt, error: lastError };
});
