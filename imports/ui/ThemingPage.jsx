// imports/ui/ThemingPage.jsx
//
// The /theming full editor. LEFT column = the SAME shared controls the Theme &
// Palette dialog uses (<ThemeControls> + <PaletteFieldEditor>), so the two
// surfaces are harmonized. RIGHT column = the live preview (independent
// ThemeProvider built from the page's draft state). Field edits stage in local
// state and drive the preview; "Load Theme Into Settings" writes them into
// Meteor.settings AND persists the canonical per-field values as
// paletteOverrides (survive reload, re-applied after the preset at boot).

import React, { useState, useMemo } from 'react';

import "ace-builds";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";

import { useNavigate } from "react-router-dom";

import { useTheme as useMuiTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { useTheme } from './App';
import { ThemeControls } from './theme/ThemeControls.jsx';
import { PaletteFieldEditor, PALETTE_FIELD_GROUPS } from './theme/PaletteFieldEditor.jsx';
import { saveThemeChoice } from '/imports/lib/themePersistence.js';

export function ThemingPage(){
  const navigate = useNavigate();
  const { theme: themeMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [previewThemeMode, setPreviewThemeMode] = useState('light');

  // Draft settings — edits stage here and feed the preview; nothing hits the
  // live app until "Load Theme Into Settings".
  const [settings, setSettings] = useState(() => {
    const meteorSettings = JSON.parse(JSON.stringify(get(Meteor, 'settings', {})));
    if (!meteorSettings.public) { meteorSettings.public = {}; }
    if (!meteorSettings.public.theme) { meteorSettings.public.theme = {}; }
    if (!meteorSettings.public.theme.palette) { meteorSettings.public.theme.palette = {}; }
    return meteorSettings;
  });

  const isDark = previewThemeMode === 'dark';

  const validateColor = (color, fallback) => {
    if (!color || color.trim() === '') return fallback;
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (color.startsWith('#') && !hexRegex.test(color)) { return fallback; }
    const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
    if (color.startsWith('rgb') && !rgbRegex.test(color)) { return fallback; }
    return color;
  };

  // Live preview theme from draft state. Reads the CANONICAL surface keys the
  // provider prefers (backgroundCanvas* / paperColor*Light|Dark), matching what
  // PaletteFieldEditor writes — no shadowing.
  const previewTheme = useMemo(() => {
    const p = (k) => get(settings, 'public.theme.palette.' + k);
    const primaryColor = validateColor(p('primaryColor'), 'rgb(108, 183, 110)');
    const secondaryColor = validateColor(p('secondaryColor'), '#fdb813');
    const errorColor = validateColor(p('errorColor'), 'rgb(128,20,60)');
    const successColor = validateColor(p('successColor'), '#4caf50');
    const warningColor = validateColor(p('warningColor'), '#ff9800');
    const infoColor = validateColor(p('infoColor'), '#2196f3');

    const appBarColorLight = validateColor(p('appBarColor'), primaryColor);
    const appBarTextColorLight = validateColor(p('appBarTextColor'), '#ffffff');
    const appBarColorDark = validateColor(p('appBarColorDark'), appBarColorLight);
    const appBarTextColorDark = validateColor(p('appBarTextColorDark'), appBarTextColorLight);
    const appBarColor = isDark ? appBarColorDark : appBarColorLight;
    const appBarTextColor = isDark ? appBarTextColorDark : appBarTextColorLight;

    const canvas = isDark
      ? validateColor(p('backgroundCanvasDark'), '#121212')
      : validateColor(p('backgroundCanvas'), '#fafafa');
    const paper = isDark
      ? validateColor(p('paperColorDark'), '#424242')
      : validateColor(p('paperColorLight'), '#ffffff');

    return createTheme({
      palette: {
        mode: previewThemeMode,
        primary: { main: primaryColor },
        secondary: { main: secondaryColor },
        error: { main: errorColor },
        success: { main: successColor },
        warning: { main: warningColor },
        info: { main: infoColor },
        appbar: { main: appBarColor, contrastText: appBarTextColor },
        background: { default: canvas, paper: paper }
      }
    });
  }, [previewThemeMode, isDark, settings]);

  // Draft adapter for PaletteFieldEditor: bare key ↔ local settings state.
  function updateSetting(path, value) {
    const next = JSON.parse(JSON.stringify(settings));
    const parts = path.split('.');
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part === '__proto__' || part === 'constructor' || part === 'prototype') { return; }
      if (!cur[part]) { cur[part] = {}; }
      cur = cur[part];
    }
    const last = parts[parts.length - 1];
    if (last === '__proto__' || last === 'constructor' || last === 'prototype') { return; }
    cur[last] = value;
    setSettings(next);
  }
  const draftGet = (key) => get(settings, 'public.theme.palette.' + key, '') || '';
  const draftSet = (key, value) => updateSetting('public.theme.palette.' + key, value);

  function loadIntoSettings() {
    if (Meteor.settings && Meteor.settings.public) {
      if (!Meteor.settings.public.theme) { Meteor.settings.public.theme = {}; }
      Object.assign(Meteor.settings.public.theme, get(settings, 'public.theme', {}));
    }
    // Persist the canonical per-field values the user set as paletteOverrides,
    // so page edits survive reload like the dialog's do.
    const paletteOverrides = {};
    PALETTE_FIELD_GROUPS.forEach(function(group) {
      group.fields.forEach(function(field) {
        const v = get(settings, 'public.theme.palette.' + field.key);
        if (v) { paletteOverrides[field.key] = v; }
      });
    });
    saveThemeChoice({ paletteOverrides: paletteOverrides });

    setShowSuccessMessage(true);
    const settingsMode = get(settings, 'public.theme.mode', themeMode);
    if (settingsMode !== themeMode) { toggleTheme(); }
    Session.set('themeRefreshRequest', true);
  }

  return (
    <Box
      id="ThemingPage"
      sx={{ p: '20px', minHeight: '100vh', backgroundColor: muiTheme.palette.background.default, color: muiTheme.palette.text.primary }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Theme Settings</Typography>
        <Button variant="contained" color="primary" onClick={loadIntoSettings}>
          Load Theme Into Settings
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT — shared controls (identical to the Theme & Palette dialog) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Theme Configuration</Typography>
            <ThemeControls />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Per-field palette</Typography>
            <PaletteFieldEditor getValue={draftGet} setValue={draftSet} />
          </Paper>
        </Grid>

        {/* RIGHT — live preview from draft state */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', backgroundColor: previewTheme.palette.background?.default }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: previewThemeMode === 'dark' ? '#ffffff' : 'inherit' }}>Theme Preview</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: previewThemeMode === 'dark' ? '#ffffff' : 'inherit' }}>Preview Mode</InputLabel>
                <Select
                  value={previewThemeMode}
                  onChange={(e) => setPreviewThemeMode(e.target.value)}
                  label="Preview Mode"
                  sx={{
                    color: previewThemeMode === 'dark' ? '#ffffff' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: previewThemeMode === 'dark' ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)' },
                    '& .MuiSvgIcon-root': { color: previewThemeMode === 'dark' ? '#ffffff' : 'inherit' }
                  }}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <ThemeProvider theme={previewTheme}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>App Bar Preview</Typography>
                  <Box sx={{
                    p: 2, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: previewTheme.palette.appbar?.main || previewTheme.palette.primary.main,
                    color: previewTheme.palette.appbar?.contrastText || previewTheme.palette.primary.contrastText
                  }}>
                    <Typography variant="h6" sx={{ color: 'inherit' }}>Application Title</Typography>
                    <Box>
                      <Button size="small" sx={{ color: 'inherit' }}>Menu</Button>
                      <Button size="small" sx={{ color: 'inherit' }}>Profile</Button>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Status Colors</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Alert severity="error">Error Alert</Alert>
                    <Alert severity="warning">Warning Alert</Alert>
                    <Alert severity="info">Info Alert</Alert>
                    <Alert severity="success">Success Alert</Alert>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Component Examples</Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Paper Component</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" color="primary" size="small">Action</Button>
                      <Button variant="outlined" size="small">Cancel</Button>
                    </Box>
                  </Paper>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Card Component</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Button variant="contained" color="secondary" size="small">Secondary</Button>
                        <Button variant="outlined" color="secondary" size="small">Outlined</Button>
                        <Button variant="text" color="secondary" size="small">Text</Button>
                      </Box>
                      <Alert severity="success" variant="outlined">Success message</Alert>
                    </CardContent>
                  </Card>
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Settings Preview</Typography>
                      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <AceEditor
                          mode="json"
                          theme={previewThemeMode === 'dark' ? "monokai" : "github"}
                          name="settings-preview"
                          value={JSON.stringify(get(settings, 'public.theme', {}), null, 2)}
                          width="100%"
                          height="200px"
                          readOnly={true}
                          showPrintMargin={false}
                          showGutter={true}
                          highlightActiveLine={false}
                          setOptions={{ showLineNumbers: true, tabSize: 2, useWorker: false }}
                          style={{ fontFamily: 'monospace', fontSize: '12px' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </ThemeProvider>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccessMessage(false)} severity="success" sx={{ width: '100%' }}>
          Theme settings loaded successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ThemingPage;
