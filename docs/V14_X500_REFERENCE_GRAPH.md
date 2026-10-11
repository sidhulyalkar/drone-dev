# AeroForge v1.4: Canonical X500 Reference Graph

## Purpose

The original X500 manufacturer-kit qualification, 3D CAD visual importer, and PX4 assembly steps previously carried independent identifiers and unresolved hardware assumptions. v1.4 adds a revision-scoped **source-aware X500 reference graph** without inventing verified pinouts or real manufacturer revision numbers.

## Features

- `core/x500_record_v14.mjs` builds a versioned `aeroforge/x500-aircraft-record/v1.4` around the authoritative `core/kit_v06.mjs` manufacturer family screening. Canonical part families include frame, motors, ESC, props, PDB, GNSS, telemetry, Pixhawk flight controller and selected power module.
- Each part has a fixed reference family ID, quantity, manufacturer source URL, and explicit nulls for received SKU, hardware revision, CAD SHA, pin-level verification and physical fit.
- Typed functional edges cover controller-to-power, battery-to-PDB, PDB-to-ESC, ESC-to-motor, controller-to-actuators, GNSS and telemetry. **No pin numbers or wires are inferred.**
- 6C/analog PM02 V3 and 6X/digital PM02D are documented candidate pairings and remain `HOLD_PIN_LEVEL`. Cross-swapping either module hard-blocks the record. Non-4S battery selection blocks the v0.6 documented 4S ESC family screening.
- The Section 12 X500 view now renders this same revision graph, exports it, and identifies the engineering evidence invalidated by a controller/power or source-CAD change.
- If the user loads a matching locally SHA-checked X500 frame visual package in Section 17, the CAD digest can be associated with the **frame family**. Source bytes and glTF meshes remain unauthenticated to the manufacturer; the aircraft datum, rotor centers, fit and CG all remain unknown.
- Changing the selected X500 hardware variant updates the PX4 assembly-path variant when the PX4 pathway is currently active. The FPV pathway is never silently converted.

## Explicit boundaries

Despite family documentation, this is **not** an actual pin-to-pin wire harness, physically inspected received SKU, authenticated manufacturer revision, measured CAD aircraft, purchasable qualified BOM, valid simulator or flight approval.

Changing a part creates a typed evidence-impact list; it does not automatically recompute qualified physical clearances or certify downstream work. When actual vendor-matched revisions and transform measurements become available, they should be recorded in the canonical identity and propagated through scene, worklist and BOM.

Do not manually copy pinouts between Pixhawk 6C and 6X variants. Use the appropriate manufacturer wiring diagram and physical received board revision. The PX4 motor output and geometric positions must separately be verified.

## Next engineering steps

1. Download and inspect the actual X500 V2 STEP frame and motor, using v1.3's source-bound converter and exact byte hash.
2. Identify revision-specific part transforms and motor shaft datums, verify source units and axis mapping against independently measured dimensions.
3. Extend canonical slot records to exact received manufacturer SKUs, revision-specific connector end types, rated current/voltage and physically verified wiring diagrams.
4. Make the real 3D assembly scene and Assembly Copilot consume the same canonical source version, with dependency-scoped invalidation.
5. Keep Playwright browser QA and source-integrity regression tests as release blockers.

Sources: [Holybro X500 V2 documentation](https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2) and [PX4 actuator setup](https://docs.px4.io/main/en/config/actuators).
