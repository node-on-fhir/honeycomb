// imports/ui/components/SpiderScanLine.jsx
//
// The traveling horizontal sweep line — a cyan beam that glides top-to-bottom
// down its container. Two roles, one visual:
//
//   1. Ambient chrome (mode="ambient") — slow, faint, decorative. Used on the
//      DirectoryConsole set piece as atmosphere.
//   2. Spider tell (mode="signal", the default) — reactively ON while the
//      Endpoint Conformance Spider is probing/sweeping, read from the
//      Session SPIDER_SCANNING contract. Faster and brighter, so an active
//      scan visibly "runs" down the page.
//
// Isomorphic-friendly: self-injects its keyframes, positions absolute over the
// nearest positioned ancestor. Set `active` explicitly to override the Session
// signal (e.g. a page wiring it to a local search-in-flight state).

import React from 'react';
import { Box } from '@mui/material';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { SPIDER_SCANNING } from '/imports/lib/SessionKeys.js';

let injected = false;
function ensureKeyframes() {
  if (injected || typeof document === 'undefined') { return; }
  injected = true;
  const style = document.createElement('style');
  style.setAttribute('data-spider-scanline', '');
  style.textContent =
    '@keyframes spiderScanSweep {' +
    '  0%   { transform: translateY(-8%);  opacity: 0; }' +
    '  8%   { opacity: var(--scan-opacity, 0.5); }' +
    '  92%  { opacity: var(--scan-opacity, 0.5); }' +
    '  100% { transform: translateY(108%); opacity: 0; }' +
    '}';
  document.head.appendChild(style);
}

// helper: read whether the spider is scanning (safe if Session absent)
export function useSpiderScanning() {
  return useTracker(function() {
    return Session && Session.get ? !!Session.get(SPIDER_SCANNING) : false;
  }, []);
}

// helper: raise/lower the signal around an async probe — returns a wrapper
export async function withSpiderScanning(work) {
  try {
    Session.set(SPIDER_SCANNING, true);
    return await work();
  } finally {
    Session.set(SPIDER_SCANNING, false);
  }
}

export function SpiderScanLine(props) {
  const {
    mode = 'signal',                 // 'signal' | 'ambient'
    active = undefined,              // explicit override; falls back to the Session signal
    color = 'rgba(83, 230, 255, 0.5)',
    zIndex = 1
  } = props;

  ensureKeyframes();
  const scanning = useSpiderScanning();
  const isAmbient = mode === 'ambient';
  const on = active !== undefined ? active : (isAmbient ? true : scanning);

  if (!on) { return null; }

  // Ambient: slow + faint. Signal: quicker + brighter so it reads as activity.
  const duration = isAmbient ? '9s' : '2.4s';
  const opacity = isAmbient ? 0.4 : 0.85;
  const thickness = isAmbient ? '2px' : '3px';

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute', left: 0, right: 0, top: 0, height: thickness,
        zIndex: zIndex, pointerEvents: 'none',
        '--scan-opacity': opacity,
        background: 'linear-gradient(90deg, transparent, ' + color + ', transparent)',
        boxShadow: isAmbient ? 'none' : '0 0 12px ' + color,
        animation: 'spiderScanSweep ' + duration + ' linear infinite'
      }}
    />
  );
}

export default SpiderScanLine;
