# AeroForge v2.8 Draft · Source-Bound Hardware Research Studio

## New in v2.8: Original source files imported and visualized

The user supplied both original-named X500 V2 STEP files. Local CadQuery/OCP inspections found **244 frame solids** and **4 motor solids**. Source-byte fingerprints, CAD-native bounds, export timestamp caveats and bounded LOD results are documented in [v2.8 real STEP inspection](docs/V28_REAL_X500_STEP_INSPECTION.md). This is physical source geometry for a research viewer, not independently signed vendor provenance, qualified hole centers or flight hardware approval.

The local CAD mesher was tuned to a conservative full-assembly preview profile after the previous ultra-fine default exceeded the cap before converting all 244 solids. The display-only UI now supports all **24 right-handed signed axis mappings** and a separate selectable visual separation axis, explicitly needed because the uploaded motor source has its longest dimension on native X rather than native Z. The source-specific measurements appear only after exact source STEP and GLB hashes are matched.

## New in v2.7: Actual manufacturer STEP intake pathway

The official Holybro X500 V2 download page lists `x500v2-frame.step` and `AIR2216II_Motor_3D.STEP`. New local tooling (`tools/x500_source_intake_v27.py`) now validates the original files against deliberately recorded SHA-256 hashes, rejects invalid STEP envelopes, performs both CadQuery conversions in one fail-closed staging transaction, and emits a **paired source-intake receipt** alongside the hash-bound GLB manifests. The browser can optionally revalidate that receipt against both locally selected original STEPs and GLBs. Private source STEP files and generated CAD outputs are ignored by Git by default.

**Important:** the original manufacturer STEP files have not yet been downloaded or independently inspected during this development session. This is a production-oriented source ingestion implementation plus synthetic-fixture tests, **not** an assertion of manufacturer-authenticated geometry, measured mounting centers, redistribution rights, or fit approval. Follow the exact [genuine X500 CAD intake guide](docs/V27_GENUINE_X500_CAD_INTAKE.md).

## New in v2.4: Two-Source X500 Frame + Motor CAD Study

The Engineering workspace now supports separately verifying local frame and motor STEP originals with their converted GLB and manifest files, then proposing a user-annotated motor/frame transform and viewing both **real source-derived meshes** together. The motor placement is a hypothesis, and the broad-phase AABB check is not a physical interference test. The registration proposal is visible at the unresolved `frame-motor` checklist item without pretending its evidence is qualified. No manufacturer STEP bytes were fetched or redistributed for this code release. [v2.4 guide](docs/V24_X500_CAD_MATING.md).

## New in v2.3: Check-Level Engineering Evidence Matrix

Individual interface checks now expose evidence links to v2.2 observation records, independent-review notes, and configuration-stale history; user evidence never automatically closes any physical or safety hold. See [v2.3 specification](docs/V23_INTERFACE_EVIDENCE_MATRIX.md).

## v0.7: Exploded Assembly Showcase

Section 13 adds an interactive exploded assembly and guided camera tour for every illustrative airframe preset. Each visually distinct rotor, motor, ESC, battery, flight stack, frame, camera and wiring group has selectable detail cards, subsystem filtering, speed/pause/step controls, camera easing and a 2D fallback if WebGL is missing. See [the technical guide](docs/V07_EXPLODED_SHOWCASE.md). The generated geometry is **schematic, not source-verified manufacturer CAD**, and is not a collision or flight certification.

## New in v2.2: Physical Evidence Journal

The X500 Engineering workspace now includes a compact **Physical evidence journal**. Record delivered-part labels, dimensions, connector observations and source-specific CAD mating hypotheses against the current aircraft selection, with dates, observer details and optional locally SHA-256-hashed attachment receipts. An independent second observer can record a review note; editing the X500 controller or battery-series selection marks prior evidence stale rather than carrying it forward silently.

Journal storage is browser-tab-only by default, with explicit save/restore/delete of a local device copy and JSON export/import. An event checksum detects accidental edits but is not cryptographic provenance. The X500 aircraft record includes an evidence **summary** while its original physical compatibility and flight approval flags remain false.

All physical inspection/review entries are **self-reported**. This release does not inspect actual Holybro hardware, authorize wiring/bench power, or validate mechanical fit. See [v2.2 Inspection Journal](docs/V22_INSPECTION_JOURNAL.md).
## New in v2.1: Source-Linked X500 Part Interface Audit

