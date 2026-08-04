# Ambiance Experience Zone — Design Spec

**Date**: 2026-08-03
**Branch**: `go-live-ui-polish`
**Status**: Approved design, pending implementation plan

## Vision

Honeycomb serves patients who seek very different caring environments — zen
garden, ICU, cyberpunk, refugee camp, desert nomad, eco resort, blue lagoon,
catholic sanctuary. The app expresses this through **ambiance backgrounds**
(full-bleed photos or solid earth tones) with a **glass/AR-style digital
interface** layered over them. Design goals, in priority order:

1. Patient education and trust through aesthetic + cultural framing
2. Calm/peacefulness — the interface reads as a digital layer over an
   environment, not a form over a gray canvas
3. Integration of medical illustration (future)

Not every page participates. Clinical/analytic pages (`/fhir-graph`,
`/clinical-story`, the timeline) own their full-page presentation. A small,
curated set of routes — initially **Provider Directory** and **Vertical
Timeline** — form the *patient-experience zone* where ambiance renders.

## Current state (what exists today)

- **Ambiance leaks everywhere.** `StyledMainRouter` (`imports/ui/App.jsx`
  ~1824) paints `background.default` AND the ambiance `backgroundImage` on the
  same `#mainAppRouter` element; the image layers over the color, so every
  route shows the photo through canvas gaps whether designed for it or not.
- **DirectoryConsole prototype** (uncommitted, `npmPackages/provider-directory/
  client/DirectoryConsole.jsx`): transparent root deferring to the router
  background, `?align=left|center|right` and `?page-theme=light|dark` URL
  params, per-page `createTheme` mode override. Legibility over bright photos
  is poor (washed-out stats, invisible chips/telemetry, naked result rows).
- **ThemeControls** (`imports/ui/theme/ThemeControls.jsx`): shared by the
  Theme & Palette dialog (Ctrl+Shift+T) and `/theming`. Order today: Preset →
  Font/Mode/Accent hue → Ambiance carousel.
- **Persistence**: `saveThemeChoice()`/`loadThemeChoice()`
  (`imports/lib/themePersistence.js`, localStorage) carries `{ presetId,
  accentHue, fontFamily, mode, backgroundImagePath }`.
- **Background library** (`imports/ui/themeBackgrounds.js`): settings-driven
  (`settings.public.theme.backgroundLibrary`), code fallback of 12 images.
- **Flat cards precursor**: Cmd/Ctrl+Shift+L dispatches a `toggleFlatCards`
  CustomEvent consumed locally by `LifeSupportDashboard` and `NotFoundPage`
  (ephemeral, per-page state).
- **Meteor-object distribution precedent**: `Meteor.useTheme`
  (`imports/ui/CustomThemeProvider.jsx:18`), `Meteor.Logger`, `Meteor.rpc`.
- **StyledCard prior art**: a private component inside
  `imports/patient/AutoDashboard.jsx:131` — concept proven, never extracted.
  (A previous extraction attempt via the fhir-starter npm package was judged
  the wrong distribution channel.)

## Core semantics

### `allowAmbiance` — a capability gate, not a preference

Route entries declare `allowAmbiance: true` (workflow.json → client.js route
mapper → route object → `StyledMainRouter`), riding the exact pipeline
`requireAuth`/`requirePatient` already use. The flag means *"this page's
layout stays legible over an arbitrary photo"* — a developer statement of
competence. It never turns ambiance on.

|                          | Background = None | Background = image/solid |
|--------------------------|-------------------|--------------------------|
| **Route not flagged**    | normal page       | normal page — opaque canvas suppresses the ambiance |
| **Route flagged**        | normal page       | ambiance visible; Page Mode + Card Surface active |

This *tightens* current behavior: unflagged routes stop leaking the photo
through canvas gaps. The user/org choice of background (Theme & Palette
dialog / `settings.public.theme.backgroundImagePath` seed) remains the actual
on-switch and stays global.

Initial flag list: Provider Directory (`/provider-directory`), Vertical
Timeline. Package-specific ambiance pages opt in via their own workflow.json.

### Three persisted theme axes (new + extended)

All global, all through `saveThemeChoice()`:

