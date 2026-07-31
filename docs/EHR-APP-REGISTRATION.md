# EHR App Registration — Epic & Cerner (Patient Records Connect)

How to register a patient-facing SMART-on-FHIR app with the major EHR vendors
so a honeycomb/Chronicle deployment can fetch a patient's own records via
standalone patient launch. Generic product knowledge — **no person-specific or
hospital-specific values belong in any repo config**. The operator's
registered `clientId`s go into their deployment's settings copy
(`private.smartConnect.vendors.<vendor>.clientId`).

## The flow this feeds

1. Hydrate endpoint directories (Server Configuration → Lantern: Lantern CSV,
   **Fetch Epic Endpoints**, **Fetch Cerner Endpoints**).
2. Find the hospital at `/lantern`, run its **conformance probe** (the spider
   grades `patientLaunchable`).
3. `/patient-fetch` → **Connect to your hospital** → sign in at the vendor
   portal (MyChart etc.) → authorized pull lands in local collections with
   `meta.source: urn:honeycomb:smart-fetch:<fhirBase>` lineage.

Tokens are **ephemeral** (in-memory only, discarded after the pull). No
refresh tokens are requested in v1 — re-authenticate to sync again.

## Redirect URIs (register BOTH with every vendor)

| Deployment shape | Redirect URI |
|---|---|
| Hosted web app | `https://orbital.healthcare/connect/callback` |
| Electron desktop / local dev (embedded Meteor) | `http://localhost:3000/connect/callback` |

The Electron flow is RFC 8252 loopback: the app opens the vendor login in the
system browser; the vendor redirects to the localhost callback served by the
embedded Meteor server. No custom URL scheme is needed.

## Epic (fhir.epic.com)

- **Create App** → Application Audience: **Patients**.
- **Automatic Client Distribution: USCDI v3** — NOT "CMS Patient Access API"
  (that option distributes to Epic's *payer-platform* customers, not
  hospitals). USCDI v3 = no-human-review auto-download to every qualifying
  Epic health system, typically ≤12h after marking ready for production.
- **Scopes**: `openid fhirUser launch/patient patient/*.read` (SMART v1
  wildcard — Epic grants all approved resource scopes under it).
- **Do NOT request `offline_access`** — forbidden on the USCDI auto-download
  path (refresh tokens require uploading client credentials per Epic
  customer). Design consequence: pulls happen within one authorized session.
- Public client: leave **Is Confidential Client** unchecked; PKCE S256 is
  required and our launch always sends it. No dynamic client registration.
- Public Documentation URL: `https://orbital.healthcare`.
- Two client_ids are issued (non-production + production). Sandbox testing:
  the R4 sandbox with Epic's published test patients (e.g. Camila Lopez).
- Endpoint discovery: Epic publishes all customer service-base URLs at
  `https://open.epic.com/Endpoints/R4` (FHIR Bundle with
  `Accept: application/fhir+json`; 479 endpoints as of 2026-07). The
  **Fetch Epic Endpoints** button hydrates these.

## Oracle Health / Cerner (code-console.cerner.com)

- Patient app, **public client** (no secret), **PKCE S256 mandatory**.
- Per-tenant FHIR bases: `https://fhir-myrecord.cerner.com/r4/<tenant-id>/`.
  Directory: the `oracle-samples/ignite-endpoints` GitHub Bundle
  (`millennium_patient_r4_endpoints.json`, ~1,300 orgs) — the **Fetch Cerner
  Endpoints** button hydrates these.
- **Wildcard scopes are NOT honored** — select explicit `patient/<R>.rs`
  scopes (SMART v2 read+search suffix) for the USCDI resource list. Our
  default scope string carries ~25 resources and is **intersected at connect
  time with the tenant's advertised `scopes_supported`**
  (`intersectWithSupported: true` in settings) so we never over-ask.
- Request `online_access` (session-bound), not `offline_access` (separate
  approval; requesting it unapproved fails the whole authorization).
- `openid fhirUser launch/patient` are granted by default on patient apps.
- Sandbox: the ignite sandbox tenant with Cerner's published test patients.

## Vendor quirk notes for LATER connectors (not yet implemented)

- **athenahealth**: wildcard fails their Okta policy — enumerate explicit V1
  `.read` scopes; V1 has NO patient-scoped Medication *search* (`GET
  /Medication?patient=` 403s) — med lists need V2 `patient/MedicationRequest.rs`
  + `MedicationStatement.rs` + `MedicationDispense.rs`; `offline_access` is
  gated by a separate Okta authorization-server policy and fails the entire
  auth with `access_denied` if not pre-approved. Human review, 1–4 weeks.
- **NextGen**: two product lines (Office = R3/R4 + SMART; Enterprise = DSTU2 +
  R4); register against both DSTU2 and R4. Self-service portal.
- **ModMed**: per-practice fhir_base; explicit `.rs` list (23 resources
  typical), `online_access`, no `fhirUser` unless approved.

## Where the values go

```jsonc
// settings (e.g. extensions/desktop-chronicle/settings/settings.chronicle.json)
"private": {
  "smartConnect": {
    "enabled": true,
    "redirectUri": "http://localhost:3000/connect/callback",  // or the hosted URI
    "vendors": {
      "epic":          { "clientId": "<from fhir.epic.com>", "scopes": "openid fhirUser launch/patient patient/*.read" },
      "oracle-cerner": { "clientId": "<from code-console>",  "scopes": "<explicit .rs list>", "intersectWithSupported": true }
    }
  }
}
```

## Related

- `server/connect/methods.js` — launch begin/complete (PKCE, state, ephemeral vault)
- `imports/lib/EndpointConformanceProbe.js` — the spider probe that grades `patientLaunchable`
- `npmPackages/pacio-core/server/methods/fetchPatientEverything.js` — $everything + USCDI-sweep fallback
- `npmPackages/pacio-core/lib/uscdiQueryManifest.js` — the per-resource manifest (health-skillz shape, MIT)
- fable ledger: `2026-07-01-patient-records-connect.md`, `2026-07-01-endpoint-conformance-spider.md`
