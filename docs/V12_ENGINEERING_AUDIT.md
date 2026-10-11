# AeroForge v1.2 — Engineering Audit, Trust Boundaries & Product Priorities

## Executive finding

AeroForge has high breadth (mission presets, interactive Three.js, assembly stories, multiple reference screening engines, evidence-backed qualification screens), but low **integration depth** between manufacturer parts, registered mechanical geometry, exact wiring and actual operations. A large number of unit tests is valuable, but is not proof that the web app is usable on phones, that source CAD meshes fit, or that anything is safe to fly.

**Primary product objective:** create a coherent revision-specific workflow from mission -> actual SKUs -> certified source artifacts -> dimensioned fit -> build steps -> independent evidence -> simulation -> controlled review. The platform must not invent missing values or silently promote provisional evidence.

## Audit scorecard and concrete gaps

| Area | Strength | Remaining gap | Severity |
| --- | --- | --- | --- |
| Mission design | Six varied use cases; 40 module classes; guarded, quad, hex, VTOL topologies | Component classes are not SKU/revision-specific and are not priced or physically checked | P1 |
| Visuals | Selectable exploded assemblies and 3D mission-specific procedural models | Procedural geometry does not follow measured real CAD assemblies; no accurate mounting/clearance or manufacturing detail | P0 |
| Engineering reference | Source Two, X500 and PX4/FPV tracks document source requirements | Duplicated schemas and different source identities; no canonical cross-track part registry | P0 |
| CAD | Local file SHA-256, optional CadQuery solid inventory and XY/AABB screening | X500 source STEP was not downloaded and registered; no component transforms, exact motor shafts or mesh-level collision | P0 |
| Flight physics | Synthetic sensitivity models and a generic PX4 SITL handoff are explicitly differentiated | No measured full-aircraft mass, CG, inertia, thrust/torque curves, simulator calibration or real flight logs | P0 |
| Assembly | Branching FPV/PX4 worklists, part focus, revision-scoped notes | v0.8 stage graph remains quad-oriented and separate from hex/VTOL v1.0 worklists | P1 |
| Source provenance | Candidate source hashes and hold states | Imported hash claim and local-file digest had identical UI treatment, plus stale result exports | P0 (addressed in v1.2) |
| Session reliability | Locally stored notes and per-step dependency keys | One key for all sessions previously lost convenient historical retrieval | P1 (addressed in v1.2) |
| Discoverability | Rich app with many sections | Users could not easily navigate between 3D, assembly, mission and evidence views | P1 (improved in v1.2) |
| Tests | Good deterministic unit tests and smoke tests | No end-to-end desktop/mobile Playwright test, full GLB import test, performance budgets or hardware commissioning test | P0 |
| Catalog realism | Clear illustrative catalog with performance sensitivity | Nominal prices, runtime and thrust can be mistaken for actual purchasable/qualified design metrics | P0 presentation (improved in v1.2) |
| Delivery | Static browser app, no mandatory backend | Three.js is currently CDN-loaded and proper offline caching, link rot monitoring and data privacy review are incomplete | P2 |

### Highest-risk incident fixed: stale inspection exports

Before v1.2, modifying an entered rotor coordinate, minimum gap or source label after clicking Screen left a previously computed `evaluation` object exportable. That mismatch could create an attractive but misleading inspection record.

`core/review_v12.mjs` now binds exact strict-normalized inspected inputs to a revision and rejects export if the current form differs. The browser invalidates results for any edit and disables export controls until reinspection. Rechecking the canonical form at export protects against missed browser input events.

File evidence distinguishes `NO_HASH`, `LOCAL_BYTES_HASHED_UNAUTHENTICATED`, and `IMPORTED_HASH_CLAIM_UNVERIFIED`. Imported hash claims never become local-file proof. Local hashing is deliberately canceled if filename/source identity changes mid-digest. No digest from this app authenticates a manufacturer source.

### Assembly revision and recovery improvements

`core/workspace_v12.mjs` stores up to 12 exact plan-identity sessions rather than overwriting a single shared session. It preserves the prior design when a user swaps hardware, then reopens that exact revision's old session if revisited. The archive never silently drops oldest sessions: hitting the cap requires an explicit export/clear operation.

