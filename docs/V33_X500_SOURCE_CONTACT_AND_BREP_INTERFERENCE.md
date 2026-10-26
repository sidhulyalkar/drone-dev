# AeroForge v3.3 | Original-source 3D contact-face investigation and bounded BREP interference

**Status: DRAFT, source-CAD research only. No manufacture, procurement, power-on, or flight approval.**

## 1. Source acquisition and evidence chain

The operator supplied the following source CAD files, which were SHA-256 verified and imported with CadQuery/OpenCascade:

| Part | SHA-256 of user-supplied STEP bytes | Solid count |
| --- | --- | ---: |
| X500 V2 frame | `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360` | 244 |
| AIR2216II motor | `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15` | 4 |

**These digests are not manufacturer signatures or product-revision certifications.** Retain the original STEP files locally; the public GitHub branch and private download package do **not** include the original STEP binaries. Redistribution permission for manufacturer CAD-derived GLBs has not been independently verified; keep the provided GLBs private until licensing is reviewed.

The v3.3 report includes SHA-256 receipts of the exact prior **v3.1 BREP contour** and independent **v3.2 planar-reference** JSON byte sequences, besides the two original source STEP fingerprints. The browser recomputes and matches these receipts after validating each original STEP/GLB manifest.

## 2. Two real motor face candidates, connected by original BREP topology

The previous v3.0 motor survey did not find a planar face directly edge-adjacent to all eight motor half-cylinder passage surfaces. A deeper analysis shows an actual **two-edge topological path** for each half-cylinder:

`original cylindrical face → analytically conical transition face → planar face`

The same topology is repeated at all four source-model circular passage centers and independently connects to **two** planar faces on motor solid 0:

| Original motor face index | Native motor X (mm) | Source face normal | Original face area (mm²) |
| --- | ---: | --- | ---: |
| **28** | 1183.67548 | +X | 249.165666 |
| **33** | 1180.87548 | −X | 192.760042 |

The connecting conical faces have a native reference radius of **1.5 mm** and a semi-angle of approximately **45°**. The previously established inner cylindrical passage wall is radius **1.25 mm**, spanning 2.3 mm along source X, flanked by conical transitions in the model.

**This proves a BREP face adjacency, not actual screw countersink identity, thread specification, real motor contact/seating face, or OEM assembly intent.** Both source faces remain named *unqualified geometric contact-face candidates*.

Frame source solids 35, 62, 89 and 116 each present the known 1.5 mm-thick plate region with original faces 105 (native Y=15.5 mm, −Y normal) and 103 (Y=17.0 mm, +Y normal).

## 3. Right-handed 3D transforms and normal pairing

The 16 v3.2 source-derived planar passage-to-obround alignments were promoted **only to source-geometry 3D hypotheses**, using the two motor and two frame planes as four additional choices each.

For native motor coordinate \((X_m,Y_m,Z_m)\), frame coordinate \((X_f,Y_f,Z_f)\) and candidate projected rotation \(\theta\), the tested proper rotation is

\[
R(\theta)=
\begin{pmatrix}
0 & \cos\theta & -\sin\theta\\
-1 & 0 & 0\\
0 & \sin\theta & \cos\theta
\end{pmatrix},\quad \det(R)=+1.
\]

The source-native translation is \(t=p_f-Rp_m\), using the selected source motor plane, original motor passage center and the chosen frame quadrant/plate plane. This is a **rigid transform proposed from ideal CAD**, not a measured or independently qualified assembly pose.

There are **64 model-only 3D candidates** in total. **32** pair opposing contact-face normals; the other 32 have same-facing normals and are retained for diagnostic comparison. Even the opposing-normal options have **no physical seating qualification**.

The v3.3 UI displays these candidates in a separate collapsed inspector and **never silently updates the existing 3D manual mating proposal**.

## 4. Broad-phase AABB screening of all modeled parts

For every 3D hypothesis, v3.3 transforms **all four original motor-solid AABBs** and checks them against **all 244 original frame-solid AABBs**. The real-source report records about **30–34 potential overlapping AABB pairs per pose**, with original solid IDs.

This is conservative spatial screening. AABB overlaps are not exact BREP intersections and can be false positives; AABB screening also does not independently resolve alternate, duplicate or omitted parts from the manufacturer assembly.

The web inspector accepts the private report only after original STEP/GLB verification and the exact v3.1/v3.2 report byte hashes agree. It checks the 64-pose family, signed source face normals, determinant-positive transforms, contact-anchor coordinate mapping, original model solid indices, source-specific conical BREP witnesses and immutable safety flags. It is a **read-only, unqualified source-study**.

