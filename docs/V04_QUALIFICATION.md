# AeroForge v0.4 · Qualification graph and engineering release contract

## Implemented

- `core/qualification_v04.mjs`: exact part/revision identities and **16** explainable typed interface rules, source references, candidate-stack availability, 6S cross-rating checks, connector mismatches, required tests, stack firmware hold.
- `data/source_two_dxf_datums.v0.4.json`: individually identified manufacturer 2D DXF circles (source Git blob SHA-1), 20×20 and 30.5×30.5 mm hole patterns, GPL license provenance. **This is not a registered 3D assembly.** The main plate has two overlapping FC/ESC patterns and need not define motor shaft coordinates.
- `tools/source_dxf_audit.py`: recomputes Git blob hashes and checks circle observations from downloaded original DXF files. No claim of a DXF run in this environment, because the original DXF file bytes could not be saved to the working directory.
- `tools/cad_broadphase.py`: conservative mesh AABB candidate overlap inspector for user-provided registered meshes. **No fine-grain collision authority.**
- v0.4 Qualification Console: selectable reference stack vs researched but locally out-of-stock alternative, pack connector, measurement inputs, radar-like typed graph, revision-locked reports (SHA-256 of plan facts), and explicit evidence holds.

## Original design source

TBS / ps915 source_two: https://github.com/ps915/source_two
GPL-3.0 design files; do not mix them into the MIT application without preserving upstream licensing. Original DXFs were read through the connected GitHub source and hole positions extracted from CIRCLE entities. This text datum record is derived from that original frame design and explicitly carries separate GPL obligations.

A local owner may reproduce the DXF extraction:

```bash
python -m pip install ezdxf
python tools/source_dxf_audit.py --source-dir /downloaded/source_two --manifest data/source_two_dxf_datums.v0.4.json
```

The original upstream STEP `Source Two v0.1.step` is approximately 9.4MB and is not bundled in this package. To inspect true 3D solids, download it from the upstream repository with license intact; use `tools/step_to_glb.py` and, if registered meshes are available, `tools/cad_broadphase.py`. Conversion output remains preview-only until proper source identity, axes, transforms and registration are independently established.

## Notes on the flight stack

The original SpeedyBee F405 V5 listing is manufacturer-marked discontinued. A researched `iFlight BLITZ F7 / E55S` replacement has documented 30.5×30.5 mm holes, nominal 2–6S and 55A at the listed retailer but was shown **out of stock** there at research time, and its precise FC/ESC revision and pinout remain unqualified. Neither may be ordered through this model. Do not reuse the SpeedyBee pinout or PX4 firmware target for iFlight. An advertised Betaflight target cannot be treated as a validated PX4 SITL target.

## Acceptance: what a passing status means

- `PASS_DOCUMENTED`: published rating/pattern fact supports a numerical screen, but has **never** verified physical assembly.
- `PASS_PLAN_ONLY`: two user-entered values are logically compatible, with unverified source identity or physical inspection.
- `HOLD_*`: missing source, geometry, measured evidence, bench validation or calibration.
- `FAIL`/`FAIL_SOURCE`: concrete incompatibility or known unavailable/discontinued source.

No input combination transitions to flight-qualified. The application never generates an executable Gazebo SDF with invented motor constants. The PX4/Gazebo `x500` sample remains a **simulation reference only**, not a measured Source Two airframe (see https://docs.px4.io/v1.18/en/sim_gazebo_gz/).

## Next hard requirements for v0.5

1. Import original v0.1 STEP and reconcile coordinate transforms with DXF; annotate motor shaft xyz and frame physical datum planes.
2. Acquire actually available stack with authoritative pinout, firmware compatibility, current ratings and full packaging dimensions.
3. Qualify prop hub, motor-mount hole/screw stackup, battery pack connector and wire gauge, receiver, video and failsafe.
4. Weigh finished aircraft; measure CG, inertia tensor, and motor/prop thrust response, including realistic voltage sag.
5. Build calibrated PX4/Gazebo SDF with pinned firmware and integration tests; keep SITL disabled until all values exist.
6. Publish actual exploded CAD build instructions and manufacturing drawing tolerance validation.