Engineering → X500 Hardware includes a collapsed **Hardware interfaces** inspector. It maps published Holybro motor, ESC, PDB, frame and power-module product option identities to typed electrical or mechanical interface families, with explicit unknown connector gender, pinout, polarity, received revisions and physical fit. The documented 6C/PM02 V3 analog vs 6X/PM02D I2C families remain separate. Off-series batteries and mismatched power-module families are not silently accepted.

Selected procedural FPV components in Build can jump to the related **X500 manufacturer research category**, without applying those SKUs to the FPV design. Open electrical/mechanical holds and source links are available on demand. You can export a source-dated research packet, not a purchasable or qualified BOM.

Matching MR30 or XT30 connector family claims do **not** prove a safe physical mating. The actual Holybro STEP assets, received hardware revisions, electrical pinouts, motor mounting, battery protection and flight readiness remain unverified. See [v2.1 Hardware Interface Research](docs/V21_X500_INTERFACE_RESEARCH.md).
## New in v2.0: Source-Aware SKU Research

The X500 Engineering workspace now has a compact, collapsed-by-default **Source catalog**. It records six exact manufacturer SKU identities: four Holybro X500 V2 kit controller/radio variants, the X500 V2 frame-kit SKU, and a SpeedyBee F405 V4 stack that the manufacturer lists as discontinued. Compare options and follow their official specification pages, review revision-specific unresolved interfaces, and export a dated research-only evidence packet.

A compatible published X500 kit SKU can be linked as a **research reference** to the canonical aircraft record. Mismatched controller family and unsupported battery cell selection prevent linking. Changing an already-linked variant invalidates that link. No listed price is live, and no procurement, fit, wiring, or flight authority is granted by a SKU match.

See [v2.0 Source SKU Catalog](docs/V20_SOURCE_SKU_CATALOG.md).
## New in v1.9: One Contextual Component Inspector

Selecting a procedural part in the Build 3D viewer now opens a compact class-level inspector with current specifications, candidate alternatives re-screened through the full design engine, available source-backed research candidates, and **exact current-revision Assembly Copilot steps**. The detailed part browser and extra material are collapsed by default. Changing a catalog candidate updates the active aircraft and recalculates compatibility blockers without losing the part focus.

**Everything remains an illustrative catalog class until revision-specific vendor evidence is independently checked.** Candidate source pages are not qualified buy links, zero simulated blockers does not establish real fit, and assembly notes cannot grant power or flight authority. CAD solids remain in their own source-unregistered evidence mode.

See [v1.9 Contextual Component Inspector](docs/V19_COMPONENT_INSPECTOR.md).
## New in v1.8: Unified Build Viewer

The Build workspace now uses **one primary Three.js canvas** with Aircraft, Exploded, and Local CAD modes. The first two modes retain the existing procedural aircraft and guided assembly tour. Local CAD becomes available only after a matching GLB and manifest are verified in the Engineering CAD tool; Build independently rechecks the GLB hash, then shows the source-derived **unregistered** solids in its existing scene. Changing or resetting source data invalidates the CAD view. Hidden viewers skip WebGL drawing without destroying controls or revision history.

The source-space metrology viewer stays in Engineering, because its CAD point-picking and coordinate inspection are specialized tools. The app does not claim that source CAD and schematic geometry share an aircraft datum or verified physical fit. See [v1.8 3D Viewport Guide](docs/V18_UNIFIED_VIEWPORT.md).
## New in v1.7: Three Minimal Workspaces

AeroForge now opens in **Explore**, with a small set of controls and an aircraft viewer. Primary workspaces: **Explore** (mission, presets, configurator), **Build** (exploded tour and assembly), and **Engineering** (source evidence, qualification, PX4, X500, dimensional and CAD labs). Detailed component settings, planner options and flight metrics are expandable; any blocking compatibility findings remain visible. No tools or aircraft records have been removed.

Old deep links and all tools remain available in the compact **All tools** menu. Inactive sections are hidden, not recreated, so switching workspaces preserves CAD inputs, assembly notes and scene identities. Duplicate v1.6 script/style imports are removed.

See [v1.7 Minimal Workspace Design](docs/V17_MINIMAL_WORKSPACE.md). The release is a software/UI change, not evidence of physical fit or flight qualification.
## New in v1.6: Source-Bound CAD Feature Measurements

