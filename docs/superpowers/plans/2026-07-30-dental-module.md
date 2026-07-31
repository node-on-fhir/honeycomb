# @orbital/dental Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Format note (YOLO-mode ledger):** this plan is being executed inline in the
> authoring session immediately after writing. Pure-logic code (toothState lib)
> is specified with full TDD code; UI tasks specify exact structure, props,
> data flow, ids, and acceptance checks rather than full JSX listings.

**Goal:** Ship `extensions/dental` (@orbital/dental) implementing the HL7 Dental Data Exchange IG: odontogram chart, referral document exchange, conformance layer, sample data, and a Dental entry in the CPOE Order Catalog via a new registry extension point.

**Architecture:** Private nested-repo workflow extension riding existing FHIR collections (no new collections); dental records identified by `meta.profile` + dental category coding. Monorepo change limited to `npmPackages/order-catalog` (catalog registry + generic order branch) and docs.

**Tech Stack:** Meteor v3 (async server), React 18 + MUI v5 (theme tokens), `Meteor.rpc` client calls, SVG odontogram, node --test for the pure lib.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-30-dental-module-design.md`
- IG canonicalBase: `http://hl7.org/fhir/us/dental-data-exchange`
- Tooth identity: ADA Universal coding system `http://terminology.hl7.org/CodeSystem/ADAUniversalToothDesignationSystem` (codes "1"–"32"); Conditions via `bodySite` extension → contained BodyStructure `location.coding`; Procedures via `bodySite[].coding`
- Dental category: `{CodeSystem}/dental-category` code `dental`
- Never `_id||id` OR-logic; `Meteor.rpc` from client; `function(){}` methods; lodash `get()`; file-header comment first line; no index.js barrels (client entry files excepted per convention); theme tokens; footer ids `dental-*-footer-btn`, className `footer-buttons-dental`
- Central manifest untouched — activation via `EXTRA_WORKFLOWS=@orbital/dental`
- Catalog shipped in @orbital/dental uses SNOMED codings (no CDT in the catalog; vendored IG examples keep their verbatim CDT codes)

---

### Task 1: Scaffold extensions/dental

**Files:** Create `extensions/dental/{package.json,workflow.json,client.js,server.js,.gitignore,README.md}`, `server/index.js` stub.

- package.json: name `@orbital/dental`, 0.1.0, private, UNLICENSED, main client.js, exports `.` / `./server` / `./workflow`, peerDeps react+mui+lodash, author "Orbital Health Systems, Inc".
- workflow.json routes (all `requireAuth: true`):
  - Dental `/dental` → `DentalChartPage` (`requirePatient: true`)
  - DentalReferrals `/dental/referrals` → `DentalReferralsPage` (`requirePatient: true`)
  - DentalOrders `/cpoe/dental` → `DentalOrdersPage` (`requirePatient: false`; page itself handles patient prompt like other CPOE routes)
  - sidebarItems: “Dental” → `/dental`, iconName `Spa`→ verify icon exists; fallback `MedicalServices`
  - `"serverEntry": "./server"`
- `- [ ]` git init nested repo, first commit. Verify root package.json workspaces glob covers `extensions/*` (add if missing).
- Acceptance: `npm install` symlinks `node_modules/@orbital/dental`.

### Task 2: lib/DentalProfiles.js + lib/toothState.js (TDD)

**Files:** Create `extensions/dental/lib/DentalProfiles.js`, `lib/toothState.js`, `tests/toothState.test.mjs`.

**Interfaces (produces):**
- `DentalProfiles.CANONICAL_BASE`, `DentalProfiles.PROFILES` (map key→URL: serviceRequest, condition, findings, communication, procedure, bundle, referralNote, consultNote), `DENTAL_CATEGORY_SYSTEM`, `ADA_TOOTH_SYSTEM`, `isDentalResource(resource)` (meta.profile prefix match OR dental category coding)
- `toothState.js`: `resolveToothNumber(resource) -> string|null` (handles both condition-extension-contained and procedure-bodySite paths), `deriveToothStates(conditions, procedures) -> { [toothNumber]: { state, records: [...] } }` with state priority `missing > rootCanal > abscess > caries > restored > watch > healthy`, driven by SNOMED code table:
  - caries: 251330002 (Caries active), 80967001 (Dental caries)
  - abscess: 83412009 (Periodontal abscess)
  - missing: extraction procedure 65546002 / condition edentulous codes
  - rootCanal: procedure code text/SNOMED root canal (234789000-family; match seed data)
  - restored: restoration procedures (SNOMED filling/restoration codes from seed)
  - watch: caries risk 425058005-family
