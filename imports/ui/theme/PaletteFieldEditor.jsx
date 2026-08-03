// imports/ui/theme/PaletteFieldEditor.jsx
//
// Shared per-field palette editor: grouped TextField color inputs + a
// Wheel/ShadeSlider picker dialog. Extracted from ThemingPage's inline
// ColorField so BOTH the Theme & Palette dialog (live adapter) and /theming
// (draft adapter) drive the same fields.
//
// Value-source-agnostic: the caller supplies getValue(fieldKey) / setValue(
// fieldKey, value) where fieldKey is a BARE palette key ('appBarColorDark'),
// not a dotted path — the dialog writes Meteor.settings.public.theme.palette,
// the page writes local React state. Refresh/persist is the caller's job in
// setValue; the editor only reads/writes values and defers heavy work to
// blur/apply (never per-keystroke or per-wheel-drag).
//
// PALETTE_FIELD_GROUPS is the ONE canonical key list. It targets the keys
// CustomThemeProvider.createDynamicTheme reads FIRST — surfaces use
// backgroundCanvas* / paperColor*Dark / cardColor*, NOT the legacy
// backgroundPageColor* (lower precedence → silently shadowed by presets).

import React from 'react';
import {
  Box, Grid, Typography, Divider, TextField, InputAdornment, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import Wheel from '@uiw/react-color-wheel';
import ShadeSlider from '@uiw/react-color-shade-slider';
import { hsvaToHex } from '@uiw/color-convert';

// Canonical, provider-aligned key set. Do NOT add backgroundPageColor* or the
// unsuffixed canvasColor/paperColor/cardColor here — they lose to these keys
// in createDynamicTheme, so edits would be shadowed by any active preset.
export const PALETTE_FIELD_GROUPS = [
  {
    title: 'Status',
    fields: [
      { key: 'primaryColor', label: 'Primary', help: 'Main brand color' },
      { key: 'secondaryColor', label: 'Secondary', help: 'Accent color' },
      { key: 'successColor', label: 'Success', help: '' },
      { key: 'infoColor', label: 'Info', help: '' },
      { key: 'warningColor', label: 'Warning', help: '' },
      { key: 'errorColor', label: 'Error', help: '' }
    ]
  },
  {
    title: 'App Bar (Header / Footer)',
    fields: [
      { key: 'appBarColor', label: 'App Bar', help: 'Light mode (defaults to primary)' },
      { key: 'appBarColorDark', label: 'App Bar (Dark)', help: 'Dark mode' },
      { key: 'appBarTextColor', label: 'App Bar Text', help: 'Light mode text' },
      { key: 'appBarTextColorDark', label: 'App Bar Text (Dark)', help: 'Dark mode text' }
    ]
  },
  {
    title: 'Surfaces',
    fields: [
      { key: 'backgroundCanvas', label: 'Canvas', help: 'Light page background' },
      { key: 'backgroundCanvasDark', label: 'Canvas (Dark)', help: 'Dark page background' },
      { key: 'paperColorLight', label: 'Paper', help: 'Light cards / surfaces' },
      { key: 'paperColorDark', label: 'Paper (Dark)', help: 'Dark cards / surfaces' },
      { key: 'cardColorLight', label: 'Card', help: 'Light MuiCard override' },
      { key: 'cardColorDark', label: 'Card (Dark)', help: 'Dark MuiCard override' }
    ]
  }
];

export function PaletteFieldEditor({ getValue, setValue, fields = PALETTE_FIELD_GROUPS }) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerKey, setPickerKey] = React.useState('');
  const [tempColor, setTempColor] = React.useState({ h: 214, s: 43, v: 90, a: 1 });

  // Local draft of text values so typing doesn't push a theme refresh per
  // keystroke; the caller's setValue (which may refresh/persist) fires on blur.
  const [drafts, setDrafts] = React.useState({});

  function readValue(key) {
    if (key in drafts) { return drafts[key]; }
    return getValue(key) || '';
  }

  function commit(key, value) {
    setValue(key, value);
    setDrafts(function(prev) {
      const next = Object.assign({}, prev);
      delete next[key];
      return next;
    });
  }

  function openPicker(key) {
    setPickerKey(key);
    setTempColor({ h: 214, s: 43, v: 90, a: 1 });
    setPickerOpen(true);
  }

  function applyPicked() {
    commit(pickerKey, hsvaToHex(tempColor));
    setPickerOpen(false);
  }

  return (
    <Box>
      {fields.map(function(group, gi) {
        return (
          <Box key={group.title} sx={{ mb: 2 }}>
            {gi > 0 ? <Divider sx={{ mb: 2 }} /> : null}
            <Typography variant="subtitle2" gutterBottom>{group.title}</Typography>
            <Grid container spacing={2}>
              {group.fields.map(function(field) {
                return (
                  <Grid item xs={6} key={field.key}>
                    <TextField
                      fullWidth
                      size="small"
                      variant="outlined"
                      label={field.label}
                      helperText={field.help}
                      value={readValue(field.key)}
                      onChange={function(e) {
                        const v = e.target.value;
                        setDrafts(function(prev) { return Object.assign({}, prev, { [field.key]: v }); });
                      }}
                      onBlur={function(e) { commit(field.key, e.target.value); }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Box sx={{ width: 18, height: 18, mr: 0.5, borderRadius: '3px', border: '1px solid', borderColor: 'divider', bgcolor: readValue(field.key) || 'transparent' }} />
                            <IconButton edge="end" size="small" aria-label={'Pick ' + field.label} onClick={function() { openPicker(field.key); }}>
                              <PaletteIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );
      })}

      <Dialog open={pickerOpen} onClose={function() { setPickerOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>Choose Color</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 2 }}>
            <Wheel color={tempColor} onChange={function(color) { setTempColor(Object.assign({}, tempColor, color.hsva)); }} width={280} height={280} />
            <ShadeSlider hsva={tempColor} style={{ width: '280px' }} onChange={function(shade) { setTempColor(Object.assign({}, tempColor, shade)); }} />
            <Box sx={{ width: '100%', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center', backgroundColor: hsvaToHex(tempColor) }}>
              <Typography variant="body2" sx={{ color: tempColor.v > 50 ? '#000' : '#fff', fontFamily: 'monospace' }}>
                {hsvaToHex(tempColor)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={function() { setPickerOpen(false); }}>Cancel</Button>
          <Button onClick={applyPicked} variant="contained" color="primary">Choose Color</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PaletteFieldEditor;
