// imports/ui/ThemeDialog.jsx
//
// The theme palette dialog — a modal overlay (open via the Header palette icon
// or Ctrl/Cmd+Shift+T) that lets you restyle the app live over whatever page is
// underneath. Four independent axes: a primary preset (Limestone / Tron /
// Vaporwave), a font, an accent hue (the mono→single-hue slider), and an
// ambiance background carousel. Each applies immediately (via the themePresets
// helpers → themeRefreshRequest) and persists (localStorage). "Open full editor"
// hands off to /theming for granular per-field color control.
//
// Mounted once at App root (App.jsx) beside SessionInspectorDialog; open state
// rides the THEME_DIALOG_OPEN Session key — the same precedent.

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button,
  IconButton, ButtonBase, Chip, Divider, Select, MenuItem, FormControl,
  InputLabel, Stack, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { darken } from '@mui/material/styles';
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex, hexToHsva } from '@uiw/color-convert';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { useTheme } from './CustomThemeProvider.jsx';
import { THEME_DIALOG_OPEN } from '/imports/lib/SessionKeys.js';
import {
  THEME_PRESETS, DEFAULT_FONT, CHAKRA_FONT, MARTIAN_FONT,
  applyThemePreset, setAccentHue, setThemeFont, setThemeBackground
} from './themePresets.js';
import { getBackgroundLibrary } from './themeBackgrounds.js';
import { loadThemeChoice } from '/imports/lib/themePersistence.js';

const FONT_OPTIONS = [
  { label: 'Default (Helvetica)', value: '' },
  { label: 'Chakra Petch', value: CHAKRA_FONT },
  { label: 'Martian Mono', value: MARTIAN_FONT }
];

// The palette keys a tile previews, in swatch/hex order.
const SWATCH_KEYS = ['primaryColor', 'secondaryColor', 'successColor', 'infoColor', 'errorColor'];

// Resolve a preset's preview palette. For the ACTIVE accent-driven preset
// (Tron/Limestone), the lead + secondary swatches reflect the LIVE dialed hue
// so the tile tracks the wheel; fixed multi-hue presets (Vaporwave) and
// inactive tiles show their declared palette.
function previewPalette(preset, liveAccent) {
  const base = Object.assign({}, preset.palette);
  if (liveAccent && !preset.advanced) {
    base.primaryColor = liveAccent;
    base.secondaryColor = darken(liveAccent, 0.3);
  }
  return base;
}

// Swatch strip preview for a preset tile.
function PresetSwatches({ palette }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
      {SWATCH_KEYS.map(function(k) {
        const c = get(palette, k);
        if (!c) { return null; }
        return <Box key={k} sx={{ width: 20, height: 20, borderRadius: '3px', bgcolor: c, border: '1px solid rgba(255,255,255,0.15)' }} />;
      })}
    </Box>
  );
}

// Vertical hex readout — replaces the opaque "Aa Bb Cc 0123" font sample with
// the tile's actual palette values, so each preset is legible as color data.
function PresetHexList({ palette }) {
  const rows = [
    ['accent', get(palette, 'primaryColor')],
    ['second', get(palette, 'secondaryColor')],
    ['canvas', get(palette, 'backgroundCanvasDark') || get(palette, 'canvasColor')],
    ['paper', get(palette, 'paperColorDark') || get(palette, 'paperColor')]
  ].filter(function(r) { return !!r[1]; });
  return (
    <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 0.25, columnGap: 1 }}>
      {rows.map(function(row) {
        return (
          <React.Fragment key={row[0]}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 11, height: 11, borderRadius: '2px', bgcolor: row[1], border: '1px solid rgba(255,255,255,0.15)' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, letterSpacing: '0.06em' }}>{row[0]}</Typography>
            </Box>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.primary' }}>
              {String(row[1]).toLowerCase()}
            </Typography>
          </React.Fragment>
        );
      })}
    </Box>
  );
}

