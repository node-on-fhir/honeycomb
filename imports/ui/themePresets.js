// imports/ui/themePresets.js
//
// The three primary theme presets and the runtime apply helpers. A preset is a
// full palette bundle + optional font; applying one writes into
// Meteor.settings.public.theme (the single palette authority CustomThemeProvider
// reads) and pokes Session('themeRefreshRequest') to regenerate the MUI theme —
// the exact mechanism ThemingPage's "Load Theme Into Settings" uses.
//
// Three axes are independent: preset (palette base), accent hue (the sliding
// mono→single-hue control), font, and background image all layer without
// resetting each other. Selections persist via themePersistence.js.
//
// Brand model: 2 degrees of freedom (mode × accent hue) is the norm —
// Limestone (grayscale) and Tron (one hue). Vaporwave is the advanced 3-hue
// look ported from the Provider Directory console.

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';
import { saveThemeChoice, loadThemeChoice } from '/imports/lib/themePersistence.js';
import { PAGE_MODE, CARD_SURFACE, PAGE_SURFACE_OVERRIDES } from '/imports/lib/SessionKeys.js';

// Self-hosted display pairing (client/main.css @font-face; /fonts/*.woff2).
export const CHAKRA_FONT = "'Chakra Petch', 'Avenir Next Condensed', sans-serif";
export const MARTIAN_FONT = "'Martian Mono', 'SF Mono', ui-monospace, monospace";
export const DEFAULT_FONT = '"Roboto", "Helvetica", "Arial", sans-serif';

// A neutral warm-gray ramp shared by the monochrome presets.
const STONE = {
  canvasDark: '#0d0d0f',
  paperDark: '#18181a',
  ink: '#d8d2c4',
  inkDim: '#8a8579'
};

export const THEME_PRESETS = [
  {
    id: 'limestone',
    name: 'Limestone',
    description: 'Grayscale monochrome. Calm, brand-neutral, the default.',
    mode: 'dark',
    accentHue: '#b9b3a4',            // desaturated stone — effectively "no hue"
    palette: {
      mode: 'dark',
      primaryColor: '#b9b3a4',
      secondaryColor: '#8a8579',
      backgroundCanvasDark: STONE.canvasDark,
      paperColorDark: STONE.paperDark,
      cardColorDark: STONE.paperDark,
      appBarColorDark: '#141416',
      appBarTextColorDark: STONE.ink
    }
  },
  {
    id: 'tron',
    name: 'Tron',
    description: 'Grayscale + one accent hue. Dial the hue below.',
    mode: 'dark',
    accentHue: '#53e6ff',            // default cyan; user dials via HueSelector
    appBarTracksAccent: true,        // header + footer text follow the dialed hue
    palette: {
      mode: 'dark',
      primaryColor: '#53e6ff',
      secondaryColor: '#2aa5bd',
      backgroundCanvasDark: '#05070a',
      paperColorDark: '#0b1220',
      cardColorDark: '#0b1220',
      appBarColorDark: '#070b12',
      appBarTextColorDark: '#53e6ff'
    }
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'The Provider Directory look — 3-hue, Chakra Petch. Advanced.',
    advanced: true,
    mode: 'dark',
    accentHue: '#ffb454',            // amber lead; green/cyan/magenta as secondaries
    appBarTracksAccent: true,        // header + footer text follow the amber lead
    fontFamily: CHAKRA_FONT,
    displayFontFamily: CHAKRA_FONT,
    palette: {
      mode: 'dark',
      primaryColor: '#ffb454',
      secondaryColor: '#ff5ea8',
      errorColor: '#ff5ea8',
      successColor: '#69f0ae',
      infoColor: '#53e6ff',
      backgroundCanvasDark: '#0a0a0b',
      paperColorDark: '#141416',
      cardColorDark: '#18181a',
      appBarColorDark: '#0a0a0b',
      appBarTextColorDark: '#ffb454'
    }
  }
];

export function getPreset(presetId) {
  return THEME_PRESETS.find(function(p) { return p.id === presetId; }) || null;
}

// Ensure the settings tree exists before we write into it.
function ensureThemeSettings() {
  if (!Meteor.settings) { Meteor.settings = {}; }
  if (!Meteor.settings.public) { Meteor.settings.public = {}; }
  if (!Meteor.settings.public.theme) { Meteor.settings.public.theme = {}; }
  if (!Meteor.settings.public.theme.palette) { Meteor.settings.public.theme.palette = {}; }
  if (!Meteor.settings.public.theme.typography) { Meteor.settings.public.theme.typography = {}; }
  return Meteor.settings.public.theme;
}

