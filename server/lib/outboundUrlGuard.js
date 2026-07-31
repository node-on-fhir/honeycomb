// server/lib/outboundUrlGuard.js
//
// CR-10 remediation (security audit 2026-07-01): validate a URL before the
// server fetches it, so a caller-controlled URL (e.g. a UDAP certificate's
// authorityInfoAccess / cRLDistributionPoints extension) cannot make the server
// reach internal targets — cloud metadata (169.254.169.254), loopback, or
// RFC-1918 private ranges (SSRF).
//
// CommonJS module (require + module.exports), NOT ESM export — dual-context
// (Meteor bundle + node --test on CI's node 20). See memory
// dual-context-lib-must-be-cjs.
// TODO(node24): revert to ESM export once CI runs Node >=24 (Meteor 3.6+).
//
// NOTE (residual): this validates the URL's literal host. It does NOT resolve
// DNS, so a public hostname that resolves to an internal IP (DNS rebinding) is
// not caught here — that needs resolve-then-pin-the-socket, a larger change.
// This closes the direct-IP / internal-hostname SSRF, which is the sharp
// exploit; DNS-rebinding hardening is a documented follow-up.

// True for an IPv4/IPv6 literal in a loopback / private / link-local / reserved
// range that must never be reachable from a server-side fetch.
function isPrivateOrReservedIp(host) {
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = parseInt(v4[1], 10);
    const b = parseInt(v4[2], 10);
    if (a === 0) { return true; }                        // 0.0.0.0/8
    if (a === 127) { return true; }                      // loopback
    if (a === 10) { return true; }                       // private
    if (a === 172 && b >= 16 && b <= 31) { return true; }// private
    if (a === 192 && b === 168) { return true; }         // private
    if (a === 169 && b === 254) { return true; }         // link-local (IMDS)
    if (a === 100 && b >= 64 && b <= 127) { return true; }// CGNAT 100.64/10
    if (a >= 224) { return true; }                       // multicast / reserved
    return false;
  }
  const h = host.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
  if (h === '::1' || h === '::') { return true; }        // IPv6 loopback / unspecified
  if (h.startsWith('fe80:')) { return true; }            // IPv6 link-local
  if (h.startsWith('fc') || h.startsWith('fd')) { return true; } // IPv6 unique-local
  return false;
}

// True for hostnames that conventionally resolve to internal infrastructure.
function isInternalHostname(host) {
  const h = host.toLowerCase();
  if (h === 'localhost') { return true; }
  if (h === 'metadata.google.internal') { return true; }
  if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.localdomain')) { return true; }
  return false;
}

// Validate a URL for server-side fetching.
//   rawUrl    — the candidate URL string
//   allowlist — optional array of hostnames; when non-empty, the host MUST match
//               one (exact, or as a dot-suffix — 'ca.example.com' allows
//               'certs.ca.example.com'). Internal/private targets are blocked
//               regardless of the allowlist.
// Returns { safe: boolean, reason: string }. Never throws.
function isSafeOutboundUrl(rawUrl, { allowlist = [] } = {}) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch (parseError) {
    return { safe: false, reason: 'unparseable url' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { safe: false, reason: 'non-http(s) scheme: ' + url.protocol };
  }

  const host = url.hostname;
  if (!host) {
    return { safe: false, reason: 'no host' };
  }
  if (isInternalHostname(host)) {
    return { safe: false, reason: 'internal hostname: ' + host };
  }
  if (isPrivateOrReservedIp(host)) {
    return { safe: false, reason: 'private/reserved address: ' + host };
  }

  if (Array.isArray(allowlist) && allowlist.length > 0) {
    const matched = allowlist.some(function(entry) {
      return host === entry || host.endsWith('.' + entry);
    });
    if (!matched) {
      return { safe: false, reason: 'host not in allowlist: ' + host };
    }
  }

  return { safe: true, reason: 'ok' };
}

module.exports = { isSafeOutboundUrl };