export function ThemeDialog() {
  const open = useTracker(function() { return !!Session.get(THEME_DIALOG_OPEN); }, []);
  const mode = useTracker(function() { return Session.get('theme') || 'light'; }, []);
  const navigate = useNavigate();
  const themeCtx = useTheme() || {};

  // Current selections (from the persisted choice, so the dialog reflects state).
  const choice = loadThemeChoice() || {};
  const activePreset = choice.presetId || get(Meteor, 'settings.public.theme.defaultPreset', 'limestone');
  const activeFont = get(Meteor, 'settings.public.theme.typography.fontFamily', '') || '';
  const activeBg = get(Meteor, 'settings.public.theme.backgroundImagePath', '') || '';

  // Hue wheel local state, initialized from the current accent when the dialog
  // opens (so the wheel + the active tile's live swatches start truthful, not
  // at an arbitrary amber default).
  const currentAccent = get(Meteor, 'settings.public.theme.palette.primaryColor', '#53e6ff');
  const [hsva, setHsva] = React.useState(function() {
    try { return Object.assign({ a: 1 }, hexToHsva(currentAccent)); }
    catch (e) { return { h: 40, s: 70, v: 100, a: 1 }; }
  });
  React.useEffect(function() {
    if (open) {
      try { setHsva(Object.assign({ a: 1 }, hexToHsva(currentAccent))); } catch (e) { /* keep prior */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const liveAccent = hsvaToHex(hsva);

  function handleClose() {
    Session.set(THEME_DIALOG_OPEN, false);
  }

  function handleMode() {
    if (themeCtx.toggleTheme) { themeCtx.toggleTheme(); }
    else { Session.set('theme', mode === 'light' ? 'dark' : 'light'); }
  }

  if (!open) { return null; }

  return (
    <Dialog
      id="themeDialog"
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="span">Theme &amp; Palette</Typography>
        <IconButton onClick={handleClose} aria-label="Close" size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Primary preset tiles */}
        <Typography variant="overline" color="text.secondary">Preset</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mt: 1, mb: 3 }}>
          {THEME_PRESETS.map(function(preset) {
            const selected = preset.id === activePreset;
            return (
              <ButtonBase
                key={preset.id}
                id={'themePreset-' + preset.id}
                onClick={function() { applyThemePreset(preset.id); }}
                sx={{
                  display: 'block', textAlign: 'left', p: 2, borderRadius: '8px',
                  border: '2px solid', borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: 'background.default',
                  transition: 'border-color 0.15s ease, transform 0.15s ease',
                  '&:hover': { transform: 'translateY(-2px)', borderColor: 'primary.light' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{preset.name}</Typography>
                  {preset.advanced ? <Chip label="Advanced · 3-hue" size="small" color="warning" variant="outlined" /> : null}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, minHeight: 32 }}>
                  {preset.description}
                </Typography>
                <PresetSwatches palette={previewPalette(preset, selected ? liveAccent : null)} />
                <PresetHexList palette={previewPalette(preset, selected ? liveAccent : null)} />
              </ButtonBase>
            );
          })}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Font + mode + hue row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="themeFontLabel">Font</InputLabel>
              <Select
                labelId="themeFontLabel"
                id="themeFontSelect"
                label="Font"
                value={activeFont}
                onChange={function(e) { setThemeFont(e.target.value); }}
              >
                {FONT_OPTIONS.map(function(opt) {
                  return (
                    <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: opt.value || 'inherit' }}>
                      {opt.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="overline" color="text.secondary">Mode</Typography>
              <Box>
                <Tooltip title={mode === 'light' ? 'Switch to dark' : 'Switch to light'}>
                  <Button
                    id="themeModeToggle"
                    variant="outlined" size="small"
                    startIcon={mode === 'light' ? <LightModeIcon /> : <DarkModeIcon />}
                    onClick={handleMode}
                  >
                    {mode === 'light' ? 'Light' : 'Dark'}
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          </Stack>

          <Box>
            <Typography variant="overline" color="text.secondary">Accent hue</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Wheel
                color={hsva}
                onChange={function(color) {
                  setHsva(color.hsva);
                  setAccentHue(hsvaToHex(color.hsva));
                }}
                width={120}
                height={120}
              />
              <Box>
                <Box sx={{ width: 40, height: 40, borderRadius: '4px', bgcolor: liveAccent, border: '1px solid var(--divider, rgba(0,0,0,0.2))' }} />
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{liveAccent}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Desaturate → Limestone · saturate → Tron
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Ambiance background carousel */}
        <Typography variant="overline" color="text.secondary">Ambiance background</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, mt: 1 }}>
          <ButtonBase
            onClick={function() { setThemeBackground(''); }}
            sx={{
              flex: '0 0 auto', width: 96, height: 60, borderRadius: '6px',
              border: '2px solid', borderColor: !activeBg ? 'primary.main' : 'divider',
              bgcolor: 'background.default', fontSize: 11, color: 'text.secondary'
            }}
          >
            None
          </ButtonBase>
          {getBackgroundLibrary().map(function(bg) {
            const selected = activeBg === bg.src;
            return (
              <Tooltip key={bg.src} title={bg.name}>
                <ButtonBase
                  onClick={function() { setThemeBackground(bg.src); }}
                  sx={{
                    flex: '0 0 auto', width: 96, height: 60, borderRadius: '6px', overflow: 'hidden',
                    border: '2px solid', borderColor: selected ? 'primary.main' : 'divider',
                    backgroundImage: 'url(' + bg.src + ')', backgroundSize: 'cover', backgroundPosition: 'center',
                    transition: 'transform 0.15s ease', '&:hover': { transform: 'scale(1.04)' }
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Button
          startIcon={<OpenInFullIcon />}
          onClick={function() {
            handleClose();
            if (navigate) { navigate('/theming'); }
            else { window.location.assign('/theming'); }
          }}
        >
          Open full editor
        </Button>
        <Button variant="contained" onClick={handleClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ThemeDialog;