// Regenerate the live MUI theme (CustomThemeProvider watches this flag).
function pokeRefresh() {
  Session.set('themeRefreshRequest', true);
}

// Apply a full preset (palette + optional font), honoring live overrides for
// the accent hue and font that the dialog controls carry independently.
export function applyThemePreset(presetId, options) {
  const preset = getPreset(presetId);
  if (!preset) { return; }
  const theme = ensureThemeSettings();

  Object.assign(theme.palette, preset.palette);

  // A preset switch is a fresh base — drop any per-field overrides from the
  // previous preset so e.g. a Tron appbar tweak doesn't bleed into Limestone.
  saveThemeChoice({ paletteOverrides: null });

  const accentHue = get(options, 'accentHueOverride') || preset.accentHue;
  if (accentHue) {
    theme.palette.primaryColor = accentHue;
    // Accent presets (Tron/Vaporwave) carry the hue into the app chrome so the
    // Header title/icons and Footer track it; Limestone keeps its neutral ink.
    if (preset.appBarTracksAccent) {
      theme.palette.appBarTextColor = accentHue;
      theme.palette.appBarTextColorDark = accentHue;
    }
  }

  const font = get(options, 'fontOverride') || preset.fontFamily || null;
  theme.typography.fontFamily = font || '';
  theme.typography.displayFontFamily = font ? (preset.displayFontFamily || font) : '';

  if (preset.mode) {
    theme.palette.mode = preset.mode;
    theme.darkMode = preset.mode === 'dark';
    Session.set('theme', preset.mode);
  }

  saveThemeChoice({
    presetId: presetId,
    accentHue: accentHue || null,
    fontFamily: font || null,
    mode: preset.mode || Session.get('theme')
  });
  pokeRefresh();
}

// Live control: set only the accent hue (Tron/Limestone slider). When the
// active preset tracks accent in its chrome (Tron/Vaporwave), the appbar text
// follows too so Header + Footer restyle with the dial.
export function setAccentHue(hex) {
  const theme = ensureThemeSettings();
  theme.palette.primaryColor = hex;
  const choice = loadThemeChoice() || {};
  const activePreset = getPreset(choice.presetId);
  if (activePreset && activePreset.appBarTracksAccent) {
    theme.palette.appBarTextColor = hex;
    theme.palette.appBarTextColorDark = hex;
  }
  saveThemeChoice({ accentHue: hex });
  pokeRefresh();
}

// Live control: set one per-field palette override (from PaletteFieldEditor).
// Writes the live settings AND persists into the choice's paletteOverrides map
// so it survives reload (re-applied at boot after the preset). Empty value
// clears that key's override.
export function setPaletteOverride(fieldKey, value) {
  const theme = ensureThemeSettings();
  const choice = loadThemeChoice() || {};
  const overrides = Object.assign({}, get(choice, 'paletteOverrides', {}));
  if (value) {
    theme.palette[fieldKey] = value;
    overrides[fieldKey] = value;
  } else {
    delete theme.palette[fieldKey];
    delete overrides[fieldKey];
  }
  saveThemeChoice({ paletteOverrides: overrides });
  pokeRefresh();
}

// Live control: set only the font (empty string → back to the default stack).
export function setThemeFont(fontFamily) {
  const theme = ensureThemeSettings();
  theme.typography.fontFamily = fontFamily || '';
  theme.typography.displayFontFamily = fontFamily || '';
  saveThemeChoice({ fontFamily: fontFamily || null });
  pokeRefresh();
}

// Live control: set (or clear) the ambiance background image.
export function setThemeBackground(src) {
  const theme = ensureThemeSettings();
  set(theme, 'backgroundImagePath', src || '');
  saveThemeChoice({ backgroundImagePath: src || null });
  pokeRefresh();
}

const CARD_SURFACES = ['solid', 'glass', 'flat'];

// Live control: content-ink mode for ambiance-enabled pages ('light'|'dark');
// null/undefined clears the override (app mode stands). Chrome keeps Session('theme').
export function setPageMode(mode) {
  const next = (mode === 'light' || mode === 'dark') ? mode : null;
  Session.set(PAGE_MODE, next || undefined);
  saveThemeChoice({ pageMode: next });
  pokeRefresh();
}