New controls export the full local session archive and clear the entire archive only with an explicit confirmation. Existing v0.8 local data can migrate when the selected plan matches. A corrupted current archive triggers an attempted local backup before creating a clean archive. **This is not a remote backed-up database**, and clearing browser storage may still erase progress.

### Navigation and metric honesty improvements

A persistent workflow shortcut bar now links mission design, 3D showcase, real reference studies, assembly, qualification and CAD inspection. The older nominal metrics are labeled **ILLUSTRATIVE**. They remain useful for rough tradeoff visualization, but are not measured values, confidence bounds, quotes or performance certification.

## Work deliberately not represented as complete

- The v1.0 procedural aircraft scene and v1.1 physical dimensional inspector still use **different geometry representations**; no automatic source-registered model swap exists.
- No verified Holybro STEP transform, rotor motor shaft centers, screw/clearance study or supplier-specific assembly packet has been produced.
- No qualified power harness or pin-to-pin electrical connector catalog is available.
- Source Two manufacturer 2D DXF references must retain license/source notices and never be casually re-hosted; original manufacturers' STEP licenses must be checked before redistribution.
- No actual PX4/Gazebo custom drone dynamics have been generated and calibrated.
- Browser interaction, layout, keyboard accessibility, reduced motion and 3D WebGL fallback need manual and automated end-to-end review.

## Roadmap: evidence-driven tranches

### v1.3: One complete manufacturer mechanical vertical slice

**Target:** Holybro X500 V2 frame and motor. Download source STEP locally, confirm license and SHA-256, parse with CadQuery, check source units and physical reference dimensions, identify actual solids and motor axes, create registered and exportable GLB meshes with reversible axis conversion. Show both an assembled CAD view and a component-aware exploded tour. No use of synthetic dimensions to fill unknown facts.

**Acceptance:** one exact source revision, documented model matrix, auditable parts/sha references, one independently checked physical measurement, deterministic scene/geometry comparison and at least one real imported fit assessment.

### v1.4: Canonical product and electrical-connection graph

Link mission module IDs, manufacturer SKU/revision, frame datums, connectors, wires, power rails, firmware/actuator interfaces and source pages through one versioned registry. Generate evidence-gated BOM and assembly tasks. Fail unknown connector mates rather than suggesting a wire and trusting it.

**Acceptance:** swapping FC/power module invalidates affected geometry, pinouts and testing records without changing unrelated records; export can replay exact revision identity.

### v1.5: Real browser + simulation QA

Add Playwright smoke coverage at desktop and 390px mobile, run through all critical paths (choose mission, change optional module, inspect scene, record note, export/import dimensions, stale-input rejection). Add offscreen/WebGL fallback QA, accessibility and performance budget baselines. Build reproducible generic PX4 SITL baseline separately from a calibrated target-airframe model.

**Acceptance:** measurable page load/interaction budgets, screenshot/trace artifacts on failure and explicit PASS/BLOCKED calibration results. Playwright's official GitHub Actions CI guide: https://playwright.dev/docs/ci

### v2.0: Guided build release candidate

From one versioned real-aircraft assembly, produce an actual procure-ready BOM only when inventory/stock, CAD and critical electrical compatibility checks have sufficient evidence; even procurement readiness cannot imply a person may safely energize or fly the aircraft. Add independently reviewed assembly receipts and optional evidence attachments. Extend only after the first reference works end to end.

## Product principle

**Do not multiply incomplete drone variants.** Complete one reliable reference aircraft all the way through documented geometry, compatibility, tutorials, purchasing guidance, independently reviewed build checks and calibrated simulation. Then use that system as the repeatable template for the more inventive everyday drone concepts.

## External engineering references

- Official Holybro STEP downloads: https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download
- PX4 actuator geometry, CG, FRD and output mapping: https://docs.px4.io/main/en/config/actuators
- Playwright GitHub CI and test reports: https://playwright.dev/docs/ci
- FAA commercial operators: https://www.faa.gov/uas/commercial_operators

## Validation categories

Node contract tests are **software contract tests**, not manual browser review. Python geometry smoke tests are primarily synthetic. No physical aircraft or manufacturer's STEP has been validated in CI at the time of this audit.
