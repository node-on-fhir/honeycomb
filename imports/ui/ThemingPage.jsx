// imports/ui/ThemingPage.jsx
//
// The /theming full editor. LEFT column = the SAME shared controls the Theme &
// Palette dialog uses (<ThemeControls> + <PaletteFieldEditor>) — everything
// applies to the LIVE app and persists (setPaletteOverride), so the two
// surfaces are fully harmonized (no draft/Load duality). RIGHT column = a
// component gallery rendered from the LIVE palette, defaulting to the INVERSE
// of the current app mode so you can tune the dark appbar while viewing it in
// light (and vice-versa) without flipping the whole app.

import React, { useState, useMemo, useEffect } from 'react';

import "ace-builds";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";

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
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

import { getThemeSetting } from './CustomThemeProvider.jsx';
import { ThemeControls } from './theme/ThemeControls.jsx';
import { PaletteFieldEditor } from './theme/PaletteFieldEditor.jsx';
import { setPaletteOverride } from './themePresets.js';

// Live adapter (identical to the dialog): read the sanitized live value, write
// a persisted per-field override.
function liveGet(key) { return getThemeSetting('settings.public.theme.palette.' + key, ''); }
function liveSet(key, value) { setPaletteOverride(key, value); }

function validateColor(color, fallback) {
  if (!color || String(color).trim() === '') return fallback;
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (color.startsWith('#') && !hexRegex.test(color)) { return fallback; }
  const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
  if (color.startsWith('rgb') && !rgbRegex.test(color)) { return fallback; }
  return color;
}

export function ThemingPage(){
  // The live app theme. Its object identity changes on every provider rebuild
  // (the themeRefreshCounter bumps on each edit) — so it's the reliable
  // reactivity tick for the gallery. Its palette.mode is the live app mode.
  const muiTheme = useMuiTheme();
  const appMode = muiTheme.palette.mode || 'light';

  // Preview defaults to the INVERSE of the app mode; re-inverts whenever the
  // app mode flips. The selector still lets you override in between.
  const [previewMode, setPreviewMode] = useState(appMode === 'dark' ? 'light' : 'dark');
  useEffect(function() {
    setPreviewMode(appMode === 'dark' ? 'light' : 'dark');
  }, [appMode]);

  const isDark = previewMode === 'dark';

  // Gallery theme built from the LIVE palette settings for previewMode, reading
  // the same canonical keys (and precedence) the provider uses.
  const previewTheme = useMemo(function() {
    const p = (k) => getThemeSetting('settings.public.theme.palette.' + k, '');
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

    // Light branch must NOT fall back to the unsuffixed generics (canvasColor /
    // paperColor): those belong to whichever mode the settings file was
    // authored for (here dark, e.g. paperColor '#1e1e1e !important') and would
    // leak dark surfaces into the light preview. Generics feed the dark branch
    // only. (rules/ui/theming.md — unsuffixed generics are mode-oriented.)
    const canvas = isDark
      ? validateColor(p('backgroundCanvasDark') || p('canvasColor'), '#121212')
      : validateColor(p('backgroundCanvas'), '#fafafa');
    const paper = isDark
      ? validateColor(p('paperColorDark') || p('paperColor'), '#1e1e1e')
      : validateColor(p('paperColorLight'), '#ffffff');

    return createTheme({
      palette: {
        mode: previewMode,
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
    // muiTheme identity changes on every live edit → recompute from fresh settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewMode, isDark, muiTheme]);

  return (
    <Box
      id="ThemingPage"
      sx={{ p: '20px', minHeight: '100vh', backgroundColor: muiTheme.palette.background.default, color: muiTheme.palette.text.primary }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Theme Settings</Typography>
        <Typography variant="caption" color="text.secondary">
          Changes apply live &amp; persist — no save needed.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT — shared controls (identical to the Theme & Palette dialog),
            all live + persisted */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Theme Configuration</Typography>
            <ThemeControls />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Per-field palette</Typography>
            <PaletteFieldEditor getValue={liveGet} setValue={liveSet} />
          </Paper>
        </Grid>

        {/* RIGHT — component gallery rendered from the LIVE palette, in the
            INVERSE mode by default (tune dark while viewing light) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', backgroundColor: previewTheme.palette.background?.default }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: isDark ? '#ffffff' : 'inherit' }}>
                {previewMode === appMode ? 'Preview' : 'Preview — opposite mode'}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel sx={{ color: isDark ? '#ffffff' : 'inherit' }}>Preview Mode</InputLabel>
                <Select
                  value={previewMode}
                  onChange={(e) => setPreviewMode(e.target.value)}
                  label="Preview Mode"
                  sx={{
                    color: isDark ? '#ffffff' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)' },
                    '& .MuiSvgIcon-root': { color: isDark ? '#ffffff' : 'inherit' }
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
                          theme={isDark ? "monokai" : "github"}
                          name="settings-preview"
                          value={JSON.stringify(get(Meteor, 'settings.public.theme', {}), null, 2)}
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
    </Box>
  );
}

export default ThemingPage;
