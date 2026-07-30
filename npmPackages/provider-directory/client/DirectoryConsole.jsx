// npmPackages/provider-directory/client/DirectoryConsole.jsx
//
// GRID CONTROL — the National Provider Directory as a deep-space traffic
// console. Free-text "hail" search over providerDirectory.omniSearch
// (Directory.* collections: ~2.7M organizations, ~1.4M locations, ~630K
// endpoints), census ticker with live count-up, precision-scan facet drawer,
// stagger-revealed signal-return results.
//
// DESIGN NOTE: this page is a deliberate always-dark set piece (like the
// DICOM viewers) — it paints its own console-black background in both theme
// modes by design, and self-hosts its display faces (Chakra Petch + Martian
// Mono, served from /workflows/provider-directory/fonts/ — external font
// origins are blocked by CSP). The classic facet page remains at
// /provider-directory-classic.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Collapse } from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { useNavigate } from 'react-router-dom';

const log = (Meteor.Logger ? Meteor.Logger.for('DirectoryConsole') : console);

// ---------------------------------------------------------------------------
// Console styles — vars, fonts, keyframes. Injected once.
// ---------------------------------------------------------------------------

const FONT_BASE = '/workflows/provider-directory/fonts';

const CONSOLE_CSS = `
@font-face {
  font-family: 'Chakra Petch';
  src: url('${FONT_BASE}/chakra-petch-500.woff2') format('woff2');
  font-weight: 500; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Chakra Petch';
  src: url('${FONT_BASE}/chakra-petch-700.woff2') format('woff2');
  font-weight: 700; font-style: normal; font-display: swap;
}
@font-face {
  font-family: 'Martian Mono';
  src: url('${FONT_BASE}/martian-mono-variable.woff2') format('woff2');
  font-weight: 100 800; font-style: normal; font-display: swap;
}

.grid-console {
  --void: #050810;
  --panel: rgba(11, 18, 32, 0.72);
  --panel-hard: #0b1220;
  --amber: #ffb454;
  --amber-dim: rgba(255, 180, 84, 0.42);
  --cyan: #53e6ff;
  --cyan-dim: rgba(83, 230, 255, 0.28);
  --magenta: #ff5ea8;
  --green: #69f0ae;
  --ink: #d8e4f0;
  --ink-dim: #61758f;
  --hairline: rgba(83, 230, 255, 0.16);
  --display: 'Chakra Petch', 'Avenir Next Condensed', sans-serif;
  --mono: 'Martian Mono', 'SF Mono', ui-monospace, monospace;
}

.grid-console *::selection { background: var(--amber-dim); color: #0a0a0a; }

.grid-console ::-webkit-scrollbar { width: 10px; height: 10px; }
.grid-console ::-webkit-scrollbar-track { background: transparent; }
.grid-console ::-webkit-scrollbar-thumb {
  background: rgba(83, 230, 255, 0.18); border: 2px solid var(--void); border-radius: 6px;
}
.grid-console ::-webkit-scrollbar-thumb:hover { background: var(--amber-dim); }

/* -- atmosphere ---------------------------------------------------------- */
@keyframes gcSweep {
  0%   { transform: translateY(-8%);  opacity: 0; }
  8%   { opacity: 0.5; }
  92%  { opacity: 0.5; }
  100% { transform: translateY(108vh); opacity: 0; }
}
@keyframes gcFlicker {
  0%, 100% { opacity: 0.035; } 50% { opacity: 0.06; }
}
/* -- boot / reveal ------------------------------------------------------- */
@keyframes gcBoot {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes gcDrawIn {
  from { transform: scaleX(0); } to { transform: scaleX(1); }
}
@keyframes gcRowIn {
  from { opacity: 0; transform: translateX(-10px); clip-path: inset(0 100% 0 0); }
  to   { opacity: 1; transform: translateX(0);     clip-path: inset(0 0 0 0); }
}
/* -- live elements ------------------------------------------------------- */
@keyframes gcCaret { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes gcScan {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
@keyframes gcPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(105, 240, 174, 0.4); }
  50%      { box-shadow: 0 0 8px 2px rgba(105, 240, 174, 0.18); }
}

.gc-boot   { animation: gcBoot 0.7s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
.gc-row    { animation: gcRowIn 0.45s cubic-bezier(0.2, 0.9, 0.25, 1) both; }
.gc-rule   { transform-origin: left; animation: gcDrawIn 0.8s cubic-bezier(0.2, 0.9, 0.25, 1) both; }

.gc-row-btn {
  display: grid; grid-template-columns: 44px 1fr auto; gap: 14px; align-items: center;
  width: 100%; text-align: left; padding: 13px 18px 13px 14px;
  background: transparent; border: none; border-left: 2px solid transparent;
  cursor: pointer; transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}
.gc-row-btn:hover {
  transform: translateX(6px);
  background: linear-gradient(90deg, rgba(255, 180, 84, 0.07), rgba(83, 230, 255, 0.03) 60%, transparent);
  border-left-color: var(--amber);
}
.gc-row-btn:hover .gc-acquire { opacity: 1; transform: translateX(0); }
.gc-acquire {
  opacity: 0; transform: translateX(-6px); transition: all 0.18s ease;
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.22em; color: var(--amber);
  white-space: nowrap;
}

.gc-chip-btn {
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
  color: var(--cyan); background: transparent; border: 1px solid var(--cyan-dim);
  padding: 6px 14px; cursor: pointer; transition: all 0.18s ease;
}
.gc-chip-btn:hover { border-color: var(--amber); color: var(--amber); background: rgba(255,180,84,0.06); }

.gc-facet-input {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.06em;
  color: var(--ink); background: transparent;
  border: none; border-bottom: 1px solid var(--hairline);
  padding: 8px 2px; outline: none; width: 100%;
  transition: border-color 0.2s ease;
}
.gc-facet-input:focus { border-bottom-color: var(--cyan); }
.gc-facet-input::placeholder { color: var(--ink-dim); opacity: 0.7; }

.gc-hail-input {
  font-family: var(--display); font-weight: 500; font-size: clamp(20px, 3vw, 30px);
  letter-spacing: 0.04em; color: var(--ink); background: transparent;
  border: none; outline: none; width: 100%; padding: 0;
}
.gc-hail-input::placeholder { color: var(--ink-dim); opacity: 0.55; font-weight: 500; }
`;