| Axis | Values | Consumed by |
|------|--------|-------------|
| `pageMode` | `'light'` / `'dark'` / unset | Zone routes only — forces the content-ink palette over ambiance while the chrome (header/footer/dialogs) keeps the app `mode`. Promotes DirectoryConsole's inline `createTheme` override into a shared helper. |
| `cardSurface` | `'solid'` / `'glass'` / `'flat'` | Zone routes now; anywhere later. |
| `backgroundImagePath` (extended) | image `src` **or** solid-color entry | App root. A solid earth tone is just another background choice — mutually exclusive with an image, same axis, same persistence. |

Solid-color entries are stored as a `color:` prefixed string on the existing
axis (e.g. `color:#a67b5b`) — keeps `themePersistence` a flat string shape,
backward compatible with stored image paths. `setThemeBackground()` accepts
both forms; the App.jsx painter branches: image paths set `backgroundImage`,
`color:` values set `backgroundColor` only.

### Card surface — three distinct states, not a toggle

- **Solid** — today's opaque `background.paper`. Default everywhere.
- **Glass** — translucent panel + backdrop blur + hairline border. The
  DirectoryConsole overlay recipe (`--panel` at ~0.72 paper-alpha, hairlines,
  scrims), extracted into shared tokens.
- **Flat** — no surface at all; content melts in from pure negative space
  (the Ctrl+Shift+L effect, graduated).

They are separate effects and both survive: transitions between states are
animated (CSS transitions on background-color / backdrop-filter / border /
opacity), enabling solid→glass fades and the flat melt-in.

Cmd/Ctrl+Shift+L graduates from a per-page CustomEvent to cycling the
persisted `cardSurface` (solid → glass → flat → solid).
`LifeSupportDashboard` and `NotFoundPage` migrate from the event listener to
reading the setting.

## Architecture

### AmbianceZone route wrapper — correctness by construction

A new wrapper composing exactly like the existing guards:

```
AuthGuard > PatientGuard > AmbianceZone > ErrorBoundary > page
```

When the route is flagged AND a background is active, `AmbianceZone`:

1. Wraps the page in a **Page-Mode-derived `ThemeProvider`** (the shared
   helper promoted from DirectoryConsole: rebuild with the app's accent
   palette + typography, flip only mode-dependent tokens).
2. Carries **MuiCard/MuiPaper component overrides** implementing the active
   `cardSurface` — so even a raw MUI `<Card>` in the zone renders legible
   glass/flat treatment with correct ink. Enforcement that depends on
   developer discipline breaks; a theme override at the zone boundary cannot
   be forgotten.
3. Maintains the shared CSS vars (`--panel`, `--panel-hard`, `--ink`,
   `--hairline`, scrim gradients) that bespoke pages consume directly.

When the route is unflagged or background is None, AmbianceZone renders
children unchanged (zero cost, zero behavior change).

### StyledMainRouter changes

- Match the active route (`useLocation` + `matchPath` against `allRoutes`)
  and include the ambiance `backgroundImage`/solid `backgroundColor` in
  `mainAppStyle` **only when the active route is flagged**. One decision
  point, in the file that already owns both the background and the route
  table.
- Compose `AmbianceZone` into the guard chain per route flag.

### `Meteor.StyledCard` — the premium surface component

Extracted shared component (`imports/ui/components/StyledCard.jsx`), attached
to the Meteor object at provider setup following the `Meteor.useTheme`
precedent. Workflow packages consume it without import-path coupling:

```javascript
const Card = Meteor.StyledCard || MuiCard;   // graceful degradation
```

StyledCard is surface-aware (`cardSurface`), animates state transitions
(glass fades, flat melt-in from negative space), and inherits zone ink
automatically. It is the **convention** for zone pages — the raw-MUI theme
override above is the **net** underneath it. The private
`AutoDashboard.jsx` StyledCard migrates to (or is superseded by) the shared
one opportunistically.

## Theme & Palette dialog restructure

New section order (both dialog and `/theming`, via shared `ThemeControls`):

1. **PRESET** — unchanged (Limestone / Tron / Vaporwave tiles).
2. **AMBIANCE BACKGROUND** — moved directly under Preset.
   - Row 1: None + image thumbnails (existing library).
   - Row 2: 8 solid earth-tone swatches, same selection semantics as
     images. Provisional values (tunable at review, not at implementation
     time): clay `#a67b5b`, sand `#d9c7a7`, terracotta `#b0674b`, moss
     `#6b7d5a`, sage `#a3b18a`, stone `#8d8578`, ochre `#c49a3c`, espresso
     `#4a3728`.
