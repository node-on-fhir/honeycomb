// imports/ui/ThemeDialog.jsx
//
// The theme palette dialog — a modal overlay (open via the Header palette icon
// or Ctrl/Cmd+Shift+T) that restyles the app live over whatever page is
// underneath. The controls (preset tiles, ambiance, font, mode, page text,
// card surface) are the shared <ThemeControls>; an "Advanced — palette &
// accent" collapsible holds the shared <PaletteFieldEditor> (accordion field
// groups + the field-bound color wheel; live adapter → per-field overrides
// that persist via setPaletteOverride). "Open full editor" hands off to
// /theming, which mounts the SAME two components in its left column.
//
// Mounted once at App root (App.jsx) beside SessionInspectorDialog; open state
// rides the THEME_DIALOG_OPEN Session key.

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button,
  IconButton, Divider, Collapse
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useNavigate } from 'react-router-dom';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { getThemeSetting } from './CustomThemeProvider.jsx';
import { THEME_DIALOG_OPEN } from '/imports/lib/SessionKeys.js';
import { setPaletteOverride } from './themePresets.js';
import { ThemeControls } from './theme/ThemeControls.jsx';
import { PaletteFieldEditor } from './theme/PaletteFieldEditor.jsx';

// Live adapter: read the sanitized live setting, write a persisted per-field
// override (setPaletteOverride writes settings + saveThemeChoice + refresh).
function liveGetValue(key) {
  return getThemeSetting('settings.public.theme.palette.' + key, '');
}
function liveSetValue(key, value) {
  setPaletteOverride(key, value);
}

export function ThemeDialog() {
  const open = useTracker(function() { return !!Session.get(THEME_DIALOG_OPEN); }, []);
  const navigate = useNavigate();
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  function handleClose() {
    Session.set(THEME_DIALOG_OPEN, false);
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
        <ThemeControls compact />

        <Divider sx={{ my: 2 }} />

        <Button
          id="themeAdvancedToggle"
          size="small"
          onClick={function() { setAdvancedOpen(function(v) { return !v; }); }}
          startIcon={advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{ textTransform: 'none' }}
        >
          Advanced — palette &amp; accent
        </Button>
        <Collapse in={advancedOpen} unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <PaletteFieldEditor getValue={liveGetValue} setValue={liveSetValue} />
          </Box>
        </Collapse>
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
