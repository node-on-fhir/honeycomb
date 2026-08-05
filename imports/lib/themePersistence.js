// imports/lib/themePersistence.js
//
// Persist the user's theme choice so it survives a reload. v1 = localStorage,
// per-browser, applied at client boot before the theme paints.
//
// Shape (all optional, merge-written):
//   { presetId, accentHue, fontFamily, mode, backgroundImagePath,
//     pageMode, cardSurface,
//     pageSurfaceOverrides: { <pathname>: 'solid'|'flat' },
//     paletteOverrides: { <paletteKey>: <hex> } }
// paletteOverrides are per-field colors set in the PaletteFieldEditor; they
// re-apply at boot AFTER the preset (so they win) and are cleared when a new
// preset is chosen. Passing paletteOverrides: null in a patch clears them.
// pageMode ('light'|'dark') is the ambiance content-ink override; cardSurface
// ('solid'|'glass'|'flat') is the card surface state. Both consumed only by
// ambiance/fluid routes (see the 2026-08-03 ambiance spec).
// pageSurfaceOverrides is the Ctrl+Shift+K per-route card↔full-height map;
// malformed entries are dropped at boot (unknown values treated as unset).
//
// Follow-up (documented, not built): a per-user MongoDB sink so the choice
// follows the account across devices — saveThemeChoice() gains a second write
// and a load-on-login path re-applies it. The shape below is already
// account-portable.

const STORAGE_KEY = 'honeycomb.theme';

function hasStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

// Merge-write: each control saves only the field it owns, so partial saves
// (hue-only, font-only) don't clobber the rest of the choice.
export function saveThemeChoice(patch) {
  if (!hasStorage() || !patch) { return; }
  try {
    const current = loadThemeChoice() || {};
    const next = Object.assign({}, current, patch);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // storage full / disabled — non-fatal, theme just won't persist
  }
}

export function loadThemeChoice() {
  if (!hasStorage()) { return null; }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function clearThemeChoice() {
  if (!hasStorage()) { return; }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // non-fatal
  }
}
