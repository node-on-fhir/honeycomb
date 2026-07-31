// imports/ui/themeBackgrounds.js
//
// The ambiance-background library backing the ThemeDialog carousel. This is a
// SEPARATE axis from the palette/font presets — a background layers over
// whichever preset is active, applied via the theme's existing
// backgroundImagePath key.
//
// The list is settings-driven: settings.public.theme.backgroundLibrary = [{name,
// src}] overrides the default set below. That's the seam for a future
// orchestration extension to supply its own asset directory / links without a
// code change. Images ported from the private symptomatic:theming pack into
// public/backgrounds/ambiance/.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

const BASE = '/backgrounds/ambiance';

// Default library (code fallback). Curated spa / zen / medical / gradient set.
export const DEFAULT_BACKGROUND_LIBRARY = [
  { name: 'Zen Rocks',   src: BASE + '/Zen-Rocks.jpg' },
  { name: 'Zen Garden',  src: BASE + '/Zen.jpg' },
  { name: 'Large Zen',   src: BASE + '/LargeZenRocks.jpg' },
  { name: 'Bamboo',      src: BASE + '/BambooIllustration.jpg' },
  { name: 'Yoga Ocean',  src: BASE + '/Yoga-Ocean.jpg' },
  { name: 'Spa Candles', src: BASE + '/Candles.jpg' },
  { name: 'Spa Beds',    src: BASE + '/SpaBeds.jpg' },
  { name: 'Bath Petals', src: BASE + '/BathPetals.jpg' },
  { name: 'Massage',     src: BASE + '/Massage.jpg' },
  { name: 'Med Bay',     src: BASE + '/MedBay.jpg' },
  { name: 'Plasmid',     src: BASE + '/PlasmidBlue.jpg' },
  { name: 'Gradient',    src: BASE + '/Gradient.jpg' }
];

// Resolve the active library: operator/extension override, else the default.
export function getBackgroundLibrary() {
  const configured = get(Meteor, 'settings.public.theme.backgroundLibrary', null);
  if (Array.isArray(configured) && configured.length) {
    return configured.filter(function(entry) { return entry && entry.src; });
  }
  return DEFAULT_BACKGROUND_LIBRARY;
}
