# AeroForge v2.8 | Real X500 V2 STEP import: operator evidence report

## Actual local input, 12 October 2026

Two user-provided, original-named STEP binaries were inspected locally with CadQuery 2.8.0/OCP, without downloading third-party replacements. The [Holybro downloads page](https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download) lists these filenames, but matching a published filename **does not authenticate exact binary provenance**. SHA-256 values below are independently computed fingerprints of **the user's specific uploads**, **not** publisher-signed or manufacturer-published checksums.

| | Frame | Motor |
| --- | --- | --- |
| Original basename | `x500v2-frame.step` | `AIR2216II_Motor_3D.STEP` |
| SHA-256 | `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360` | `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15` |
| Actual file size (bytes) | 24,624,144 | 790,229 |
| STEP header | AP214; exporter timestamp 2022-07-19T23:53:04-07:00 | AP203; exporter timestamp 2025-04-17T02:19:22 |
| Imported CadQuery solids | 244 | 4 |
| CAD faces on imported solids | 14,178 | 304 |
| Initial pre-mesh OCP axis-aligned bounding box min (mm) | [-200.17539, -215.27643, -200.17539] | [1143.17548, 718.23467, -13.85] |
| Initial pre-mesh OCP axis-aligned bounding box max (mm) | [200.17539, 107, 200.17539] | [1186.17548, 745.93467, 13.85] |
| Native kernel bounding-box extents (mm) | 400.35078 × 322.27643 × 400.35078 | 43.0 × 27.7 × 27.7 |

Both files contain STEP `SI_UNIT(.MILLI.,.METRE.)` declarations and imported into OCP; the units are **source-file unit claims**, not independent mechanical calibration. All measured AABBs are in independent source-native coordinates, not a shared aircraft, ENU or FRD frame. Do not mistake the motor's native X offset of ~1.14 m for any motor installation coordinate.

### Source revision nuance

Frame source `FILE_NAME` contains a dated 2022 export and the motor contains a dated 2025 SolidWorks export. They are **file-export timestamps, not confirmed Holybro product revisions**, and must not silently be promoted to SKU or assembly compatibility proof. Original source geometry, linked vendor identity and allowed redistribution remain under review.

## Derived graphics and fidelity

The original v1.3 `0.25 mm / 0.18 rad` triangle-generation profile produced over 1.2 million triangles before all 244 frame solids had been processed; the previous hard cap correctly blocked a partial result. A bounded display-only profile of `1.5 mm linear deflection / 0.5 rad angular deflection` tessellated all solids while keeping the **same 1.2-million-triangle limit**. This is a mesh visualization setting, not a physical fit tolerance.

| Converted object | GLB size (bytes) | Triangle count | Imported drawable solids |
| --- | ---: | ---: | ---: |
| Frame | 10,670,324 | 827,470 | 244 / 244 |
| Motor | 200,520 | 9,485 | 4 / 4 |

Independent GLB parsing with `trimesh.load(..., force='scene')` matched all node/mesh counts and triangles. Max absolute difference between tessellated GLB AABB and CadQuery source AABB from the same conversion run was approximately **0.099 mm for the frame** and **0.004 mm for the motor**, consistent with preview tessellation; these are not engineering tolerances.

The private package consists of the two GLBs, two source-bound manifests, one dual-source intake receipt, both solid-level AABB inventories, and two per-solid tessellation inventories. The original STEP binaries are **not included** in the package or committed to GitHub. All qualified/safety flags remain false.

## Registration improvement motivated by real assets

- The X500 frame body plates were observed in source-native Y = 0–2 mm and Y = 30–32 mm; native Y-up is a *visual presentation hypothesis*, not independently calibrated aircraft-up.
- The motor's longest native extent is along X (43 mm), **not Z**. This is not an independently observed shaft direction. Its source origin is far from its geometry.
- The prior UI offered only four rotations preserving native Z. The v2.8 selector enumerates **24** right-handed signed axis mappings, while separating the optional explode-view axis from the mounting/shaft hypothesis.
- A source-specific, read-only observation pane appears only when the local STEP and GLB byte receipts match the exact uploaded source fingerprints. It never prepopulates mounting-hole coordinates or invents measured shaft centers.
- Renderer viewport may present Y-up for these exact matched local assets; neither source geometry nor original datum registration is automatically altered.

## Exact BREP cylindrical surface audit (v2.8)

A separate `BRepAdaptor_Surface` scan of every imported solid preserves source-native locations, radius, direction and face indices. It does **not** call a cylinder a bolt hole, shaft, thread, or boss.

| Evidence | Frame STEP | Motor STEP |
| --- | ---: | ---: |
| CAD BREP faces inspected | 14,178 | 304 |
| Cylindrical-surface face candidates | 5,382 | 97 |

In the motor STEP, 63 cylindrical-surface face candidates share an X-directed axis through approximately **Y = 732.08467 mm, Z = 0 mm** in the motor's unregistered native coordinate frame. That is a strong geometric axis **candidate** consistent with the observed 43 mm X extent, but not verified as the shaft, propeller rotation axis, motor mounting datum, or intended installed direction. Multiple faces can describe one cylindrical feature; 63 is **not** a count of mechanical holes or individual cylinders.

The full face-level reports and per-file hashes live in the local private GLB package supplied to the operator. `tools/step_brep_feature_candidates_v28.py` reproduces the extraction from byte-matched originals without promoting any approval flags. A reimport may reindex faces across CAD engines or versions; preserve both source SHA-256 and tool version in subsequent manual annotations.

## Physical blockers before proceeding toward flight

1. Visually identify actual frame motor mount plate solids and motor base/shaft faces from the original BREP; label them with reproducible shape IDs.
2. Independently compare at least one source model dimension (e.g. 144 mm body plate or motor mount centers) to a vendor dimensioned drawing and the actual received physical part.
3. Inspect and record precise mounting holes and bolt patterns per received revision; account for published 16×16 mm versus 19×19 mm alternatives and fastener engagement.
4. Derive physically justified, separately reviewed signed native-axis transforms and mounting datums. No CAD export timestamps establish mating revision.
5. Use precise BREP-level interference/tolerance review rather than GLB/AABB broad-phase cues; verify mass/CG, propeller disks, wiring and motor/ESC power connections separately.

**Status: source successfully parsed and fully visualized, physical geometry not independently qualified, no procurement, power, or flight approval.**
