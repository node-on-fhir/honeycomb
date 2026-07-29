// imports/lib/notify.js
//
// Lightweight app-wide toast/notification helper. Replaces the old
// mainAppDialogJson "success/error message" channel (whose host never existed —
// see .claude/rules/meteor/session-keys.md) with a real MUI Snackbar rendered
// by AppSnackbar.jsx, mounted once at the app root.
//
// Decoupled by design: notify() dispatches a window CustomEvent, so any package
// (core/*, npmPackages/*, extensions/*) can raise a toast without importing UI
// or sharing Session state. Import the constant, not the raw event name, so a
// typo is a build error rather than a silently-dropped event.

export const NOTIFY_EVENT = 'honeycomb:notify';

// Infer severity from the title when not given explicitly, so the many existing
// { title, message } call sites (Success / Error Saving… / No Patient Selected)
// map to sensible colors without per-site edits.
function inferSeverity(title) {
  const t = String(title || '').toLowerCase();
  if (/error|fail|unable|invalid|denied|not allowed/.test(t)) return 'error';
  if (/success|saved|created|updated|revoked|deleted|complete/.test(t)) return 'success';
  if (/warn|no patient|required|missing|please/.test(t)) return 'warning';
  return 'info';
}

// notify({ title, message, severity?, duration? })
export function notify(options) {
  const opts = options || {};
  const detail = {
    title: opts.title || '',
    message: opts.message || '',
    severity: opts.severity || inferSeverity(opts.title),
    duration: typeof opts.duration === 'number' ? opts.duration : 5000
  };
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(NOTIFY_EVENT, { detail: detail }));
  }
  return detail;
}

export default notify;