## 5. First bounded exact-solid Boolean batch: modeled interference FOUND

A fresh independent CAD-free supervisor launched a separate OpenCascade process. A bounded worker evaluated the **30 AABB-positive original frame/motor solid pairs** for this one source-only case:

`frame-quadrant-nn-orientation-1-motor-plane-28-frame-plane-103`

The resulting independent model evidence:

| Metric | Result |
| --- | ---: |
| CAD solid pairs fully evaluated within this one pose | **30** |
| Pairs with positive exact BREP intersection volume | **13** |
| Largest individual pairwise modeled overlap | **5,491.38771511 mm³** |
| Frame solid 35 ↔ motor solid 0 | 0 mm³ |
| Larger modeled intersections involving other frame solids | **Yes**, including 56 and 189 |
| Full aircraft hardware approval | **False** |

The initially checked *single* source pair (frame solid 35 / motor solid 0) had zero intersection volume. That result was misleading when viewed in isolation. The expanded bounded model batch found substantial overlapping model solids elsewhere at the exact same pose. The v3.3 interface displays this result as **SOURCE MODEL INTERFERENCE PRESENT**, not clearance or a successful assembly.

These are exact Boolean intersection volumes **from the supplied ideal CAD solids at one hypothesis**. This cannot, by itself, distinguish actual included components from redundant/source-alternative assembly representations, and does not imply verified real-world contact tolerances. Zero modeled overlap in any one pair would never constitute approval.

## 6. Safe bounded exact Boolean architecture

Attempting to fork exact Boolean workers **from a process that had already loaded CAD geometry** sometimes stalled, even with nominal timeouts. To avoid this, the v3.3 **private offline kit** includes two separate programs:

- `x500_contact_topology_v33.py`: reproduces source face-chain observations, all 64 3D transform hypotheses and every source AABB candidate without attempting any post-import worker fork
- `x500_boolean_supervisor_v33.py`: run from a **fresh, CAD-free interpreter**; checks original STEP bytes and the selected immutable source-only hypothesis, then starts an independent CAD worker with a bounded 8–60-second execution budget and OS process-group termination on timeout

A worker failure, timeout, incomplete batch, missing source solid or invalid Boolean output is classified as **INDETERMINATE**, never a collision clearance pass. Even a successfully completed pair batch covers one candidate ideal-CAD pose, not real manufactured hardware or a complete, toleranced aircraft assembly.

Public GitHub `tools/x500_contact_topology_v33.py` contains the reusable original-source verification, proper rigid-transform/AABB helpers and isolated worker-control primitives. The full CadQuery face-adjacency and Boolean worker implementations are included in the **private source-geometry evidence kit** to reproduce locally.

### Browser usage

Within Engineering → Frame ↔ motor CAD registration study, select the required pairs of original STEP, GLB and visual manifests. To inspect the complete source-only v3.3 study, additionally load:

1. Original private v2.9 feature index and v3.0 face adjacency report
2. v3.1 original BREP contour report
3. Independent private `x500-nominal-planar-mounting-hypotheses.v32.json` file
4. `x500-source-contact-hypotheses.v33.json` file
5. Optionally, `x500-source-brep-batch-probe.v33.json` exact source-solid overlap report

Expand **Inspect 64 source-derived 3D contact-plane hypotheses** to review face identities, yaw, candidate 3D rigid transform, original AABB candidate-pair count and separately linked bounded BREP results. The default selection shows only the 32 opposing-normal cases; same-facing alternatives require enabling their visibility.

No action in this panel grants mounting-plane qualification, creates a hardware order or changes the currently active manual assembly pose.

## 7. Next mandatory engineering gates

- Reconcile the 244 frame source solids with an actual original-parts assembly hierarchy and manufacturer revision/BOM. Determine whether overlapping solids 56 and 189 are physically present in the purchased assembly or duplicated/alternate representations. **Do not simply omit colliding solids to make a pose pass.**
- Independently establish the actual motor mounting-side face, surface normal and seating offset from physical measurement or revision-specific OEM assembly data.
- Confirm fastener hole/thread specification, screw engagement, washers/head support, 5.8×7.3 mm slot travel, body clearance and approved mechanical tolerance intervals.
- After resolving part ownership, rerun isolated exact BREP solid intersections on physically justified poses and adverse tolerance samples across the complete selected assembly.
- Only after physical geometry clears should electrical interfaces, rotor disks, ESCs, controller wiring, CG and safety/flight acceptance be evaluated through their independent tests.

**Release boundary: all mechanical, manufacturing, procurement, powered operation and flight approval flags remain false. PR #1 stays draft.**