Section 19 adds **direct surface-point picking on locally hash-checked X500 CAD**, a non-WebGL coordinate entry fallback, and a 3D circular-feature fit with residual checks. It distinguishes clicked mesh-surface points from user-typed coordinates. You can explicitly attach a numerically plausible circular-feature center to a motor candidate in Section 18 without losing the exact STEP/GLB source identity. High-residual fits are blocked, and editing any source or annotation invalidates old evidence.

This does **not** prove that an inspected circular feature is the motor shaft center, identify real parts, register the aircraft CG, authenticate manufacturer bytes or approve construction/flight. See [v1.6 CAD Feature Evidence](docs/V16_CAD_FEATURE_EVIDENCE.md).

## New in v1.5: Source CAD Motor-Datum Registration

Section 18 adds a source-identity-bound annotation workflow for the X500 V2 STEP: user-selected CAD→FRD axis mapping, source kernel datum, **four human-observed** motor centers, rotor disk screening, transparent nominal 500 mm wheelbase comparisons, and selectable marker overlays on the local source-derived 3D scene. Signed-axis conversion refuses reflections; editing a record or replacing the CAD invalidates its results. The unverified coordinates link to the X500 hardware identity and can be copied to Section 16 for a **new review-gated** clearance screen.

**No Holybro STEP geometry was downloaded or independently measured for this release.** A local STEP hash is not manufacturer authentication. Manual source-space markers are not CG-relative PX4 motor positions or verified aircraft fit. See [v1.5 CAD Registration Bridge](docs/V15_CAD_REGISTRATION.md).

## New in v1.4: Canonical Hardware Reference

The X500 hardware lab (Section 12) now renders a canonical source-aware component record with **part-family identities and a typed connection/compatibility graph**. It preserves incompatible 6C/PM02D and 6X/PM02V3 family blocks, labels matching families as still needing pin-level inspection, and exports a revision-scoped source record. Locally hash-checked X500 V2 frame CAD from Section 17 may be linked to that frame record, but **never becomes source-authenticated or physically qualified**. When the kit variant changes, the PX4 Assembly Copilot selection tracks the variant.

No pinouts, real rotor geometry, independently inspected hardware revisions or power/flight authority are inferred. See [v1.4 X500 Reference Graph](docs/V14_X500_REFERENCE_GRAPH.md).

## New in v1.3: Source-linked Local CAD Packages

Section 17 now previews locally converted STEP geometry with hash-verified **GLB plus manifest** and optional original STEP byte matching, individual solid selection, orbit, zoom and exploded views. The new local `tools/cad_visual_package_v13.py` fails closed on source SHA-256 mismatches, requires revision and licensing notes, and creates an unqualified visual source manifest. The browser rejects mismatched/malformed GLB bytes and external model dependencies.

No manufacturer STEP assets or CAD-derived meshes were bundled, downloaded, authenticated, axis-registered or physically qualified. The preview cannot grant CAD fit, PX4, power or flight authorization. See [v1.3 CAD visual package guide](docs/V13_CAD_VISUAL_PACKAGE.md).

## New in v1.2: Reliability & Engineering Audit

The [v1.2 independent engineering audit](docs/V12_ENGINEERING_AUDIT.md) ranks AeroForge's current gaps and lays out measurable v1.3–v2.0 milestones. This release implements risk-focused improvements rather than adding more unverified drone variants:

- **Snapshot-bound CAD inspections:** editing any inspected rotor, envelope, source identity or clearance field invalidates the old screen. Exports compare the exact normalized form to its inspected snapshot and reject stale results, including when browser events are missed.
- **File hash provenance:** separate file bytes SHA-256 computed locally from unverified imported hash claims. Neither authenticates manufacturer origin or qualifies real CAD. Reopening v1.1 evaluation or v1.2 review JSON treats the stored hash only as an imported claim.
- **Multi-revision assembly workspaces:** notes are keyed to the full design/step identity. Switching builds preserves prior revisions rather than overwriting the current session. Archived sessions can be exported all at once; hitting the 12-revision limit fails closed rather than discarding older work.
- **Product navigation:** sticky workflow shortcuts to Design, 3D Showcase, Missions, Assembly, Hardware, PX4 and CAD Inspector.
- **Honest metrics:** synthetic mass, endurance, thrust and cost are visibly labeled illustrative.