3. **BASIC THEME CONTROLS** (new group label) — Font · Mode · **Page Mode** ·
   Accent hue · **Card Surface**.
   - **Page Mode** renders next to Mode *only when background ≠ None*.
     Light/Dark toggle, persisted as `pageMode`.
   - **Card Surface** — three-button segmented control (Solid / Glass /
     Flat) with a live mini-preview.
4. **Advanced — per-field palette** — unchanged.

## DirectoryConsole polish (zone reference implementation)

- **Padding**: 200px side padding at the `xl` breakpoint (MUI standard
  1536px), stepping down to existing responsive values (`md: 5`, `xs: 2.5`)
  below. Applies in all `?align` placements.
- **Legibility scrim system**: soft column-wide canvas-fade behind the
  content column; stronger `--panel` backing behind census stats, result
  rows, ACTIVE chips, and small telemetry text ("UPLINK NOMINAL",
  "495 CONTACTS", "RETURN IN…") so all of it survives bright photos.
- **Params**: `?align` and `?page-theme` survive as dev/demo overrides; the
  persisted `pageMode` is the real control (URL param wins when present).
- Its overlay recipe is the source of the shared glass tokens (extraction is
  Phase 3; the polish itself must not wait on it).

## Phases / build order

1. **Theme & Palette dialog restructure + persistence axes** — dialog
   reorder, earth-tone row, Page Mode + Card Surface controls, `pageMode` /
   `cardSurface` / solid-background persistence. No page consumes the new
   axes yet beyond what already exists.
2. **DirectoryConsole polish** — `xl` padding, scrim/legibility pass,
   `pageMode` consumption (replacing its inline override with the shared
   helper when Phase 3 lands, inline until then).
3. **Zone plumbing** — `allowAmbiance` flag through the route pipeline,
   StyledMainRouter conditional painting, `AmbianceZone` wrapper with theme
   override net, shared glass/flat tokens extracted from DirectoryConsole,
   `Meteor.StyledCard`, Ctrl+Shift+L graduation, flag the two initial routes.
4. **Theme packs (future — seams only)** — a pack is a named macro over the
   axes above: `{ preset palette, font, ambiance background, cardSurface
   default, pageMode default }`, delivered via `settings.public.theme.packs`
   (the settings-driven `backgroundLibrary` proves the pattern), selectable
   per patient later. Medical illustration and patient-education content
   integration follow the same seam. Nothing in Phases 1–3 blocks this.

## Scope guardrails

- Phase 3 tokens activate **only on flagged routes**; the flag list starts
  at two pages. No app-wide restyling.
- Unflagged routes must render pixel-identical to today (except no longer
  leaking the ambiance photo through canvas gaps).
- No mass migration of existing cards to StyledCard; opportunistic only.
- Printing always uses the light theme (existing rule); ambiance
  images/solids and glass/flat surfaces must not survive into print — the
  existing `@media print` global block plus the zone override deferring to
  `createDynamicTheme('light')` cover this; verify during Phase 3.

## Error handling & testing

- **Graceful degradation**: `Meteor.StyledCard || MuiCard` idiom; zone
  wrapper no-ops when background is None; missing/invalid background values
  fall back to no ambiance (never a broken image over content).
- **Persistence robustness**: unknown `cardSurface`/`pageMode` values in
  localStorage are treated as unset (forward/backward compat).
- **E2E**: existing Nightwatch suites must pass untouched on unflagged
  routes (the pixel-identity guarantee). New coverage: dialog controls
  persist across reload; DirectoryConsole renders legibly with a bright
  ambiance + `pageMode` both ways; Ctrl+Shift+L cycles surfaces.
- **Theme audit**: run `/audit-theme` and `/audit-print` after Phases 2–3.

## Out of scope

- Theme pack authoring/selection UI (Phase 4 seam only)
- Medical illustration assets and patient-education content
- Migrating existing pages beyond the two initial zone routes
- AR/spatial interfaces beyond the glass visual language
