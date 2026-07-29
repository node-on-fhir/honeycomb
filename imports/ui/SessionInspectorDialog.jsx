// imports/ui/SessionInspectorDialog.jsx
//
// Session Inspector — a live dashboard of the app's internal Session state,
// organized by contract family (patient context, auth, simulator, hexgrid,
// timeline, MainSearch.*, selectedXId, ...). Toggle with Cmd/Ctrl+Shift+D.
//
// This is the observability answer to FABLE-ANALYSIS §3 ("invisible string
// contracts are load-bearing... it should at least be a *visible* one"):
// every Session key the app is carrying, grouped, searchable, with
// recent-change highlighting. Sensitive values (tokens, secrets) render
// redacted — this is a debug surface, not an export surface.

import React, { useState, useEffect, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Dialog, DialogTitle, DialogContent, Box, Typography, TextField,
  IconButton, Chip, Tooltip, InputAdornment, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { groupSessionSnapshot } from '/imports/lib/sessionKeyGroups.js';
import { SESSION_INSPECTOR_OPEN } from '/imports/lib/SessionKeys.js';

const CHANGE_HIGHLIGHT_MS = 3000;

function valueType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undef';
  if (Array.isArray(value)) return 'array[' + value.length + ']';
  return typeof value;
}

function stringifyValue(value, pretty) {
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value, null, pretty ? 2 : 0);
  } catch (err) {
    return String(value);
  }
}

