// imports/ui/AboutDialog.jsx
//
// About + update-status dialog. Opened from the Header info icon or
// Cmd/Ctrl+Shift+A (Session key ABOUT_DIALOG_OPEN). Shows the app version,
// host runtime info (OS, node, electron), and the cached result of the
// startup /releases.json check (server/UpdateChecker.js), with a manual
// re-check button. Settings-gated: when settings.public.updates is absent
// the update section explains itself instead of erroring.

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Alert, AlertTitle, Box, Table, TableBody, TableRow, TableCell,
  CircularProgress, Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { ABOUT_DIALOG_OPEN } from '/imports/lib/SessionKeys.js';

// Electron exposes itself in the renderer userAgent: "... Electron/31.2.0 ..."
function electronVersionFromUserAgent() {
  const match = (navigator.userAgent || '').match(/Electron\/([\d.]+)/);
  return match ? match[1] : '';
}

function AboutDialog() {
  const open = useTracker(function() {
    return !!Session.get(ABOUT_DIALOG_OPEN);
  }, []);

  const [info, setInfo] = useState(null);      // null = loading
  const [checking, setChecking] = useState(false);
  const [loadError, setLoadError] = useState(null);

  async function loadStatus() {
    try {
      const result = await Meteor.rpc('updates.getStatus', {});
      setInfo(result || {});
      setLoadError(null);
    } catch (err) {
      setLoadError(get(err, 'reason', err.message));
      setInfo({});
    }
  }

  useEffect(function() {
    if (open) {
      loadStatus();
    }
  }, [open]);

  function handleClose() {
    Session.set(ABOUT_DIALOG_OPEN, false);
  }

  async function handleCheckNow() {
    setChecking(true);
    try {
      await Meteor.rpc('updates.checkNow', {});
      await loadStatus();
    } catch (err) {
      setLoadError(get(err, 'reason', err.message));
    } finally {
      setChecking(false);
    }
  }

  const appTitle = get(Meteor, 'settings.public.title', 'Node on FHIR');
  const status = get(info, 'status', null);
  const updateAvailable = !!get(status, 'updateAvailable', false);
  const currentVersion = get(info, 'currentVersion', '') || get(status, 'current', '');
  const electronVersion = get(info, 'system.electronVersion', '') || electronVersionFromUserAgent();

  return (
    <Dialog id="aboutDialog" open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        About {appTitle}
        {currentVersion ? (
          <Typography variant="body2" color="text.secondary">
            Version {currentVersion}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent>
        {info === null ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {loadError ? (
              <Alert severity="warning" sx={{ mb: 2 }}>{loadError}</Alert>
            ) : null}

            {/* Update status */}
            {!get(info, 'configured', false) ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Update checking is not configured on this deployment
                (Meteor.settings.public.updates.releasesUrl).
              </Alert>
            ) : updateAvailable ? (
              <Alert
                severity="info"
                sx={{ mb: 2 }}
                action={get(status, 'downloadUrl', '') ? (
                  <Button
                    id="aboutDialogDownloadButton"
                    color="inherit"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={function() { window.open(get(status, 'downloadUrl'), '_blank', 'noopener'); }}
                  >
                    Download
                  </Button>
                ) : null}
              >
                <AlertTitle>Update available — version {get(status, 'latest', '')}</AlertTitle>
                {get(status, 'notes', '')}
              </Alert>
            ) : get(info, 'error', null) ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Last update check failed: {get(info, 'error')}
              </Alert>
            ) : status ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                You are on the latest published version.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                No update check has run yet this session.
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Runtime info */}
            <Table size="small" id="aboutDialogSystemTable">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary' }}>Operating system</TableCell>
                  <TableCell>{get(info, 'system.platform', 'unknown')} ({get(info, 'system.arch', '')})</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary' }}>Node</TableCell>
                  <TableCell>{get(info, 'system.nodeVersion', 'unknown')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary' }}>Electron</TableCell>
                  <TableCell>{electronVersion || 'not running in Electron'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary' }}>Meteor</TableCell>
                  <TableCell>{get(info, 'system.meteorRelease', 'unknown')}</TableCell>
                </TableRow>
                {get(info, 'checkedAt', null) ? (
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary' }}>Last update check</TableCell>
                    <TableCell>{new Date(get(info, 'checkedAt')).toLocaleString()}</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          id="aboutDialogCheckButton"
          startIcon={checking ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
          onClick={handleCheckNow}
          disabled={checking || !get(info, 'configured', false)}
        >
          {checking ? 'Checking…' : 'Check for updates'}
        </Button>
        <Button id="aboutDialogCloseButton" onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AboutDialog;