// Live control: card surface state. Unknown values coerce to 'solid'.
export function setCardSurface(surface) {
  const next = CARD_SURFACES.indexOf(surface) !== -1 ? surface : 'solid';
  Session.set(CARD_SURFACE, next);
  saveThemeChoice({ cardSurface: next });
  pokeRefresh();
}

// Live control: advance the card surface one step (Ctrl+Shift+L).
export function cycleCardSurface() {
  const current = Session.get(CARD_SURFACE) || 'solid';
  const next = CARD_SURFACES[(CARD_SURFACES.indexOf(current) + 1) % CARD_SURFACES.length];
  setCardSurface(next);
}

// Live control: per-route card <-> full-height override (Ctrl+Shift+K).
// Toggles the active pathname between 'flat' (one-page/full-height) and no
// override (global cardSurface stands). Spec: onePageLayout revival.
export function togglePageSurfaceOverride(pathname) {
  if (!pathname) { return; }
  const overrides = Object.assign({}, Session.get(PAGE_SURFACE_OVERRIDES) || {});
  if (overrides[pathname]) {
    delete overrides[pathname];
  } else {
    overrides[pathname] = 'flat';
  }
  Session.set(PAGE_SURFACE_OVERRIDES, overrides);
  saveThemeChoice({ pageSurfaceOverrides: overrides });
  pokeRefresh();
}

// Boot: re-apply the persisted choice into Meteor.settings BEFORE the
// CustomThemeProvider mounts, so createDynamicTheme reads correct values on
// first render (no flash). Deliberately does NOT save or poke refresh — the
// provider hasn't mounted yet and will read these fresh.
export function applyThemeChoiceAtBoot() {
  const choice = loadThemeChoice();
  if (!choice) { return; }
  const theme = ensureThemeSettings();

  const preset = getPreset(choice.presetId);
  if (preset) {
    Object.assign(theme.palette, preset.palette);
    if (preset.mode) {
      theme.palette.mode = preset.mode;
      theme.darkMode = preset.mode === 'dark';
    }
  }
  if (choice.accentHue) {
    theme.palette.primaryColor = choice.accentHue;
    if (preset && preset.appBarTracksAccent) {
      theme.palette.appBarTextColor = choice.accentHue;
      theme.palette.appBarTextColorDark = choice.accentHue;
    }
  }
  if (choice.mode) {
    theme.palette.mode = choice.mode;
    theme.darkMode = choice.mode === 'dark';
    Session.set('theme', choice.mode);
  }
  if ('fontFamily' in choice) {
    theme.typography.fontFamily = choice.fontFamily || '';
    theme.typography.displayFontFamily = choice.fontFamily || (preset && preset.displayFontFamily) || '';
  }
  if ('backgroundImagePath' in choice) {
    set(theme, 'backgroundImagePath', choice.backgroundImagePath || '');
  }

  // Ambiance axes — unknown persisted values are treated as unset
  // (forward/backward compat per the ambiance spec).
  if (choice.pageMode === 'light' || choice.pageMode === 'dark') {
    Session.set(PAGE_MODE, choice.pageMode);
  }
  if (CARD_SURFACES.indexOf(choice.cardSurface) !== -1) {
    Session.set(CARD_SURFACE, choice.cardSurface);
  }

  // Per-route surface overrides — keep only well-formed entries.
  const rawOverrides = choice.pageSurfaceOverrides;
  if (rawOverrides && typeof rawOverrides === 'object' && !Array.isArray(rawOverrides)) {
    const clean = {};
    Object.keys(rawOverrides).forEach(function(path) {
      if (rawOverrides[path] === 'flat' || rawOverrides[path] === 'solid') { clean[path] = rawOverrides[path]; }
    });
    if (Object.keys(clean).length) { Session.set(PAGE_SURFACE_OVERRIDES, clean); }
  }

  // Per-field overrides last, so they win over the preset + accent base
  // (matches createDynamicTheme precedence). Set by PaletteFieldEditor via
  // setPaletteOverride; cleared on preset switch.
  const overrides = get(choice, 'paletteOverrides', null);
  if (overrides && typeof overrides === 'object') {
    Object.assign(theme.palette, overrides);
  }
}