function SessionInspectorRow(props) {
  const { entry, changedAt, now } = props;
  const [expanded, setExpanded] = useState(false);

  const recentlyChanged = changedAt && (now - changedAt) < CHANGE_HIGHLIGHT_MS;

  let displayValue;
  if (entry.sensitive && entry.value) {
    displayValue = '•••••••• (' + String(entry.value).length + ' chars, redacted)';
  } else {
    displayValue = stringifyValue(entry.value, expanded);
    if (!expanded && displayValue && displayValue.length > 140) {
      displayValue = displayValue.slice(0, 140) + ' …';
    }
  }

  function copyValue(event) {
    event.stopPropagation();
    if (entry.sensitive) {
      return; // redacted values don't leave the inspector
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(stringifyValue(entry.value, true));
    }
  }

  return (
    <Box
      onClick={function() { setExpanded(!expanded); }}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        px: 1.5,
        py: 0.5,
        cursor: 'pointer',
        borderLeft: '2px solid',
        borderLeftColor: recentlyChanged ? 'warning.main' : 'transparent',
        bgcolor: recentlyChanged ? 'action.selected' : 'transparent',
        transition: 'background-color 0.6s ease, border-left-color 0.6s ease',
        '&:hover': { bgcolor: 'action.hover' }
      }}
    >
      <Typography component="span" sx={{
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: 'primary.main',
        minWidth: '260px',
        wordBreak: 'break-all',
        flexShrink: 0
      }}>
        {entry.key}
      </Typography>
      <Chip label={valueType(entry.value)} size="small" variant="outlined" sx={{
        fontFamily: 'monospace',
        fontSize: '0.65rem',
        height: '18px',
        flexShrink: 0,
        color: 'text.secondary'
      }} />
      <Typography component="pre" sx={{
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: entry.sensitive ? 'text.disabled' : 'text.primary',
        m: 0,
        whiteSpace: expanded ? 'pre-wrap' : 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1,
        wordBreak: 'break-all'
      }}>
        {displayValue}
      </Typography>
      {!entry.sensitive && (
        <Tooltip title="Copy value as JSON">
          <IconButton size="small" onClick={copyValue} sx={{ p: 0.25, flexShrink: 0 }}>
            <ContentCopyIcon sx={{ fontSize: '0.85rem' }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export function SessionInspectorDialog() {
  const [searchText, setSearchText] = useState('');
  const [now, setNow] = useState(0);

  const changeLog = useRef({ previous: {}, changedAt: {} });

  const open = useTracker(function() {
    return !!Session.get(SESSION_INSPECTOR_OPEN);
  }, []);

  // Only subscribe to the full Session firehose while the inspector is open.
  const snapshot = useTracker(function() {
    return open ? Session.all() : null;
  }, [open]);

  // Recent-change tracking: diff each snapshot against the previous one.
  useEffect(function() {
    if (!snapshot) {
      return undefined;
    }
    const log = changeLog.current;
    const timestamp = Date.now();
    Object.keys(snapshot).forEach(function(key) {
      const serialized = stringifyValue(snapshot[key], false);
      if (key in log.previous && log.previous[key] !== serialized) {
        log.changedAt[key] = timestamp;
      }
      log.previous[key] = serialized;
    });
  }, [snapshot]);

  // 1s tick while open so change highlights fade out on schedule.
  useEffect(function() {
    if (!open) {
      return undefined;
    }
    setNow(Date.now());
    const interval = setInterval(function() { setNow(Date.now()); }, 1000);
    return function() { clearInterval(interval); };
  }, [open]);

  function handleClose() {
    Session.set(SESSION_INSPECTOR_OPEN, false);
  }

  if (!open || !snapshot) {
    return null;
  }

  const totalKeys = Object.keys(snapshot).length;

  let filtered = snapshot;
  if (searchText) {
    const needle = searchText.toLowerCase();
    filtered = {};
    Object.keys(snapshot).forEach(function(key) {
      const haystack = key.toLowerCase() + ' ' + stringifyValue(snapshot[key], false).toLowerCase();
      if (haystack.indexOf(needle) !== -1) {
        filtered[key] = snapshot[key];
      }
    });
  }

  const groups = groupSessionSnapshot(filtered);
  const shownKeys = Object.keys(filtered).length;

  return (
    <Dialog
      id="sessionInspectorDialog"
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{ sx: { height: '85vh', bgcolor: 'background.paper' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
        <Typography component="span" variant="h6" sx={{ fontFamily: 'monospace' }}>
          Session Inspector
        </Typography>
        <Chip
          id="sessionInspectorKeyCount"
          label={shownKeys === totalKeys
            ? totalKeys + ' keys · ' + groups.length + ' groups'
            : shownKeys + ' / ' + totalKeys + ' keys'}
          size="small"
          sx={{ fontFamily: 'monospace' }}
        />
        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 'auto', mr: 1 }}>
          ⌘⇧D to toggle · click a row to expand
        </Typography>
        <IconButton id="sessionInspectorCloseButton" onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box sx={{ px: 3, pb: 1 }}>
        <TextField
          id="sessionInspectorSearch"
          fullWidth
          size="small"
          placeholder="Filter keys and values…"
          value={searchText}
          onChange={function(event) { setSearchText(event.target.value); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            sx: { fontFamily: 'monospace' }
          }}
        />
      </Box>
      <DialogContent dividers sx={{ p: 0 }}>
        {groups.length === 0 && (
          <Typography sx={{ p: 3, color: 'text.secondary', fontFamily: 'monospace' }}>
            No session keys match "{searchText}"
          </Typography>
        )}
        {groups.map(function(group) {
          return (
            <Box key={group.id} sx={{ mb: 1 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 1,
                px: 1.5,
                py: 0.5,
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderBottomColor: 'divider'
              }}>
                <Typography component="span" sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'secondary.main'
                }}>
                  {group.label}
                </Typography>
                <Typography component="span" sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  color: 'text.secondary'
                }}>
                  {group.entries.length}
                </Typography>
              </Box>
              {group.entries.map(function(entry) {
                return (
                  <SessionInspectorRow
                    key={entry.key}
                    entry={entry}
                    changedAt={changeLog.current.changedAt[entry.key]}
                    now={now}
                  />
                );
              })}
              <Divider />
            </Box>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}

export default SessionInspectorDialog;
