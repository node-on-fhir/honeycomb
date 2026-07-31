# Slash Command: /apply-advanced-theming

Wire a bespoke, self-styled page into the app's advanced theming system so the
**ThemeDialog** (palette icon / Ctrl+Shift+T) and its presets
(Limestone / Tron / Vaporwave) drive it live — instead of the page hardcoding its
own colors and fonts.

## Usage

```
/apply-advanced-theming {route-or-file}
```

Examples:
```
/apply-advanced-theming /provider-directory
/apply-advanced-theming npmPackages/provider-directory/client/DirectoryConsole.jsx
/apply-advanced-theming imports/ui/DICOM/viewers/StackViewer.jsx
```

## What "advanced theming" means here

The theming system is already built (do NOT rebuild it):

- `imports/ui/CustomThemeProvider.jsx` — the **single palette authority**.
  `createDynamicTheme(mode)` reads `settings.public.theme.palette.*` and
  `buildTypography()` reads `theme.typography.{fontFamily,displayFontFamily}`.
- `imports/ui/themePresets.js` — `THEME_PRESETS` (limestone / tron / vaporwave)
  + `applyThemePreset()` / `setAccentHue()` / `setThemeFont()`. Applying a preset
  writes settings + `Session.set('themeRefreshRequest', true)`; the provider
  regenerates the MUI theme and every consumer re-renders.
- `imports/ui/ThemeDialog.jsx` — the modal that calls those helpers.

A page is "advanced-themed" when its visual identity is **derived from the active
MUI theme** rather than hardcoded. Then a preset chosen in the dialog restyles it
live: Limestone → grayscale, Tron → single-hue, Vaporwave → the saturated look.
The dialog opener (palette icon + Ctrl+Shift+T) is already global — this command
is about making the page *respond* to it, not adding the opener.

**This is for pages that opt OUT of the theme today** — DICOM-style set pieces
that inject their own `<style>` / CSS vars / color literals. A page already built
on theme tokens (`bgcolor: 'background.paper'`, `color: 'text.primary'`) is
already advanced-themed; there is nothing to do. See `.claude/rules/ui/theming.md`
for the token-first baseline every ordinary page should already follow.

## The theme-bind procedure

### 1. Inventory the page's hardcoded design tokens

Grep the target for the identity it hardcodes:

```bash
grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(|font-family|--[a-z]" {file}
```

You are looking for three things:
- a **CSS custom-property block** (`--void`, `--accent`, `--ink`, …) injected via `<style>`;
- **color literals** in `sx`/inline styles (`'#0a0a0b'`, `'rgba(255,180,84,.4)'`);
- **font-family** strings (self-hosted display/mono faces).

### 2. Generate the CSS-var block from the theme (the single seam)

Replace the hardcoded `:root`/scoped var block with a function of the live theme.
Read the theme with MUI's hook — it re-runs on every `themeRefreshRequest`, so the
`<style>` updates automatically:

```javascript
import { useTheme, alpha, darken, lighten } from '@mui/material/styles';

function buildConsoleVars(theme) {
  const p = theme.palette;
  const canvas = p.background.default;
  // Display font follows the theme; buildTypography() puts it on h1's fontFamily.
  const displayFont = (theme.typography.h1 && theme.typography.h1.fontFamily) || theme.typography.fontFamily;
  return `.grid-console {
  --void: ${canvas};
  --void-hi: ${lighten(canvas, 0.05)};
  --void-lo: ${darken(canvas, 0.5)};
  --panel: ${alpha(p.background.paper, 0.72)};
  --panel-hard: ${p.background.paper};
  --amber: ${p.primary.main};
  --amber-dim: ${alpha(p.primary.main, 0.42)};
  --stone: ${p.text.secondary};
  --stone-dim: ${alpha(p.text.secondary, 0.30)};
  --magenta: ${(p.secondary && p.secondary.main) || p.error.main};
  --green: ${(p.success && p.success.main) || '#69f0ae'};
  --ink: ${p.text.primary};
  --ink-dim: ${p.text.disabled};
  --hairline: ${p.divider};
  --display: ${displayFont};
}`;
}
```

Keep the structural CSS (keyframes, layout, `@font-face`) in a separate static
string — it never changes with the theme. Inject both:

```jsx
const theme = useTheme();
const consoleVars = buildConsoleVars(theme);
// ...
<style>{STATIC_CSS}</style>
<style>{consoleVars}</style>
```

### 3. Map tokens → palette (the correspondence table)

