// imports/lib/updateCheck.js
//
// Pure release-feed evaluation for the self-distribution updater. The
// homepage serves /releases.json (extensions/orbital-homepage/server/http.js);
// server/UpdateChecker.js fetches it once at startup and runs the payload
// through evaluateReleaseFeed(). Dependency-free so it stays node --test-able
// (npm run test:update-check).

// Semver-ish compare: returns 1 / 0 / -1. Tolerates a leading "v" and
// missing segments ("1.2" == "1.2.0"). Unparseable input sorts lowest so a
// mangled feed can never claim to be newer than a real version.
export function compareVersions(a, b) {
  function parse(value) {
    const cleaned = String(value || '').trim().replace(/^v/i, '');
    if (!/^\d+(\.\d+)*($|[-+])/.test(cleaned)) {
      return null;
    }
    return cleaned.split(/[-+]/)[0].split('.').map(function(n) { return parseInt(n, 10) || 0; });
  }
  const pa = parse(a);
  const pb = parse(b);
  if (!pa && !pb) { return 0; }
  if (!pa) { return -1; }
  if (!pb) { return 1; }
  const length = Math.max(pa.length, pb.length);
  for (let i = 0; i < length; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) { return 1; }
    if (na < nb) { return -1; }
  }
  return 0;
}

// feed × product × currentVersion → status object for the UI. Never throws;
// every failure mode is "no update" (an updater must never break the app it
// is trying to update).
export function evaluateReleaseFeed(feed, productKey, currentVersion) {
  const product = (feed && feed.products && feed.products[productKey]) || null;
  const latest = (product && product.latest) || '';
  const current = String(currentVersion || '');

  const status = {
    updateAvailable: false,
    current: current,
    latest: latest,
    released: (product && product.released) || '',
    notes: (product && product.notes) || '',
    downloadUrl: (product && product.downloadUrl) || '',
    downloads: (product && product.downloads) || {}
  };

  // Unknown current version → never nag (misconfigured deployment should
  // not spam users with a false update flag).
  if (!product || !latest || !current) {
    return status;
  }
  status.updateAvailable = compareVersions(latest, current) === 1;
  return status;
}
