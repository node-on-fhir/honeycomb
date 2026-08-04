// imports/ui/guards/AmbianceZone.jsx
//
// Router-level zone wrapper (composes like AuthGuard/PatientGuard — see
// App.jsx StyledMainRouter). On routes declaring enableAmbiance or
// enableFluidInterface it: (1) assembles the composition object from the
// active background's curation record + persisted axes, (2) provides it via
// AmbianceContext + --ambiance-* CSS vars, and (3) wraps children in a
// page-mode theme carrying MuiCard/MuiPaper overrides for the active card
// surface — so even raw MUI cards render legibly over ambiance
// (correctness by construction; discipline not required). With neither flag
// it renders children unchanged. Spec:
// docs/superpowers/specs/2026-08-03-ambiance-experience-zone-design.md

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme, createTheme } from '@mui/material/styles';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { resolveComposition } from '../theme/ambianceComposition.js';
import { buildSurfaceStyles } from '../theme/surfaceStyles.js';
import { buildPageModeTheme } from '../theme/pageModeTheme.js';
import { getBackgroundEntry } from '../themeBackgrounds.js';
import { AmbianceContext } from '../theme/AmbianceContext.js';
import { PAGE_MODE, CARD_SURFACE, PAGE_SURFACE_OVERRIDES } from '/imports/lib/SessionKeys.js';

export function AmbianceZone(props) {
  const ambiance = !!props.ambiance;
  const fluid = !!props.fluid || ambiance;   // enableAmbiance implies fluid
  const appTheme = useTheme();
  const location = useLocation();

  // Reactive axes (Session); background is a PLAIN read — the provider
  // rebuild re-renders us (never useTracker a bare settings read).
  const pageMode = useTracker(function() { return Session.get(PAGE_MODE); }, []);
  const cardSurface = useTracker(function() { return Session.get(CARD_SURFACE); }, []);
  const surfaceOverride = useTracker(function() {
    const overrides = Session.get(PAGE_SURFACE_OVERRIDES) || {};
    return overrides[location.pathname];
  }, [location.pathname]);

  const activeBg = get(Meteor, 'settings.public.theme.backgroundImagePath', '');

  const composition = resolveComposition({
    background: ambiance ? activeBg : '',   // fluid-only routes paint their own backdrop
    entry: ambiance ? getBackgroundEntry(activeBg) : null,
    pageMode: pageMode,
    cardSurface: cardSurface,
    surfaceOverride: surfaceOverride
  });

  const zoneTheme = useMemo(function() {
    const base = buildPageModeTheme(appTheme, composition.pageMode) || appTheme;
    if (composition.cardSurface === 'solid') { return base; }
    const surface = buildSurfaceStyles({
      surface: composition.cardSurface,
      paperColor: get(base, 'palette.background.paper', '#ffffff'),
      dividerColor: get(base, 'palette.divider', 'rgba(128,128,128,0.3)')
    });
    return createTheme(base, {
      components: {
        MuiCard: { styleOverrides: { root: surface.root } },
        MuiPaper: { styleOverrides: { root: surface.root } }
      }
    });
  }, [appTheme, composition.pageMode, composition.cardSurface]);

  // Early return AFTER all hooks (React hooks-order rule); fluid is a
  // static route capability, but keep the hook order unconditional anyway.
  if (!fluid) { return props.children; }

  return (
    <AmbianceContext.Provider value={composition}>
      <ThemeProvider theme={zoneTheme}>
        <div style={{
          height: '100%',
          '--ambiance-focus': composition.focus,
          '--ambiance-scrim': String(composition.scrimStrength)
        }}>
          {props.children}
        </div>
      </ThemeProvider>
    </AmbianceContext.Provider>
  );
}

export default AmbianceZone;