| Page token role | MUI theme source | Notes |
|---|---|---|
| page canvas / background | `palette.background.default` | derive `-hi`/`-lo` with `lighten`/`darken` for gradients |
| panels / surfaces | `palette.background.paper` | `alpha(...)` for translucent panels |
| lead accent | `palette.primary.main` | the sliding accent hue (Tron/Limestone control drives this) |
| secondary accent | `palette.secondary.main` (`|| error.main`) | |
| success / "live" | `palette.success.main` | |
| bright text | `palette.text.primary` | the brightest intensity tier |
| medium text / labels | `palette.text.secondary` | |
| dim text | `palette.text.disabled` | the dimmest tier |
| hairlines / rules | `palette.divider` | already carries alpha — use directly |
| display / heading face | `theme.typography.h1.fontFamily` | falls back to body font when no display font chosen |
| structural mono | *(leave fixed)* | mono data-readout is not a themed axis — keep the literal stack |

Three text intensities → `text.primary` / `text.secondary` / `text.disabled`.
Don't collapse them; the tiering is what reads as "instrument panel".

### 4. Route the scattered literals through the vars

For every remaining color literal in `sx`/inline styles and hover states, replace
it with the var — using `color-mix()` for the alpha/tint variants so
subcomponents never need the theme object:

```javascript
// before → after
'rgba(255,180,84,0.08)'  →  'color-mix(in srgb, var(--amber) 8%, transparent)'
'rgba(216,210,196,0.04)' →  'color-mix(in srgb, var(--stone) 4%, transparent)'
'#ffe3b0' /* accent tint */ → 'color-mix(in srgb, var(--amber) 55%, white)'
```

`color-mix(in srgb, …)` is supported in Chrome 111+ (this app ships on Chrome /
Electron), so it is safe here. The win: only the top component reads `theme`; every
child stays theme-agnostic, consuming vars. After this step the inventory grep from
§1 should return **only** the fallback literal inside the generator.

### 5. Register the page's signature look as a preset

So the page's original aesthetic remains selectable, add (or confirm) a preset in
`imports/ui/themePresets.js` whose palette reproduces it. The provider-directory
console's amber/green/cyan look is already the **`vaporwave`** preset — a new page
gets a new `THEME_PRESETS` entry `{ id, name, description, mode, accentHue,
fontFamily?, palette }` and, if it should be the app default, a
`theme.defaultPreset` in the settings file.

### 6. Verify each preset restyles the page live

1. Load the route. Open the ThemeDialog (palette icon or Ctrl+Shift+T).
2. Pick **Limestone** → the page goes grayscale. **Tron** → single accent hue.
   **Vaporwave** → the page's saturated identity. Each restyles **without reload**.
3. Dial the **accent hue** wheel → the lead accent tracks it.
4. Reload → the persisted choice re-applies (localStorage, no flash).
5. Confirm the grep from §1 is clean and there are no CSP/console errors.

## Worked example (reference implementation)

`npmPackages/provider-directory/client/DirectoryConsole.jsx` (`/provider-directory`)
is the canonical application of this procedure:
- `CONSOLE_STATIC_CSS` (fonts + keyframes + class rules, vars-only) vs.
  `buildConsoleVars(theme)` (the generated `.grid-console` var block);
- atmosphere `::before` gradient bound to `--void-hi/--void/--void-lo`;
- every `sx` tint routed through `color-mix(... var(--x) ...)`;
- its native look preserved as the `vaporwave` preset.

## Anti-patterns

- ❌ Re-implementing the ThemeDialog / preset system. It exists — bind to it.
- ❌ Adding the palette icon / hotkey to the page. Those are global (Header + hotkeys.js).
- ❌ Reading `settings.public.theme.palette.*` in the component. Read the MUI
  theme via `useTheme()` — the provider is the only legitimate settings reader.
- ❌ Threading `theme` into every subcomponent. Generate the var block once at the
  top; children consume vars + `color-mix`.
- ❌ Leaving unconditional dark literals on a now-theme-driven page — they ignore
  the palette and break the light presets (and printing). See `/audit-print`.

## Related

- Rule: `.claude/rules/ui/theming.md` — token-first baseline (the "already themed" case)
- File: `imports/ui/themePresets.js` — preset registry + apply helpers
- File: `imports/ui/CustomThemeProvider.jsx` — `createDynamicTheme`, `buildTypography`
- File: `imports/ui/ThemeDialog.jsx` — the dialog this wires pages into
- Reference impl: `npmPackages/provider-directory/client/DirectoryConsole.jsx`
- Command: `/audit-theme` (screen light/dark), `/audit-print` (dark-on-paper hazards)