No new manufacturer CAD was imported, and no hardware safety, regulatory, physical fit or flight qualification has been performed. Tests are software/geometry smoke tests, not full Playwright browser QA.

## New in v1.1: Dimensional CAD Evidence & Conservative Collision Screens

**Section 16** lets you locally register a manufacturer CAD file SHA-256 (without uploading its bytes), enter actual BODY-FRD millimetre rotor coordinates, measured propeller diameters and component AABBs, and screen conservative projected rotor-disk and bounding-volume interferences. It exports a geometry/measurement report and a **blocked PX4 FRD-CG geometry handoff**; no motor coordinates are guessed from the X500's nominal 500mm wheelbase.

An explicitly marked classroom example illustrates the process. It is **not** Holybro CAD. A separate optional local STEP solid-inventory CLI uses CadQuery for unregistered kernel bounding boxes, requiring manual verification of units and axes. Neither tool authenticates vendor file origin or qualifies real physical fit. See [v1.1 Dimensional CAD Evidence](docs/V11_DIMENSIONAL_CAD.md).

## New in v1.0: Interactive 3D Mission Systems

**Section 15** now contains an interactive Three.js aircraft layout and part inspector for guarded quads, quads, hexacopters and a conceptual VTOL (quadplane-style lift/pusher hypothesis). Change the mission or optional modules to refresh the scene, separate components, inspect individual mount proposals and export a structured mission-specific assembly worklist. Every visualization is **dimensionless and schematic, not CAD**, and every electrical/physical value requiring a source remains `null`.

Mount slots are illustrative, not evidence of compatibility. The separate v1.0 mission handoff does not promote hex/VTOL missions into the quad-only v0.8 Assembly Copilot. See [v1.0 3D Mission Systems](docs/V10_3D_MISSION_SYSTEMS.md).

## New in v0.9: Everyday Mission Architecture Studio

**Section 15** introduces 40 reusable component classes and six custom scenario concepts: controlled indoor inventory, solar/roof inspection, exploratory community air quality, garden vegetation mapping, accessible trail surveying, and habitat restoration via VTOL. Users can choose optional modules, inspect schematics, compare architectures and export JSON/Markdown concept briefs.

**These are concept architectures, not vendor-qualified builds.** Optional modules are not installed into the existing v0.7 illustration or v0.8 assembly plan, and all CAD, electrical, autonomy, sensor performance, flight and cost qualifications remain open. Details: [v0.9 Mission Architectures](docs/V09_MISSION_ARCHITECTURES.md).

## New in v0.8: interactive Assembly Copilot

**Section 14** delivers conditional FPV / Betaflight and X500 V2 / PX4 assembly plans, relevant exploded-view part focus, sourced original-video/manual links, revision-scoped notes and measurements, prerequisite displays, and locally persisted printable/JSON work records. The UI preserves unaffected observations when a component changes, while archiving potentially stale records as invalidated.

**Safety-critical checks do not become verified by recording a note.** The procedural 3D view is illustrative rather than imported, measured CAD; build sessions are not authority to energize or fly hardware. See [v0.8 Assembly Copilot](docs/V08_ASSEMBLY_COPILOT.md) and the [original course-research proposal](docs/V08_ASSEMBLY_COPILOT_RESEARCH.md).

## v0.6: Holybro X500 V2 hardware qualification

Section 12 includes a manufacturer-evidenced kit variant checker (Pixhawk 6C + analog PM02 V3 versus Pixhawk 6X + digital PM02D), 4S ESC limits, source-annotated hold/fail states and exported assembly/SITL handoffs. Read [the X500 qualification guide](docs/V06_X500_KIT.md). Generic PX4 Gazebo x500 is an external simulation baseline and **not** a calibrated Holybro digital twin. No physical flight authority is implied.

