// imports/ui/AppSnackbar.jsx
//
// App-wide toast host. Listens for the notify() CustomEvent and renders a MUI
// Snackbar + Alert. Mounted once at the app root (App.jsx). Replaces the dead
// mainAppDialogJson message channel — see imports/lib/notify.js.

import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';

import { NOTIFY_EVENT } from '/imports/lib/notify.js';

export function AppSnackbar() {
  const [current, setCurrent] = useState(null);

  useEffect(function() {
    function onNotify(event) {
      const detail = (event && event.detail) || {};
      setCurrent({
        title: detail.title || '',
        message: detail.message || '',
        severity: detail.severity || 'info',
        duration: typeof detail.duration === 'number' ? detail.duration : 5000,
        // key forces a re-mount so a second toast restarts the auto-hide timer
        key: (detail.title || '') + '|' + (detail.message || '') + '|' + Date.now()
      });
    }
    window.addEventListener(NOTIFY_EVENT, onNotify);
    return function() { window.removeEventListener(NOTIFY_EVENT, onNotify); };
  }, []);

  function handleClose(event, reason) {
    if (reason === 'clickaway') {
      return;
    }
    setCurrent(null);
  }

  if (!current) {
    return null;
  }

  return (
    <Snackbar
      key={current.key}
      open={true}
      autoHideDuration={current.duration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={handleClose}
        severity={current.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {current.title && <AlertTitle>{current.title}</AlertTitle>}
        {current.message}
      </Alert>
    </Snackbar>
  );
}

export default AppSnackbar;