- Both files pure JS (lodash only import allowed in lib — keep zero-dep for tests; use optional chaining instead of lodash).

**Steps:** write failing tests (resolveToothNumber from a real condition fixture + procedure fixture; deriveToothStates priority: caries+restoration on same tooth → restored beats caries only if restoration later? **Decision: state = highest-priority record present, priority list above; restoration does NOT clear caries in v1** — caries shows until condition marked resolved; resolved/inactive conditions excluded) → run (fail) → implement → run (pass) → commit.

Run: `cd extensions/dental && node --test tests/`

### Task 3: Server — seed data, ProfileSet, methods, publications

**Files:** Create `server/ProfileSet.js`, `server/seedDentalData.js`, `server/methods.js`, `server/publications.js`; fill `server/index.js`; vendor `data/seed/*.json` (91 IG example files from /tmp/dental-ig/examples).

- `server/index.js`: import ProfileSet re-exports, methods, publications, then startup seed. `export { ProfileSet, ProfileDecorators }`; `server.js` does `export * from './server/index.js'`.
- ProfileSet per us-core shape (name "Dental Data Exchange", version "2.0.0-ballot", fhirVersion 4.0.1, profiles map ServiceRequest/Condition/Observation/Communication/Procedure/Bundle/Composition→canonicals). ProfileDecorators: stamp `meta.profile` on egress for resources with dental category (Condition, Procedure, ServiceRequest, Communication decorators).
- seedDentalData: import all seed JSONs (explicit imports, no fs), group by `resourceType`, map to collections via `global.Collections` (Patients, Practitioners, PractitionerRoles, Organizations, Conditions, Procedures, Observations, ServiceRequests, MedicationRequests, Medications, Communications, Encounters, AllergyIntolerances, Immunizations, Coverages — skip types with no collection, log.warn each skip). Idempotent (`findOneAsync({id})` before insert, `_id = id`). Skip when `process.env.CI`. Export `loadDentalSampleData()` worker; call in `Meteor.startup`.
- methods (`Meteor.methods`, async function, auth-guarded, `check()`):
  - `dental.loadSampleData` → worker; returns counts
  - `dental.conditions.recordForTooth({ patientId, toothNumber, snomedCode, display, note })` → inserts profile-stamped Dental Condition with contained BodyStructure (mirror seed shape)
  - `dental.referrals.create({ patientId, reason, performerDisplay, priority, note })` → creates Dental ServiceRequest + Referral Note Composition (sections: reason, active problems, medications, allergies pulled from collections) + document Bundle; stores Composition + Bundle + ServiceRequest; returns ids
  - `dental.consults.create({ patientId, serviceRequestId, narrative })` → Consult Note Composition + Bundle referencing the ServiceRequest
- publications: `dental.conditions`, `dental.procedures`, `dental.observations`, `dental.serviceRequests`, `dental.communications`, `dental.compositions` — patient-filtered (`subject.reference` `Patient/{id}`) AND dental-scoped (meta.profile prefix OR dental category), userId-guarded.
- Commit (nested repo).

### Task 4: Odontogram + DentalChartPage

**Files:** Create `client/Odontogram.jsx`, `client/DentalChartPage.jsx`, `client/ToothDetailDrawer.jsx`.

- Odontogram: pure presentational. Props `{ toothStates, selectedTooth, onToothClick }`. SVG viewBox ~900×420; two arches (1–16 upper L→R per ADA order, 17–32 lower); tooth = rounded path sized by class (molars/premolars/canines/incisors), number label; fill by state via theme-aware palette map (healthy `background.paper`+divider stroke; caries `error.main`; restored `info.main`; rootCanal `secondary.main`; abscess `warning.main`; missing `action.disabledBackground` + dashed); selected = `primary.main` stroke width 3. Legend row. All colors via `useTheme()` palette lookups, print-safe.
- DentalChartPage: greedy-height layout (flex cascade + `minHeight: 0`); `useTracker` subscribes `dental.conditions|procedures|observations|communications` with `Session.get('selectedPatientId')`; derives `toothStates = deriveToothStates(conditions, procedures)`; renders Odontogram (top) + tabbed panels (Conditions / Findings / Procedures / Education) as flattened tables (`id`s: `dentalConditionsTable` etc.). "Load Sample Data" button (visible when zero dental records) → `Meteor.rpc('dental.loadSampleData')`.
- ToothDetailDrawer: right `Drawer`; shows records for tooth; quick-add form (SNOMED finding select: caries active / abscess / fracture / mobility / watch) → `Meteor.rpc('dental.conditions.recordForTooth', …)`.
- Commit.