A browser-based platform for designing, comparing and screening DIY quadcopters. Inspired by the [Worcester Longboard platform](https://github.com/sidhulyalkar/worcester-longboard), built as an **independent, open-source MIT-licensed codebase**.

**This is a component-planning and visualization prototype with a separate source-backed engineering reference study, NOT a tested drone, a calibrated flight simulation, or a source-verified shopping cart.** The example catalog uses illustrative reference classes and **all quoted costs, thrust and flight durations are unverified assumptions**. No generated configuration is certified, flight-ready or authorized for operation.

## Launch

Requirements: a modern browser and Python 3. (Node 20+ only for tests.)

```sh
cd drone-dev
python3 -m http.server 8080
```

Open <http://localhost:8080>. A macOS `start-mac.command` launcher is provided. The **3D viewer** loads Three.js `0.169.0` from jsDelivr (online connection required). The rest of the app works offline with its SVG top-view fallback. Do not open the HTML via `file://` because browsers may block ES modules.

```sh
npm test         # engineering unit and contract tests, no dependencies
```


## macOS / Homebrew Python: local CAD dependencies

Homebrew Python blocks global pip installs (`externally-managed-environment`, PEP 668). Do not use `--break-system-packages`. The local `.venv/` is ignored by Git.

```sh
npm run setup:cad   # Creates .venv and installs pinned smoke-test dependencies
npm run test:cad    # Uses .venv Python automatically when available
```

Manual alternative:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-cad.txt
npm run test:cad
```

The smoke tests require `ezdxf`, `trimesh`, and `numpy` as pinned in `requirements-cad.txt`. Full STEP-to-GLB conversion needs additional optional CAD libraries and is not covered by `setup:cad`.

## New in v0.5: separated PX4 autonomy and FPV research tracks

**Section 11 / PX4 Program Lab** adds an Atlas PX4 Explorer research architecture, Source Two as a distinct FPV benchmark, mission/budget/payload requirement screening, six blocked engineering milestones, a source-evidence ledger contract, a strict calibration audit, a synthetic 1D flight-dynamics playground, and revision-aware JSON exports. The synthetic experiment does not use PX4, Gazebo, real measurements or a calibrated flight controller. No target is flight qualified. Start with [v0.5 PX4 Program](docs/V05_PX4_PROGRAM.md).

## New in v0.3: evidence-aware real hardware workflow

The original six hypothetical airframe families and v0.2 mission/configuration workbench remain intact. A new **Reference Lab (section 09)** is a separate, source-backed hardware path using **TBS Source Two v0.1** frame, **T-Motor Velox V2207 V2 1750KV** motors, **T5143S** propellers, and an explicitly **discontinued SpeedyBee F405 V5 stack research lead**. **This is not yet a complete procurement-ready or flight-ready build.**

- Manufacturer facts with per-field provenance (frame geometry/mass, motor bench thrust/current, stack ratings and availability). Exact sources in `sources/reference_sources.v0.3.json`.
- Honest rotor-envelope top view using a *changeable symmetric X proxy* for motor centers, not mislabeled as the original Source Two stretched-X CAD.
- Mechanical / voltage / prop spacing screening, with stable unresolved `HOLD` items that cannot be cleared simply by marking a checkbox.
- User-attested reference measurements, a deterministic revision fingerprint, dimension-aware exports, a revision-specific assembly packet.
- Optional `tools/step_to_glb.py`: import your own upstream STEP, output GLB plus SHA-256 source/geometry provenance, then open GLB in the browser's 3D viewer. Only tested on a synthetic STEP fixture; upstream frame STEP not yet acquired.
- `simulationContract`: JSON handoff with missing mass properties, actuator coefficients, drag, rotor positions as `null`, **never** a fake executable PX4 SDF or invented hover-time model.
- 40 pure JS automated tests plus a synthetic STEP->GLB conversion smoke test. Browser end-to-end tests could not run in this environment because the browser blocks local navigation; mobile/desktop v0.3 visual QA is outstanding.

Start in [Reference Engineering v0.3](docs/REFERENCE_ENGINEERING_V03.md), [CAD Import](docs/CAD_IMPORT.md), and [Next Stage v0.4](docs/NEXT_STAGE_V04.md).

## Previously delivered in v0.2

1. **Mission designer**: describe flying mission, total startup budget, custom payload mass and optimization priority. A transparent, deterministic mission-fit scorer compares six architectures and presents three distinct ranked proposals. This is not a language model and cannot claim verified feasibility.
2. **Configurable ground equipment**: transmitter, video receiver/display, charger and bench supplies now have separate budget estimates. Airframe cost and startup cost are shown independently; a mismatched video ground kit yields a warning. Quoted prices are placeholders, not current quotes.
3. **Engineering sensitivity**: plot payload vs model duration, plus low/central/high estimates from published assumptions (efficiency and usable energy), not a confidence interval or flight-test guarantee.
4. **Actionable compatibility report**: mechanical, electrical, propulsion, evidence, operation and regulation findings include recommended next verification steps.
5. **Electrical architecture preview**: a topological diagram uses selected components and displays relevant power/fit blockers. This is *not* an actual wiring/pinout guide.
6. **Revision-specific validation checklist**: fifteen documented actions across sourcing, unpowered assembly, electrical, firmware and operating requirements. It is stored locally, bound to the exact design fingerprint; modifications show a distinct checklist.
7. **Candidate evidence trail**: research leads for actual commercial hardware, expressly separated from synthetic catalog components. A candidate can be discontinued or revision-incompatible. Vendor sources, facts and unresolved evidence are visible.
8. **Saved variations**: keep three design snapshots for a side-by-side comparison of takeoff mass, cost, approximate duration and blocker counts. Restore any saved variation.
9. **Data portability**: a strictly validated AeroForge `v0.2` JSON export/import, a CSV BOM with aircraft/ground separation, local storage for recent design and worklist. `v0.1` exports remain importable.
10. **Responsive browser app**: checked desktop (1440 px) and mobile (390 px) with functional input, ranking, comparison and checklist interactions. Mobile BOM scrolls horizontally inside its own section.

## Project structure

```text
core/catalog.mjs          Illustrative engineering component classes
core/engine.mjs           Pure screening, estimates, blockers and action findings
core/ground.mjs           Illustrative ground kit cost split
core/planner.mjs          Deterministic multi-candidate mission ranking
core/evidence.mjs         External research lead registry (not procurement approval)
core/checklist.mjs        Revision-scoped validation steps
core/portable.mjs         Validated design import/export, CSV, fingerprints
core/presets.mjs          Six reference architectures
app.mjs                   Product interactions and persistence
renderer.mjs              Procedural orbit / top / explode visualization
index.html, styles.css    Responsive interface
sources/                  Future real SKU/bench-test source manifests
core/reference_lab.mjs   Reference facts, source-dependent holds, rotor layout, simulation gates
engineering_view.mjs      Evidence-first interactive reference laboratory
reference_3d.mjs         Local GLB visualization (requires Three.js online)
tools/step_to_glb.py     Optional local STEP to GLB converter and provenance manifest
features planned          Full verified SKU catalog, CAD qualification, calibrated SITL, purchasing
```

## Critical boundaries

- **No manufacturer-specific validated BOMs**. E.g. the generic 'F405 55A stack' component is NOT the SpeedyBee V4 unit. The real SpeedyBee V4 is referenced as a research lead and was listed **discontinued** by its manufacturer at the time of review (2026-10-10). A TBS Source One V5 frame is likewise a separate possible frame candidate, not an automatic substitute for the generic Kestrel.
- **No calibrated aerodynamic performance**. Static thrust placeholders are not documented motor/prop curves. Hover-time estimates use actuator disk theory, assumed efficiency and empirical mission multipliers rather than tuned flight logs. Low/high scenarios vary assumptions, not statistical uncertainty.
- **No verified center of gravity, physical clearances or CAD**. The 3D twin is intentionally approximate. It must never be used for fabrication or motor/propeller clearance approval.
- **No electrical wiring instructions**. The architecture diagram intentionally omits pinouts and wire gauge: real plans must come from the exact manufacturer manuals, including connectors, fuse limits, BEC capacity, battery chemistry and protection.
- **No operating permission**. Satisfy applicable FAA TRUST, registration/Remote ID, controlled airspace authorization and local flight restrictions; weigh and independently inspect any real aircraft. See the [FAA recreational guidance](https://www.faa.gov/uas/recreational_flyers) and [registration/Remote ID guide](https://www.faa.gov/uas/getting_started/register_drone).

## Design calculation sketch

For total takeoff mass `m` (kg), prop radius `r` (meters), air density `ρ = 1.225 kg/m³`, four rotors:

```text
A = 4 π r²
P_ideal = (m g)^(3/2) / √(2 ρ A)
P_hover = P_ideal / η + video_W + 6 W
P_mission = P_hover × mission_multiplier
E_nominal_Wh = cells × 3.7 V × capacity_Ah
T_min = 60 × (E_nominal_Wh × usable_fraction) / P_mission
Thrust_ratio = (4 × illustrative_motor_max_thrust_g) / takeoff_mass_g
Adjacent rotor gap_mm = motor_diagonal_mm / √2 − prop_diameter_mm
```

Central `η = 0.42`, usable fraction `0.75`; lower scenario `η = 0.30`, fraction `0.65`; upper scenario `η = 0.55`, fraction `0.82`. None is calibrated to a particular motor or airframe. **Never use the duration calculation for an actual flight battery reserve.**

## Future integrations

- **CAD/geometry:** revision-specific STEP/GLB assemblies and verified interference geometry.
- **Flight simulation:** [PX4 SITL with Gazebo](https://docs.px4.io/main/en/simulation/) or ArduPilot SITL using real mass/inertia/prop data, with world and wind scenarios. There is currently *no* SITL runner in this package.
- **Hardware sourcing:** vendor products, specification PDFs, versioned fact extraction, retail links with pricing/stock checked on demand, non-interchangeability rules, and checkout handoffs.
- **Design optimizer:** multiple architectures, actual feasibility constraints, Pareto ranking and explainable design-tradeoff reports.

See `docs/ROADMAP.md` and `docs/EVIDENCE_PROTOCOL.md` for gated milestones, evidence contracts and acceptance tests.

## New in v0.4: engineering qualification console (section 10)

Version 0.4 adds a **separate source-locked qualification path** while preserving the original mission planner, six synthetic architectures and v0.3 Reference Lab. Go to **Section 10 / Engineering Qualification Console** after starting the local server.

**Implemented features**

- Real manufacturer Source Two main-plate 2D DXF-derived datum records, pinned to upstream Git blob SHA-1 and kept separate from the MIT app under the upstream GPL-3.0 file license. The 20 mm and 30.5 mm mounting circle positions are available in `data/source_two_dxf_datums.v0.4.json`.
- 16 typed interface checks across mechanical mounting, airframe geometry, ESC current/voltage, battery connectors, source availability, firmware provenance, rotor envelopes, mass, center of gravity, and calibration. **Documented screening passes do not imply flight approval.**
- Explicit comparison between discontinued SpeedyBee F405 V5 and an iFlight BLITZ F7/E55S retailer research lead listed out-of-stock at the time of checking. Neither is a qualified buy-ready design; manufacturer facts are not silently transferred between stacks.
- Conservative XY rotor sweep checker from four user-entered 3D center coordinates and separately entered propeller diameter; payload mass and offset sensitivity calculation. No source CAD assembly, mesh collision clearance, or inertia validation is claimed.
- SHA-256 content-locked design snapshots, source/revision-specific engineering inspection Markdown, and PX4/Gazebo handoff JSON whose missing calibrated coefficients and inertia explicitly remain `null`. Deterministic SHA-256 works both with native WebCrypto and the tested offline fallback.
- `tools/source_dxf_audit.py` for checking original DXF bytes and hole extraction after local download (requires `ezdxf`), plus `tools/cad_broadphase.py` for conservative axis-aligned overlapping volumes from registered GLB meshes (requires `trimesh`). Source STEP is **not** included, and these tools do **not** qualify assembly geometry or physical flight readiness.

See [`docs/V04_QUALIFICATION.md`](docs/V04_QUALIFICATION.md) for the full evidence contract, test status and remaining work. The original `docs/NEXT_STAGE_V04.md` remains a planning artifact documenting the original intended scope and is not a statement that every requirement has been completed.

Run tests:

```bash
npm test
npm run test:cad
```

**Historical v0.4 validation:** 55 JavaScript tests and 2 Python CAD-tool smoke tests passed. v0.5 tests are expanded; see current CI. Browser automation of the full locally hosted application was blocked by the environment's navigation policy; an *isolated inline-module test of the Section 10 console* passed at 1440px and 390px, including user input, SHA-256 fingerprint change, mismatch blockers and rotor clearance, without page errors or page-wide horizontal overflow. This is not an end-to-end browser pass of the original app.

**Known boundaries:** No actual Source Two STEP is bundled or registered; frame-assembled motor centers, physical stack clearance and fine mesh intersections remain unresolved. No viable currently stocked full aircraft BOM, measured test-flight data, true manufacturer wiring map, functional PX4 custom SDF or calibration tests exist. This is not a procurement, fabrication, power-on or flight release.
