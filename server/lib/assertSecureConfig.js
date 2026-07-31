// server/lib/assertSecureConfig.js
//
// CR-2 remediation (security audit 2026-07-01): a PRODUCTION deployment must not
// run with authentication or access control disabled. disableOauth:true (and
// disableAccessControl:true) ship in settings files; a production profile that
// inherits one opens the FHIR API to unauthenticated access. The reads already
// default secure (absent = enabled), so this module powers a fail-closed startup
// assertion: production refuses to boot with either flag set, while local dev
// (which legitimately runs disableOauth:true) is never blocked.
//
// CommonJS module (require + module.exports), NOT ESM export — dual-context
// (Meteor bundle + node --test on CI's node 20). See memory
// dual-context-lib-must-be-cjs.
// TODO(node24): revert to ESM export once CI runs Node >=24 (Meteor 3.6+).
const { get } = require('lodash');

// Evaluate whether the auth/access-control config is safe to boot.
//   settings            — Meteor.settings (or equivalent)
//   isProduction        — Meteor.isProduction (NODE_ENV=production)
//   sandboxAcknowledged — the deployment DECLARES itself an intentional open
//                         sandbox (unauthenticated FHIR API by design). An open
//                         sandbox is a supported, first-class mode — not an
//                         accident — so when declared, production boots normally.
// Returns { secure, violations: string[], sandboxMode }.
//   - dev (isProduction false): always secure — the flags are allowed locally.
//   - production, no disable flags: secure.
//   - production, disable flags, sandbox DECLARED: secure + sandboxMode:true
//     (an intended open sandbox; caller logs an informational notice).
//   - production, disable flags, NOT declared: INSECURE — the accident case;
//     the caller refuses to boot.
function checkProductionAuthConfig({ settings, isProduction, sandboxAcknowledged = false } = {}) {
  const violations = [];

  if (!isProduction) {
    return { secure: true, violations: violations, sandboxMode: false };
  }

  if (get(settings, 'private.fhir.disableOauth') === true) {
    violations.push('settings.private.fhir.disableOauth is true');
  }
  if (get(settings, 'private.fhir.disableAccessControl') === true) {
    violations.push('settings.private.fhir.disableAccessControl is true');
  }

  if (violations.length === 0) {
    return { secure: true, violations: violations, sandboxMode: false };
  }
  if (sandboxAcknowledged) {
    // Intentional open sandbox — a supported deployment posture. Boot is
    // allowed; the caller logs that the API is unauthenticated by design.
    return { secure: true, violations: violations, sandboxMode: true };
  }
  // Auth disabled in production without declaring an open sandbox — treat as an
  // accidental exposure and refuse to boot.
  return { secure: false, violations: violations, sandboxMode: false };
}

module.exports = { checkProductionAuthConfig };
