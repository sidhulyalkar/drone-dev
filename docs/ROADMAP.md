# AeroForge development roadmap · 2026-10-10

## Delivery v0.2 · implemented locally

- [x] Six independent mission-reference architectures and 3D/2D visualization
- [x] Deterministic mission brief to three ranked candidates
- [x] Engineer-selected part swaps and obvious incompatibility blockers
- [x] Separate airframe / ground-system / all-in startup cost estimates
- [x] Payload-performance sensitivity and bounded assumption scenarios
- [x] Component/source evidence trail and blocker resolution actions
- [x] Power/control topology view (non-wiring schematic)
- [x] Design-scope checklists, 3 saved comparisons, portable JSON, CSV BOM
- [x] Browser interaction smoke test at 1440px desktop / 390px phone and Node unit tests
- [ ] Manufacturer-verified current product combinations
- [ ] Physical build and test qualification
- [ ] WebGL test against locally bundled Three.js (currently CDN-dependent)

## Tranche A: Sourced 5-inch reference build

**Goal:** transform one synthetic 5-inch Freestyle design into a revision-specific, source-backed *planning package*, with uncertainty retained. No fabrication or flight authorization.

- Pick up-to-date in-stock frame, prop, motor, FC/ESC, receiver, video system, battery and ground kit.
- Pull and archive manufacturer diagrams and test curves at an observed timestamp; pin revision and SKU.
- Introduce typed SKU objects with interface/mount, ratings, thermal constraints, mass/location, firmware target, RF/connector dependencies and provenance per field.
- Verify 30.5/20 mm holes, prop swept volumes, bottom fasteners, motor mounting and camera width against CAD/drawings.
- Derive an exact source-aware BOM with *current known price*, quote timestamp, shipping gaps and unavailable-item alternatives.
- Pass a source and measurement completeness matrix for 100% of critical purchased components.

**Acceptance:** no generic catalog class presented as verified, every numeric hardware claim source-cited, every unresolved interface surfaced as a gate, all assumed prices clearly separated from live quotes.

## Tranche B: Accurate 3D CAD assembly

- Ingest manufacturer STEP/STL files where licensed and build precise modular frame/fastener assemblies.
- Implement units, pivots, camera mount offsets, prop swept-volume collisions, battery/CG/inertia and editable payload brackets.
- 3D exploded assembly view reflects *actual parts*, not artistic parametric analogues.
- Browser mobile perf and accessibility audits.

**Acceptance:** geometry test fixtures detect intentional rotor/arm collisions and wrong motor-mount patterns; compare dimensions to reference CAD tolerances.

## Tranche C: Model calibration and SIL

- Capture voltage-varying motor/prop thrust-current tables and true flight logs, temperature and mass/CG measurements.
- Fit a low-order propulsion/energy model and report out-of-sample errors and uncertainties.
- Export model parameters to PX4 SITL/Gazebo with version-locked simulator and vehicle model.
- Build scenario tests for wind, battery sag, GPS loss, lost RF link and safe landing policy, keeping simulator results isolated from physical approval.

**Acceptance:** blinded withheld-flight validation beats a fixed baseline for current draw/endurance, failed actuator/link scenarios have documented outcomes, SIL configuration reproducible in CI.

## Tranche D: User-facing platform and agentic design

- Natural-language intent parser into validated typed mission constraints.
- Candidate-generation/optimization engine with actual hard constraints and Pareto fronts rather than static mission heuristics.
- Pairwise component swap impact with sourced alternatives, explainable why-compatibility and blockers.
- Collaborative design revision history, reproducible source receipts and purchasable BOMs.
- Visual assembly coach with proof-of-work, photos, measured evidence and explicit human approvals.

**Acceptance:** novice user can describe a mission, obtain three genuinely different documented designs, understand feasibility failures, choose parts and export an auditable revision-specific plan with no hidden assumptions.

## Suggested personal research platform

Start with a medium research quad, but first qualify the motor/prop/mass/energy/RF/electrical stack for a pilot-operable safe platform. Keep custom sensors/companion compute as a separately validated payload pod. Pursue onboard vision and autonomy in SITL before attempting on actual hardware. These cannot be reduced to a generic FPV freestyle build without re-evaluating payload mass, center of gravity, voltage, fail-safe and link budgets.