### Task 5: Referral exchange UI

**Files:** Create `client/DentalReferralsPage.jsx`, `client/ReferralComposerDialog.jsx`, `client/ReferralDetailPanel.jsx`.

- List of dental ServiceRequests (table id `dentalReferralsTable`: date, reason, requester→performer, status, priority). “New Referral” → dialog (reason select from IG reason-for-referral subset, priority, performer free-text, note) → `Meteor.rpc('dental.referrals.create', …)`.
- Detail panel: selected referral's Composition sections rendered read-only + linked Bundle JSON view (collapsible `pre`); “Compose Consult Note” (narrative textarea) → `dental.consults.create`.
- Commit.

### Task 6: Order Catalog registry (monorepo) + dental catalog

**Files:** Create `npmPackages/order-catalog/client/catalogRegistry.js`; Modify `npmPackages/order-catalog/client/OrderCatalogPage.jsx` (state default, catalog ternary, category resolution, ToggleButtonGroup, submit orderType passthrough), `npmPackages/order-catalog/client.js`* (export registry fns — verify actual entry filename), `npmPackages/order-catalog/server/methods.js` (schema enum → free string + generic ServiceRequest branch); Create `extensions/dental/client/DentalCatalog.js`, `client/DentalOrdersPage.jsx` (imports OrderCatalogPage with defaultType="dental").

- Registry: module-level Map; `registerOrderCatalog({ key, label, catalog, categories, serviceCategoryCoding, profileUrls })`, `getRegisteredCatalogs()`, `getRegisteredCatalog(key)`. Duplicate key → warn + replace.
- OrderCatalogPage: toggles = 3 builtins + `getRegisteredCatalogs()`; catalog/category resolution falls through to registry; submit passes `orderType` through unchanged.
- methods.js generic branch (any orderType not laboratory/medication): ServiceRequest with `coding: [{ system: order.system || SNOMED, code, display }]`, `category: order.categoryCoding ? [{coding:[order.categoryCoding]}] : …`, `meta.profile: order.profileUrls`, else identical to radiology branch (audit event included). Schema: drop enum, keep string.
- DentalCatalog: ~10 items `{ id, code (SNOMED), display, category, turnaround?, priority }` — categories Diagnostic / Preventive / Restorative / Endodontic / Surgical (e.g. 34043003 dental prophylaxis; 168665008 dental radiograph-family; resin restoration; extraction 65546002; root canal; fluoride application 313042009 — verify codes against seed data / IG valueset during implementation, prefer codes appearing in vendored examples).
- Dental registers at client.js module load. Commit monorepo (order-catalog) + nested (dental) separately.

### Task 7: Chrome — client.js wiring, footer buttons

**Files:** Create `extensions/dental/client/DentalFooterButtons.jsx`; fill `extensions/dental/client.js`.

- client.js: COMPONENTS map (DentalChartPage, DentalReferralsPage, DentalOrdersPage); DynamicRoutes copies `requireAuth` + `requirePatient`; SidebarWorkflows; FooterButtons `[{ pathname: ['/dental', '/cpoe/dental'], element: <DentalFooterButtons/> }]`; registers dental catalog; default export `{ name, routes, sidebarItems, footerButtons }`.
- FooterButtons: Box `footer-buttons-dental`; buttons Dental Chart `/dental`, Referrals `/dental/referrals`, Dental Orders `/cpoe/dental`; ids per convention; active = contained variant.
- Commit.

### Task 8: Boot verification

- `npm install` (workspace symlink), then `EXTRA_WORKFLOWS=@orbital/dental meteor run --settings settings/settings.honeycomb.localhost.json` (background; kill stale :3000 first; obey meteor-background-launch gotchas).
- Verify: boot log shows `[dental]` server load + seed counts; `curl localhost:3000/metadata | jq` CapabilityStatement includes dental-condition profile; login → select Patient A (example-dental) → `/dental` odontogram lights caries 2–15/root canal 8; `/dental/referrals` lists seeded referral(s); Order Catalog shows Dental toggle; place order → ServiceRequest with dental category.
- Playwright screenshot of odontogram for the demo-readiness check.
- Fix-forward anything found; keep unit tests green.

### Task 9: Land it

- Nested repo: final commit; create private GitHub repo orbital-health-systems/dental (https remote) if org access allows, else defer push (ledger).
- Monorepo `feat/dental-module`: commit order-catalog registry + plan/spec docs. `graphify update .`.
- Report: routes, demo script for FEHRM/ADA, roadmap (primary dentition, perio charting, OHIF intraoral imaging, CDT licensing).
