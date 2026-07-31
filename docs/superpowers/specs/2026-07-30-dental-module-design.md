# @orbital/dental — Dental Data Exchange Module

**Date**: 2026-07-30
**Status**: Approved (verbal, YOLO-mode) — refine as we go
**Driver**: ADA interest in the honeycomb work; FEHRM meeting next week. Ship a working dental module immediately, iterate after.
**Source of truth**: HL7 Dental Data Exchange IG (current build, v2.0.0-ballot) — https://build.fhir.org/ig/HL7/dental-data-exchange/

## Purpose

A private extension package implementing the HL7 Dental Data Exchange FHIR IG:
bidirectional medical⇄dental referral exchange, dental clinical data
(conditions/findings/procedures/communications), a visual odontogram ("dental
map"), and a Dental entry in the CPOE Order Catalog.

## Package shape

- `extensions/dental/`, npm name `@orbital/dental`, `UNLICENSED`, `private: true`
- Own nested git repo (orbital-health-systems org, **https** remote), monorepo-gitignored
- Activated via `EXTRA_WORKFLOWS=@orbital/dental`; self-declares `"serverEntry": "./server"` in its own `workflow.json` (NOT added to `workflows/workflows.json` — central manifest is @node-on-fhir-only)
- **No new Mongo collections.** Rides Conditions, Observations, Procedures, ServiceRequests, Communications, Compositions, Bundles. Dental records are identified by `meta.profile` (IG canonical URLs) OR dental category codings — never by resource type alone.
- Follows lantern/chronicle conventions exactly: `client.js` COMPONENTS map, `server.js → server/index.js` (collections → methods → publications → seed), `Meteor.rpc` from the client, Meteor v3 async on the server, theme tokens, footer-button IDs per `.claude/rules/ui/footer-buttons.md`.

## Components

### 1. Dental Chart — `/dental` (requireAuth + requirePatient)

The showpiece. SVG odontogram, ADA Universal Numbering 1–32 (permanent
dentition), upper + lower arches in anatomical arc layout.

- Tooth state derived from the selected patient's dental Conditions + Procedures
  by matching `bodySite` tooth codes (SNOMED codes from the IG's
  tooth-identification value set, learned from the seed data, with ADA universal
  numbers as fallback matching).
- States (priority order): **missing/extracted** > **root canal** > **abscess** >
  **caries** > **restored** > **watch** > healthy. Color-coded with a legend;
  theme-aware; prints light per `/audit-print` rules.
- Click a tooth → drawer showing that tooth's conditions, findings, procedures +
  a "Record finding" quick-add that writes a `meta.profile`-stamped Dental
  Condition via `dental.conditions.recordForTooth`.
- Side panels (greedy-height layout per `.claude/rules/ui/layout-patterns.md`):
  dental conditions, findings (Observations), procedures, patient-education
  Communications.
- Pure derivation logic lives in `lib/toothState.js` (no Meteor imports) with
  `node --test` unit tests.

### 2. Referral exchange — `/dental/referrals` (requireAuth + requirePatient)

The IG's actual raison d'être.

- List of dental ServiceRequests (both directions: medical→dental,
  dental→specialist), flattened-table UI.
- "New referral" composer: reason-for-referral (IG value set subset), performer,
  priority, note → server method `dental.referrals.create` builds the **Dental
  Service Request**, a **Referral Note Composition**, and the **Dental Bundle**
  (document bundle) pulling active conditions, medications, and allergies in as
  sections per the IG.
- Referral detail: shows the composed document; consult-note return direction as
  a minimal viewer/composer (`dental.consults.create`) writing the Consult Note
  Composition + Bundle.

### 3. Conformance layer (server)

- `ProfileSet` export (name "Dental Data Exchange", canonicalBase
  `http://hl7.org/fhir/us/dental-data-exchange/StructureDefinition`, the IG
  profiles: dental-servicerequest, dental-condition, dental-findings,
  dental-communication, dental-procedure, dental-bundle, dental-referral-note,
  dental-consult-note) + `ProfileDecorators` — registered via the `Package`
  global by the workflow server-loader, exactly like `npmPackages/us-core`, so
  the CapabilityStatement advertises dental conformance with zero core changes.
- Methods namespaced `dental.*`; publications `dental.*` filtered to
  profile-stamped/dental-coded records + patient.
- **Sample data**: the IG's example set (Patient/example-dental full-mouth case:
  caries teeth 2–15, restorations 2–15, root canal + periodontal abscess tooth
  8, dental + medical practitioners, orgs, Aetna dental coverage, referral +
  encounters + communications) vendored as JSON under `data/seed/`. Idempotent
  startup seed (skips CI) + on-demand `dental.loadSampleData` method.

### 4. Order Catalog extension point (monorepo change, `npmPackages/order-catalog`)

Order Catalog's three ancillaries (laboratory/medication/radiology) are
hardcoded. Rather than hardcoding a fourth, add the extension point:

- New `client/catalogRegistry.js` in `@node-on-fhir/order-catalog`:
  `registerOrderCatalog({ key, label, catalog, categories, order })` +
  `getRegisteredCatalogs()`, exported from the package client entry.
- `OrderCatalogPage.jsx` renders ToggleButtons for the 3 builtins + registered
  entries; resolves catalog/categories from the registry for registered types;
  order submission for registered types goes through the existing
  ServiceRequest-creation method with the catalog item's coding + category
  passed through.
- `@orbital/dental` registers a **Dental** catalog at client load (eval,
  prophylaxis, radiograph survey, resin restoration, extraction, root canal,
  fluoride tx…) coded from the IG's dental procedure value set (SNOMED).
  **License note**: raw CDT codes are ADA-licensed; the shipped subset uses
  SNOMED codings from the IG, with CDT display names avoided. Route:
  `/cpoe/dental` (contributed by @orbital/dental's workflow.json, rendering
  OrderCatalogPage defaultType="dental").

### 5. Chrome

- Sidebar: "Dental" item → `/dental` (closest MUI icon; no tooth glyph in MUI).
- `footer-buttons-dental` group on `/dental*` routes: Dental Chart / Referrals /
  Dental Orders. Button IDs `dental-*-footer-btn`.

## Decisions & scope ledger

- Branch: `feat/dental-module` cut from `feat/patient-records-connect` HEAD (not
  main) to preserve the in-progress directory-console working tree; rebase or
  re-target at PR time.
- v1 = permanent dentition only (32 teeth). Primary/mixed dentition, perio pocket
  charting, intraoral imaging (OHIF tie-in), real CDT licensing → roadmap.
- Consult-note composer is minimal in v1 (title + narrative + auto sections).
- Nightwatch suite deferred; v1 verification = unit tests on `lib/toothState.js`
  + live boot + route/seed verification. E2E CRUD suite is week-two.
- IG is a ballot build; profile URLs pinned to canonicalBase above and isolated
  in `lib/DentalProfiles.js` so a publication rename is a one-file change.

## Success criteria

1. `EXTRA_WORKFLOWS=@orbital/dental meteor run …` boots clean; `/dental`,
   `/dental/referrals`, `/cpoe/dental` all render.
2. Selecting the seeded example-dental patient lights up the odontogram with the
   full-mouth case (caries 2–15 → restorations, root canal 8).
3. Creating a referral produces a valid document Bundle (Composition +
   ServiceRequest + sections) visible in the referral detail.
4. CapabilityStatement advertises the dental profiles.
5. Order Catalog shows a Dental toggle sourced from the registry, and placing a
   dental order creates a profile-stamped ServiceRequest.
