# AeroForge v0.8 · Evidence-first Drone Engineering & Assembly Workbench

## v0.7: Exploded Assembly Showcase

Section 13 adds an interactive exploded assembly and guided camera tour for every illustrative airframe preset. Each visually distinct rotor, motor, ESC, battery, flight stack, frame, camera and wiring group has selectable detail cards, subsystem filtering, speed/pause/step controls, camera easing and a 2D fallback if WebGL is missing. See [the technical guide](docs/V07_EXPLODED_SHOWCASE.md). The generated geometry is **schematic, not source-verified manufacturer CAD**, and is not a collision or flight certification.

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
