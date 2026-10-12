# AeroForge v2.4 · Paired X500 source-CAD study

## What's implemented

A collapsed **Frame ↔ motor CAD registration study** under Engineering → Section 17 (Local manufacturer CAD).

The software can now hash-verify TWO independently supplied **STEP + GLB + manifest** groups in the same browser session, display an **actual two-mesh 3D preview** with an explicitly human-selected relative transform, and export a research-only JSON proposal. It never downloads, uploads, caches, or commits CAD bytes. User-entered geometry and licensing descriptions cannot authenticate Holybro, establish registered mounting axes, certify a physical fit, or grant power/flight permission.

Source candidate names are fixed:

- Holybro X500 V2 frame: `x500v2-frame.step`
- Holybro motor: `AIR2216II_Motor_3D.STEP`

Official download page: https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download

Those names are identity hints for choosing the right published files, **not evidence of genuine received part revision or cryptographic vendor signing**. The original actual source STEP files have **not** been retrieved, converted, reviewed or committed by this development session. Tests use explicitly synthetic GLB/STEP fixtures.

## Repeatable local preparation

1. Independently download both source candidates from the official Holybro page, retaining any actual revision IDs and applicable license/redistribution notes.
2. Calculate each original STEP SHA-256 locally: `shasum -a 256 <original.step>`.
3. Set up the isolated CadQuery environment per [v1.3](V13_CAD_VISUAL_PACKAGE.md). Use `tools/cad_visual_package_v13.py` **once per input** with its own expected SHA-256, documented revision, official source URL and license note, producing separate GLB and visual-package JSON outputs.
4. Serve AeroForge locally (`npm run serve`), switch to **Engineering**, open **Section 17**, then expand **20 / Frame ↔ motor CAD registration study**.
5. Supply each manifest, its matching GLB and its *required* original STEP. The new paired intake checks source/GLB byte sizes, embedded-only GLB resources and both SHA-256 fingerprints before enabling proposal inputs.
6. Identify **real observed** frame and motor mounting centers in their source-native coordinate systems (mm). Select a right-handed rotation, document the source-unit assessment, hole-spacing hypotheses, observer and fastener/motor shaft uncertainties. Do **not** use the prefilled zero coordinates as real measurements.
7. Create the proposed transform; observe preliminary AABB screen and mount-pattern discrepancy; optionally view the two CAD-derived meshes together and export the JSON research proposal.
8. The unverified CAD proposal appears next to the unresolved `frame-motor:1` checklist item but **does not increment recorded inspection counts**. A change to the proposed values clears the rendered pose/export. An aircraft configuration change clears the checklist's association.

## v2.5 follow-up: Source identity at render time and aircraft-revision scoping

The v2.4 proposal is now associated with the active canonical X500 record at the moment it is created. The association stores the full `revisionIdentity`, controller variant and battery series. Only a proposal with a matching `aircraftScope` and unchanged source fingerprints may appear in the open `frame-motor:1` evidence checklist. An old or unscoped proposal never counts as current, and switching kit variant clears the in-tab proposal and disables its export. The locally verified source files can be reused, but the **datum proposal must be explicitly recreated**.

In `core/cad_pair_view_guard_v25.mjs`, the 3D viewer now independently rechecks the two in-memory GLB byte hashes against those recorded in the selected proposal **before** parsing the source meshes. Swapped, altered or unrelated mesh buffers fail closed even if a previous UI check had succeeded.

The guard is a second *local identity check*, not a trusted manufacturer signature or independent dimensional validation. It does not grant mechanical fit, purchasing, energizing or flight authority. Node regression tests cover both the scope invalidation and GLB mutation cases; browser tests exercise variant-swapping after a self-reported pose has been created.

## Engineering math

Let `p_f` be the chosen frame mounting point in frame-native millimetres, `p_m` the motor's mounting origin, and `R` a **right-handed signed-axis permutation**. The proposed motor position in the frame-native axes is

```
p_frame_mm = R @ (p_motor_native_mm - p_m) + p_f
T_mm = p_f - R @ p_m
```

The 3D renderer uses the resulting `R` and `T_mm / 1000` on the **locally generated GLB** in metres. It does not modify original source geometry or infer where the motor is installed in a real drone.

The conservative axis-aligned bounding box comparison uses just source AABBs and this proposed transform. It is only a broad-phase review cue, not a mesh interference proof. AABB overlap is not a collision; disjoint AABBs do not validate a mating surface. The 16 vs 19 mm published hole-pattern alternatives are kept visible as **revision-dependent references**, not manufacturing tolerances. The difference between two entered hole-pattern hypotheses is never translated to `PASS` or `FIT`.

## QA and next milestone

Pure regression coverage checks both source digests are required, non-reflecting axis maps, finite coordinates, malformed registration, invalid manufacturer/approval claims, tentative transformed envelopes and all-false qualification flags. Playwright covers the dual-file hashing flow, proposed research export and invalidation, plus rejection of an altered local original STEP.

Next: physically retrieve the genuine vendor files with confirmed permission, record their exact hash/revision and source-unit interpretation, identify mounting holes from CAD surface geometry (not guessed from nominal dimensions), perform **independent datum review** and add a mesh-vs-mesh interference method with known geometric tolerances. Electrical connector and flight checks remain separate.

**Never power, operate, procure based on, or fly an aircraft solely from these research receipts.**