// Layered background: gradients + hex-grid + scanlines + noise.
const NOISE_URI = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

// Corner brackets on a panel — the console's signature framing device.
function Brackets({ color = 'var(--cyan-dim)', size = 14 }) {
  const common = { position: 'absolute', width: size, height: size, pointerEvents: 'none' };
  const b = '1px solid ' + color;
  return (
    <>
      <Box sx={{ ...common, top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <Box sx={{ ...common, top: 0, right: 0, borderTop: b, borderRight: b }} />
      <Box sx={{ ...common, bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <Box sx={{ ...common, bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

// Count-up census number — eases out over ~1.6s on first paint.
function TickerNumber({ value, delay = 0 }) {
  const [shown, setShown] = useState(0);
  const started = useRef(false);
  useEffect(function() {
    if (value === null || value === undefined || started.current) { return; }
    started.current = true;
    const target = value;
    const t0 = performance.now() + delay;
    let raf;
    function tick(now) {
      const t = Math.min(Math.max((now - t0) / 1600, 0), 1);
      const eased = 1 - Math.pow(2, -10 * t);   // ease-out-expo
      setShown(Math.round(target * (t >= 1 ? 1 : eased)));
      if (t < 1) { raf = requestAnimationFrame(tick); }
    }
    raf = requestAnimationFrame(tick);
    return function() { cancelAnimationFrame(raf); };
  }, [value, delay]);

  return (
    <Box component="span" sx={{
      fontFamily: 'var(--mono)', fontWeight: 700,
      fontSize: 'clamp(22px, 2.6vw, 32px)', color: 'var(--amber)',
      fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em',
      textShadow: '0 0 18px rgba(255,180,84,0.35)'
    }}>
      {shown.toLocaleString()}
    </Box>
  );
}

// Live UTC clock for the masthead status block.
function UtcClock() {
  const [now, setNow] = useState(function() { return new Date(); });
  useEffect(function() {
    const interval = setInterval(function() { setNow(new Date()); }, 1000);
    return function() { clearInterval(interval); };
  }, []);
  const hms = now.toISOString().slice(11, 19);
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '.');
  return <>{ymd} · {hms} UTC</>;
}

// ---------------------------------------------------------------------------
// Result presentation
// ---------------------------------------------------------------------------

const BAND_CONFIG = {
  Organization:  { label: 'ORGANIZATIONS', unit: 'CONTACTS',  sigil: '⬡', route: '/organizations', accent: 'var(--amber)' },
  Practitioner:  { label: 'CLINICIANS',    unit: 'REGISTERED', sigil: '✛', route: '/practitioners', accent: 'var(--cyan)' },
  Location:      { label: 'LOCATIONS',     unit: 'SITES',      sigil: '◬', route: '/locations',     accent: 'var(--magenta)' },
  Endpoint:      { label: 'ENDPOINTS',     unit: 'UPLINKS',    sigil: '⌁', route: '/endpoints',     accent: 'var(--green)' }
};

function flattenHit(resourceName, hit) {
  const address = Array.isArray(get(hit, 'address')) ? get(hit, 'address.0') : get(hit, 'address');
  const cityState = [get(address, 'city'), get(address, 'state')].filter(Boolean).join(', ');
  let name = get(hit, 'name', '');
  if (Array.isArray(name)) {
    name = get(name, '0.text') ||
      [get(name, '0.given.0'), get(name, '0.family')].filter(Boolean).join(' ');
  }
  let meta = cityState;
  if (resourceName === 'Endpoint') {
    meta = typeof get(hit, 'address') === 'string' ? get(hit, 'address') : cityState;
  }
  const status = get(hit, 'status') ||
    (get(hit, 'active') === true ? 'active' : (get(hit, 'active') === false ? 'inactive' : ''));
  return {
    _id: get(hit, '_id'),
    name: name || '(unnamed)',
    meta: meta || '—',
    fhirId: get(hit, 'id', ''),
    status: status
  };
}

function StatusChip({ status }) {
  if (!status) { return null; }
  const live = status === 'active';
  return (
    <Box component="span" sx={{
      fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em',
      px: 1, py: 0.4, whiteSpace: 'nowrap',
      color: live ? 'var(--green)' : 'var(--ink-dim)',
      border: '1px solid ' + (live ? 'rgba(105,240,174,0.4)' : 'rgba(97,117,143,0.4)'),
      animation: live ? 'gcPulse 3s ease-in-out infinite' : 'none'
    }}>
      {status.toUpperCase()}
    </Box>
  );
}

function ResultBand({ band, config, navigate, revealIndex }) {
  const rows = (band.hits || []).map(function(hit) { return flattenHit(band.resourceName, hit); });
  const countLabel = band.matchCount >= 1000
    ? '1,000+' : band.matchCount.toLocaleString();

  return (
    <Box className="gc-boot" sx={{ animationDelay: (revealIndex * 120) + 'ms', mb: 4 }}>
      {/* Band header */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.5 }}>
        <Box component="span" sx={{ color: config.accent, fontSize: '15px', lineHeight: 1 }}>{config.sigil}</Box>
        <Box component="span" sx={{
          fontFamily: 'var(--display)', fontWeight: 700, fontSize: '15px',
          letterSpacing: '0.28em', color: 'var(--ink)'
        }}>
          {config.label}
        </Box>
        <Box component="span" sx={{
          fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.18em',
          color: band.matchCount ? config.accent : 'var(--ink-dim)'
        }}>
          — {band.matchCount ? (countLabel + ' ' + config.unit) : 'BAND SILENT'}
        </Box>
      </Box>
      <Box className="gc-rule" sx={{
        height: '1px', mb: 1,
        background: 'linear-gradient(90deg, ' + config.accent + ' 0%, var(--hairline) 40%, transparent 90%)',
        animationDelay: (revealIndex * 120 + 150) + 'ms'
      }} />

      {/* Rows */}
      {rows.length === 0 ? (
        <Box sx={{
          fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.14em',
          color: 'var(--ink-dim)', px: 2, py: 1.5, opacity: 0.7
        }}>
          NO RETURNS ON THIS BAND
        </Box>
      ) : rows.map(function(row, index) {
        return (
          <button
            key={row._id}
            className="gc-row gc-row-btn"
            style={{ animationDelay: (revealIndex * 120 + 150 + index * 60) + 'ms' }}
            onClick={function() {
              log.info('acquire', { resourceType: band.resourceName, id: row._id });
              navigate(config.route);
            }}
          >
            <Box component="span" sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, color: config.accent, fontSize: '16px',
              border: '1px solid var(--hairline)', background: 'rgba(83,230,255,0.03)'
            }}>
              {config.sigil}
            </Box>
            <Box component="span" sx={{ minWidth: 0 }}>
              <Box component="span" sx={{
                display: 'block', fontFamily: 'var(--display)', fontWeight: 500,
                fontSize: '17px', color: 'var(--ink)', letterSpacing: '0.02em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {row.name}
              </Box>
              <Box component="span" sx={{
                display: 'block', fontFamily: 'var(--mono)', fontSize: '10px',
                letterSpacing: '0.12em', color: 'var(--ink-dim)', mt: 0.4,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {row.meta.toUpperCase()}{row.fhirId ? '  ·  ID ' + String(row.fhirId).slice(0, 18) : ''}
              </Box>
            </Box>
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <StatusChip status={row.status} />
              <span className="gc-acquire">ACQUIRE ▸</span>
            </Box>
          </button>
        );
      })}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// The console
// ---------------------------------------------------------------------------

export function DirectoryConsole() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [facets, setFacets] = useState({ city: '', state: '', postalCode: '' });
  const [showFacets, setShowFacets] = useState(false);
  const [totals, setTotals] = useState(null);
  const [bands, setBands] = useState(null);          // null = no search yet
  const [scanning, setScanning] = useState(false);
  const [scanMs, setScanMs] = useState(null);
  const [scanError, setScanError] = useState(null);
  const debounceRef = useRef(null);
  const scanSeq = useRef(0);

  const gridTotal = totals
    ? Object.values(totals).reduce(function(sum, n) { return sum + n; }, 0)
    : null;

  const runScan = useCallback(async function(q, facetValues) {
    const seq = ++scanSeq.current;
    setScanning(true);
    setScanError(null);
    try {
      const result = await Meteor.rpc('providerDirectory.omniSearch', Object.assign({ q: q }, facetValues));
      if (seq !== scanSeq.current) { return; }   // superseded by a newer scan
      setTotals(result.totals);
      setBands(q.trim().length >= 2 ? result.results : null);
      setScanMs(result.searchMs);
    } catch (error) {
      if (seq !== scanSeq.current) { return; }
      log.error('omniSearch failed', { error: get(error, 'reason', error.message) });
      setScanError(get(error, 'reason', error.message));
    } finally {
      if (seq === scanSeq.current) { setScanning(false); }
    }
  }, []);

  // Census on boot.
  useEffect(function() {
    runScan('', {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced scan as the operator types.
  function handleQueryChange(event) {
    const next = event.target.value;
    setQuery(next);
    if (debounceRef.current) { clearTimeout(debounceRef.current); }
    debounceRef.current = setTimeout(function() { runScan(next, facets); }, 450);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      if (debounceRef.current) { clearTimeout(debounceRef.current); }
      runScan(query, facets);
    }
  }

  function handleFacetChange(key) {
    return function(event) {
      const next = Object.assign({}, facets);
      next[key] = event.target.value;
      setFacets(next);
      if (debounceRef.current) { clearTimeout(debounceRef.current); }
      debounceRef.current = setTimeout(function() { runScan(query, next); }, 450);
    };
  }

  function hailSuggestion(term) {
    return function() {
      setQuery(term);
      runScan(term, facets);
    };
  }

  const hasQuery = query.trim().length >= 2;

  return (
    <Box className="grid-console" sx={{
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: 'var(--void)', position: 'relative',
      // atmosphere layers
      '&::before': {
        content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(120% 90% at 15% -10%, rgba(38, 64, 128, 0.35), transparent 55%),
          radial-gradient(90% 70% at 95% 110%, rgba(255, 94, 168, 0.10), transparent 60%),
          repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 3px)
        `
      },
      '&::after': {
        content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: NOISE_URI, animation: 'gcFlicker 4s ease-in-out infinite'
      }
    }}>
      <style>{CONSOLE_CSS}</style>

      {/* traveling sweep line */}
      <Box sx={{
        position: 'absolute', left: 0, right: 0, top: 0, height: '2px', zIndex: 1,
        background: 'linear-gradient(90deg, transparent, var(--cyan-dim), transparent)',
        animation: 'gcSweep 9s linear infinite', pointerEvents: 'none'
      }} />

      {/* scrollable console body */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', zIndex: 2 }}>
        <Box sx={{ maxWidth: '1180px', mx: 'auto', px: { xs: 2.5, md: 5 }, pt: { xs: 3, md: 5 }, pb: 8 }}>

          {/* ---- masthead ---- */}
          <Box className="gc-boot" sx={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end',
            justifyContent: 'space-between', gap: 2, mb: 4
          }}>
            <Box>
              <Box sx={{
                fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.34em',
                color: 'var(--cyan)', mb: 1
              }}>
                NATIONAL PROVIDER GRID <Box component="span" sx={{ color: 'var(--ink-dim)' }}>// FHIR R4 // VhDir</Box>
              </Box>
              <Box component="h1" sx={{
                m: 0, fontFamily: 'var(--display)', fontWeight: 700,
                fontSize: 'clamp(40px, 6.5vw, 76px)', lineHeight: 0.95,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                background: 'linear-gradient(100deg, var(--amber) 10%, #ffe3b0 38%, var(--cyan) 90%)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                filter: 'drop-shadow(0 0 26px rgba(255,180,84,0.18))'
              }}>
                Directory
              </Box>
            </Box>
            <Box sx={{
              fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.16em',
              color: 'var(--ink-dim)', textAlign: 'right', lineHeight: 2
            }}>
              <Box><UtcClock /></Box>
              <Box>
                UPLINK <Box component="span" sx={{ color: 'var(--green)' }}>◉ NOMINAL</Box>
                {'  ·  '}
                {gridTotal === null ? 'CENSUS…' : gridTotal.toLocaleString() + ' RECORDS'}
              </Box>
            </Box>
          </Box>

          {/* ---- census ticker ---- */}
          <Box className="gc-boot" sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: '1px', background: 'var(--hairline)', border: '1px solid var(--hairline)',
            mb: 5, position: 'relative', animationDelay: '120ms'
          }}>
            <Brackets />
            {Object.keys(BAND_CONFIG).map(function(resourceName, index) {
              const config = BAND_CONFIG[resourceName];
              return (
                <Box key={resourceName} sx={{ background: 'var(--panel)', px: 2.5, py: 2 }}>
                  <TickerNumber value={totals ? get(totals, resourceName, 0) : null} delay={index * 140} />
                  <Box sx={{
                    fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.28em',
                    color: 'var(--ink-dim)', mt: 0.6
                  }}>
                    <Box component="span" sx={{ color: config.accent, mr: 0.8 }}>{config.sigil}</Box>
                    {config.label}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* ---- the HAIL bar ---- */}
          <Box className="gc-boot" sx={{ animationDelay: '240ms', mb: 1.5 }}>
            <Box sx={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 2.5,
              border: '1px solid var(--cyan-dim)', background: 'var(--panel-hard)',
              px: { xs: 2, md: 3.5 }, py: { xs: 2, md: 2.8 }, overflow: 'hidden',
              transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
              '&:focus-within': {
                borderColor: 'var(--cyan)',
                boxShadow: '0 0 34px rgba(83,230,255,0.14), inset 0 0 22px rgba(83,230,255,0.04)'
              }
            }}>
              <Brackets color="var(--amber-dim)" size={18} />
              <Box sx={{
                fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '11px',
                letterSpacing: '0.3em', color: 'var(--amber)', whiteSpace: 'nowrap',
                borderRight: '1px solid var(--hairline)', pr: 2.5, py: 0.5
              }}>
                HAIL ▸
              </Box>
              <input
                id="gridHailInput"
                className="gc-hail-input"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder="organizations · clinicians · sites · uplinks"
                autoComplete="off"
                spellCheck="false"
              />
              {!query ? (
                <Box sx={{
                  width: '12px', height: '26px', background: 'var(--amber)',
                  animation: 'gcCaret 1.1s step-end infinite', flexShrink: 0, opacity: 0.8
                }} />
              ) : null}
              {scanning ? (
                <Box sx={{
                  position: 'absolute', top: 0, bottom: 0, width: '38%', pointerEvents: 'none',
                  background: 'linear-gradient(90deg, transparent, rgba(83,230,255,0.10), transparent)',
                  animation: 'gcScan 1.1s linear infinite'
                }} />
              ) : null}
            </Box>

            {/* status line under the bar */}
            <Box sx={{
              display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
              fontFamily: 'var(--mono)', fontSize: '9.5px', letterSpacing: '0.2em',
              color: 'var(--ink-dim)', mt: 1, px: 0.5
            }}>
              <Box>
                {scanning
                  ? <Box component="span" sx={{ color: 'var(--cyan)' }}>SCANNING {gridTotal === null ? '' : gridTotal.toLocaleString() + ' RECORDS ACROSS 4 BANDS…'}</Box>
                  : scanError
                    ? <Box component="span" sx={{ color: 'var(--magenta)' }}>SCAN FAULT — {String(scanError).toUpperCase()}</Box>
                    : hasQuery && scanMs !== null
                      ? <>RETURN IN <Box component="span" sx={{ color: 'var(--amber)' }}>{scanMs}ms</Box></>
                      : 'AWAITING QUERY'}
              </Box>
              <Box
                component="button"
                onClick={function() { setShowFacets(!showFacets); }}
                sx={{
                  all: 'unset', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '9.5px',
                  letterSpacing: '0.2em', color: showFacets ? 'var(--amber)' : 'var(--ink-dim)',
                  '&:hover': { color: 'var(--amber)' }
                }}
              >
                <Box component="span" sx={{
                  display: 'inline-block', transition: 'transform 0.2s ease',
                  transform: showFacets ? 'rotate(90deg)' : 'none', mr: 0.8
                }}>▸</Box>
                PRECISION SCAN
              </Box>
            </Box>

            {/* precision-scan drawer */}
            <Collapse in={showFacets}>
              <Box sx={{
                display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3,
                border: '1px solid var(--hairline)', borderTop: 'none',
                background: 'rgba(11,18,32,0.5)', px: 3, py: 2.5
              }}>
                {[['city', 'CITY'], ['state', 'STATE'], ['postalCode', 'POSTAL CODE']].map(function(pair) {
                  return (
                    <Box key={pair[0]}>
                      <Box sx={{
                        fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.3em',
                        color: 'var(--ink-dim)', mb: 0.5
                      }}>
                        {pair[1]}
                      </Box>
                      <input
                        className="gc-facet-input"
                        value={facets[pair[0]]}
                        onChange={handleFacetChange(pair[0])}
                        onKeyDown={handleKeyDown}
                        placeholder="—"
                      />
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>

          {/* ---- results / idle state ---- */}
          <Box sx={{ mt: 4 }}>
            {bands === null ? (
              <Box className="gc-boot" sx={{ animationDelay: '360ms', textAlign: 'center', py: 6 }}>
                <Box sx={{
                  fontFamily: 'var(--mono)', fontSize: '11px', letterSpacing: '0.24em',
                  color: 'var(--ink-dim)', mb: 3
                }}>
                  THE GRID HOLDS {gridTotal === null ? '…' : gridTotal.toLocaleString()} REGISTERED CONTACTS
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  {['Mayo', 'Baptist', 'Providence', 'Cardiology'].map(function(term) {
                    return (
                      <button key={term} className="gc-chip-btn" onClick={hailSuggestion(term)}>
                        {term.toUpperCase()}
                      </button>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              bands.map(function(band, index) {
                const config = BAND_CONFIG[band.resourceName];
                if (!config) { return null; }
                return (
                  <ResultBand
                    key={band.resourceName + '-' + query}
                    band={band}
                    config={config}
                    navigate={navigate}
                    revealIndex={index}
                  />
                );
              })
            )}
          </Box>
        </Box>
      </Box>

      {/* ---- footer telemetry strip ---- */}
      <Box sx={{
        position: 'relative', zIndex: 2, flexShrink: 0,
        borderTop: '1px solid var(--hairline)', background: 'rgba(5,8,16,0.85)',
        px: { xs: 2.5, md: 5 }, py: 1,
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1,
        fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.22em', color: 'var(--ink-dim)'
      }}>
        <Box>
          GRID CONTROL <Box component="span" sx={{ color: 'var(--amber)' }}>v2</Box>
          {'  ·  '}CHRONICLE WORKSTATION
        </Box>
        <Box>
          SOURCES <Box component="span" sx={{ color: 'var(--cyan)' }}>NPPES</Box> ·{' '}
          <Box component="span" sx={{ color: 'var(--cyan)' }}>LANTERN</Box> ·{' '}
          <Box component="span" sx={{ color: 'var(--cyan)' }}>VENDOR LISTS</Box>
          {'  ·  '}CLASSIC CONSOLE AT /provider-directory-classic
        </Box>
      </Box>
    </Box>
  );
}

export default DirectoryConsole;
