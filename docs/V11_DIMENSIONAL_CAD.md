# AeroForge v1.1 — Dimensional CAD Evidence & Geometric Inspection

## What is new

Section 16 adds a measured-input, manufacturer-reference-aware geometry register for the X500 V2. It **does not** download or parse manufacturer STEP in the browser. Users select a local file to hash its exact bytes with Web Crypto SHA-256; no file data is uploaded. The official Holybro download page documents:

- `x500v2-frame.step` (manufacturer lists 23 MB)
- `AIR2216II_Motor_3D.STEP` (manufacturer lists 772 KB)

See: https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download

These files were **not downloaded, hashed or inspected in this release**. The source ledger stores download-page URLs, original filenames, and `fileHash:null` until a user explicitly registers their local copy. Matching a hash only preserves data identity; it does not establish manufacturer authenticity, a trusted revision, calibration or completed assembly registration.

## Measured geometry input protocol

`core/dimensional_v11.mjs` validates an explicit `aeroforge/dimensional-inspection/v1.1` schema. All supplied coordinates use **body FRD** (+X forward, +Y right, +Z down), millimetres, relative to a documented **user datum** rather than a presumed vehicle center of gravity.

Required: rotor IDs, XYZ center locations, measured propeller diameters, minimum projected XY gap. Optional: component bounding boxes with XYZ center, axis-aligned dimensions, measured mass. Input remains `USER_MEASURED_UNREVIEWED` or, if the explicit demo is loaded, `SYNTHETIC_DEMO`.

No measurement is prefilled for real X500 rotors. Do **not** infer exact rotor coordinates from the 500 mm nominal diagonal wheelbase or use synthetic demo numbers for real parts. The default example loaded by the demo button is invented classroom geometry and is marked on screen and in every export.

## What the checks mean

- For rotor pair `i,j`, the XY projected propeller disk edge gap is `hypot(Xi-Xj, Yi-Yj) - (Di+Dj)/2`.
- Report `CONFLICT` if the gap falls below the user-specified clearance requirement. Differences in rotor height Z are **intentionally not used to waive** an XY conservative conflict.
- Check each axis-aligned component bounding box for contact/overlap against every other box. Overlap is `INTERFERENCE_CANDIDATE`, not automatically a physical violation: manufactured assemblies often have intentionally nested or mating parts.
- Check XY projected rotor disks versus every component AABB; the nearest XY box point gives a conservative gap. It ignores Z separation, assembly rotations, prop blade pitch, airflow and motor dynamic clearance.
- `SCREEN_CLEAR` means only that this one analytic screen found enough projected space. It is NOT a clearance certificate, prop suitability, physical assembly fit, thermal approval, rotor safety or flight authority.
- Compute weighted mass subtotal and weighted centroid **only of the components whose masses were supplied**. This excludes all unreported motors, wiring, mounts, battery, fasteners etc. It is never total aircraft mass or qualified aircraft CG, even if all listed component masses are filled.

## Why PX4 export remains blocked

PX4 defines actuator motor XYZ positions in **metres**, in the FRD coordinate system **relative to aircraft CG** (the actual CG can differ from the FC location and the CAD origin). Its actuator setup separately handles spin directions and physical output mapping. This first inspection stores only user-datum values and exports `px4MotorPositionMeters:null` until the actual whole-aircraft CG, transforms, source verification, rotor identity, spin signs and wiring/output mapping have independent evidence.

Reference: https://docs.px4.io/main/en/config/actuators

## Optional local STEP solid inventory

For a local STEP CAD file, run in an isolated Python environment with **separately installed CadQuery/OCP**:

```bash
.venv/bin/python -m pip install cadquery
.venv/bin/python tools/step_cad_inventory_v11.py ~/Downloads/x500v2-frame.step \
  --source-url https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download \
  --out x500v2-frame.inventory.v11.json
```

The script hashes bytes and lists CadQuery imported solid shapes with raw CAD-kernel axis-aligned bounding boxes and centers. It **cannot** auto-identify or register motors or determine if a solid is a source assembly, fastener, or duplicate. Unit conversion, axes, assembly transforms, vendor identity, applicable licenses and motor shaft locations must be manually audited against drawings. Consequently the inventory JSON does **not** automatically populate or qualify the browser's rotor coordinates. The optional CadQuery dependency is not installed by `npm run setup:cad` and its real STEP import is not exercised by CI.

## Test coverage

`npm test` includes synthetic rotor disk separation, height-independent collision flags, component overlaps, rotors vs payloads, strict input/schema limits, source hash checks, known-component mass subtotal, blocked PX4 handoff, export and DOM references. `npm run test:cad` covers the existing synthetic DXF/mesh broadphase tests plus new SHA-256 and STEP bounding-box utilities (without external CadQuery installed).

## Next engineering tranche

1. Download actual Holybro STEP locally, verify units, document hash/revision and compare overall geometry against manufacturer drawing dimensions.
2. Register motor and prop centers explicitly from actual source geometry and measured mounts, including common frame datum transforms and axis handedness.
3. Add imported per-component GLB to the v1.0 Three.js scene with fit-envelope overlays and source hash identity.
4. Verify CAD part-level intersections (not just AABB), measured CG/inertia, rotor actuator output mapping and physical balance.
5. Add independently reviewed physical measurements and reference traceability, making any qualification step revocable on part replacement.

**The release is research/engineering planning software. It grants no procurement release, battery authorization, operation, calibrated simulation, inspection or flight permission.**
