# AeroForge v3.1 | Real STEP obround contours and motor split-face passages

## Evidence lineage (2026-10-12)

This is a reproducible **geometric-feature classification**, not a mechanical fit study or authentic OEM signature. Two original-named, privately uploaded STEP files were parsed locally with CadQuery/OCP using their original millimetre-based CAD coordinate systems. The source hashes are:
- X500 V2 frame `x500v2-frame.step`: `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360` (244 imported solids)
- AIR2216II motor `AIR2216II_Motor_3D.STEP`: `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15` (4 imported solids)

The v3.1 contour report stores SHA-256 identifiers for **both original STEP sources, the exact v2.9 five-pattern source JSON bytes, and the exact v3.0 planar-adjacency JSON bytes**. Each level is rechecked before the browser accepts v3.1 evidence. The input GLBs and STEP bytes still undergo local manifest fingerprint checks independently.

## What actual BREP topology supports

### Frame: 16 candidate obround slots, rather than simple circular holes

For each of four outer frame solids (indices 35, 62, 89, 116), there are **four closed obround inner-wire contours on each of two source-native planar faces**, Y = 15.5 mm (face 105) and Y = 17.0 mm (face 103). The eight observed contours per solid describe **four distinct slot positions on two surfaces**; across the aircraft that is **16 distinct candidate slots**, not 32.

Each closed contour has exactly:
- **Two 180° circular arcs, radius 2.9 mm**, each of arc length approximately \(\pi\,2.9\) mm;
- **Two straight segments of length 1.5 mm**, joining the arc ends;
- **Overall CAD contour width 5.8 mm, length 7.3 mm**;
- Opposite planar contour faces separated by **1.5 mm along the source-native Y axis**.

The contour detector excludes the exterior wire and requires each accepted inner wire to be closed and shared with exactly one of the previously identified cylindrical support faces (108, 112, 116, 120). It checks each pattern twice, on opposite frame faces, with matching transverse centers. The offset of the **actual completed slot center** from its frame pattern center is **8.75 mm**. The previously reported **9.5 mm** refers to the source BREP *half-cylinder axis centers*, not these complete slot centers. They must not be interchanged in any downstream mating analysis. The 19 mm diagonal of the four half-cylinder axis positions likewise is **not** a measured 19×19 mm mounting hole-side distance.

These inner-wire contours have verified CAD geometry, but have **not** been independently classified as the received hardware's usable bolt slots, let alone toleranced mechanical interfaces.

### Motor: four circular passage candidates assembled from split BREP faces

The motor source solid 0 contains eight selected cylindrical faces. Grouping by shared native cylindrical axes and radius reconstructs **four pairs of semicylindrical faces**, with:
- Radius **1.25 mm**, nominal model diameter **2.5 mm**;
- Each half-face spanning approximately 180° and **2.3 mm along the motor-native X axis**;
- Two *shared longitudinal TopoDS edges* between each paired set, and two half-circular arcs at **each** X end;
- A source BREP solid-body test finding the axis-center sample outside solid material and four probe points just beyond radius 1.25 mm inside solid material;
- Two candidate opposing-axis distances of approximately **16 mm and 19 mm** in the source-native YZ plane.

The source X interval of these wall segments is approximately **1181.1255–1183.4255 mm**. It is NOT an independently qualified motor base mounting plane, a threaded engagement depth, a through-hole guarantee across the whole motor body, or a fastener length specification. CAD half-faces are combined into circular-passage *candidates*, not asserted as verified threaded mounting holes. The motor's native coordinate origin is far from its geometry; that offset must remain explicit until a physical datum is justified.

## Local reproducibility and UI

Regenerate from the original two STEP binaries plus their complete private v2.9/v3.0 evidence reports:

```bash
.venv/bin/python tools/x500_brep_contour_groups_v31.py \
  --frame-step "/path/to/x500v2-frame.step" \
  --motor-step "/path/to/AIR2216II_Motor_3D.STEP" \
  --candidates ".cad-local/x500-mount-feature-candidates.v29.json" \
  --topology ".cad-local/x500-brep-plane-adjacency.v30.json" \
  --out ".cad-local/x500-brep-contour-groups.v31.json"
```

The analyzer never overwrites an existing output. It rejects changed original SHA-256 bytes, incomplete source groups, wrong original face identities, broken or mismatched contour segments, non-closed wires, missing semicylinder seams/cap arcs, inconsistent 16/19 distances, failed void/material probes and source evidence falsely claiming physical approval.

In AeroForge **Engineering → Real CAD viewer → Frame ↔ motor CAD registration study**, select each original STEP + matching GLB and manifest, then optionally the v2.9 pattern index, the v3.0 BREP plane report, and the v3.1 contour report. All three evidence reports must be selected in that order. The collapsed v3.1 contour panel shows 20 original contour centers with source part and face IDs. Copying one into a research proposal **only populates its transverse coordinates**:
- Frame-native (X, **blank Y**, Z)
- Motor-native (**blank X**, Y, Z)

The along-axis mounting datum remains blank until an independent source-to-physical mating-face inspection. The research 3D preview can show green markers on the 16 source obround centers and coral markers on the four source circular passages. The motor markers inherit the still-*hypothetical* relative transform. No CAD model data is re-centered or modified.

The privately delivered ZIP contains the two GLBs, source-bound v2.7/v2.9/v3.0/v3.1 JSON evidence, source BREP inventories, a readable 20-contour CSV and per-file SHA-256 checksums. It **does not contain original STEP files**, which remain under operator control. Manufacturer redistribution rights for source-derived meshes have not been verified; do not republish without license review.

## Required next safety/engineering gates

1. Confirm received frame and motor hardware revisions and independently compare physical motor hole type, thread depth, screws and actual plate slot dimensions against inspected source CAD. Distinguish manufacturing tolerance and drill/casting features from ideal CAD geometry.
2. Determine exactly which motor planar face is intended to contact the frame slot plate. A nearby face or a circular passage wall does not independently establish a mating surface. Record axial datums with face identifiers and independent reviewer evidence.
3. Build an explicit candidate rigid transform, traceable through the four motor passage centers, selected plate obround contours and possible in-plane travel. Do not optimize by making meshes look aligned.
4. Only with justified datum/part identities, run exact BREP solid-level interference/clearance and fastener engagement with conservative tolerance/uncertainty intervals, and compare against the real received components.
5. Keep rotor-mapping, electrical wiring, motor/ESC current, battery protection, propeller disk clearance, weight/CG and flight testing under their separate safety reviews.

**Qualification status:** source contour *geometry* understood; zero confirmed fastener/thread qualifications, zero independently verified contact faces, zero toleranced fits, zero procurement, powered or flight approvals. PR remains draft.
