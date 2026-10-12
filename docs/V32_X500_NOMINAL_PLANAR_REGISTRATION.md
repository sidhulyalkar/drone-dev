# AeroForge v3.2 | Nominal in-plane motor-to-obround registration

**Status:** reproducible *2D CAD contour feasibility hypotheses*, **not** a physical mating, collision, thread, fastener, axial seating, tolerance or flight qualification.

## Source and audit chain

This study uses **both exact original operator-uploaded STEP bytes**, not nominal online photos, as the source for the v3.1 BREP feature observations:

| CAD part | Original STEP SHA-256 | Source-native geometry |
|---|---|---|
| X500 V2 frame | `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360` | 16 individually located obround inner wires, 5.8 × 7.3 mm, around four frame quadrant patterns |
| AIR2216II motor | `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15` | Four 2.5 mm circular passage candidates; 16 and 19 mm opposing-pair distances |

The original source hashes are **not manufacturer signatures**. CAD model export times are not verified product revisions. The predecessor v2.9 and v3.0 original source-level reports and v3.1 exact contour report preserve individual face IDs, original-source fingerprints and SHA-256 linkage. The new frontend solver operates **only** on the already verified v3.1 browser contour review, and rejects changed source identity, mismatched slot positions, incorrect feature counts and any upgraded physical status flags.

## Planar geometry, not 3D assembly

The native motor **YZ** plane is mapped to the native frame **XZ** plane, while the motor's native X and frame's native Y remain **unregistered axial dimensions**. No 3D mating transform, seating normal, motor housing clearance or screw engagement is inferred.

For each frame quadrant, the solver computes the centroid of the four source-derived **complete obround centers**, approximately at native (±176.876396, ±176.876396) mm. Each slot's center lies approximately **8.75 mm** radially from its quadrant center; the actual source obround contour has endcap-circle radius **2.9 mm** and straight section **1.5 mm** (half-section 0.75 mm). These values are distinct from the older 9.5 mm half-cylinder-axis family in v2.9, which must never be mistaken for a slot center.

Motor passage center radii are approximately **8.0 mm (two)** and **9.5 mm (two)** relative to the motor's source YZ centroid around (732.08475, 0) mm. Rotating the source projection so the first motor passage direction matches one of the four radial slot axes gives **four mathematical yaw hypotheses per quadrant**, or **16 source-plane candidate permutations** across the frame.

The per-candidate search checks *all 24 bijective motor passage-to-frame slot assignments* and selects the one with the smallest worst distance to the assigned slot's centerline **spine segment**, using total distance only for deterministic tie-breaking.

The calculation for projected center \(q_i\), slot center \(c_i\), radial unit axis \(u_i\), slot spine half-length \(h = 0.75\) mm and a **hypothetical** circular probe diameter \(d\) is:

\[
t_i = \operatorname{clamp}((q_i-c_i)\cdot u_i,-h,h)
\]
\[
\delta_i = \left\|q_i-(c_i+t_iu_i)\right\|
\]
\[
\text{nominal test-gauge margin}_i = 2.9 - d/2 - \delta_i.
\]

The margin is only a 2D ideal-obround projection test. It is not actual screw clearance, machined tolerance, fastener safety factor, or proof that a physical bolt can pass through both parts.

### Result on the user-uploaded v3.1 source-contour report

| Parameter | Computed research result |
|---|---:|
| Frame mounting-pattern locations | 4 |
| Nominal in-plane orientation candidates | 16 |
| Projected angular families | Approximately 45°, 135°, 225°, 315° |
| Maximum contour-center-to-slot-spine residual (all candidates) | 0.000510 mm |
| Example hypothetical test disk diameter | 2.5 mm |
| Minimum *nominal test-disk margin* at that example diameter | 1.649490 mm |
| Qualified axial seating plane | **None** |
| Verified bolt, thread, tolerance, or real interference | **None** |

The near-zero residual measures agreement of **rounded CAD-derived coordinates**, not achieved machining or assembly accuracy. The assumed 2.5 mm circular test gauge is **not a bolt recommendation**; it happens to match the CAD motor passage model diameter and is an independently adjustable visualization parameter. Varying it from 0 to 5.8 mm in the UI is a geometry experiment, not a recommendation for fasteners.

The source 45°-family rotations are not expressible by the earlier 24 right-handed **signed-axis permutations** alone, which only enumerate principal-axis directions. A future justified rigid transform will need a continuous, right-handed rotation plus independently established axial mounting contact and orientation. For a positive 2D motor YZ→frame XZ rotation, a 3D *right-handed orientation hypothesis* would map source motor native +X to frame native −Y; that orientation itself remains **unverified physically**.

## Browser workflow

1. Open **Engineering → Real CAD viewer → Frame ↔ motor CAD registration study**. Local original STEP + GLB + visual manifests for both parts must pass exact SHA-256 checks. The original private v2.9 cylindrical-pattern index, v3.0 source BREP adjacency report and v3.1 contour report are required for the v3.2 interface.
2. Expand **Inspect 16 mathematical motor-to-frame obround alignments (2D only)**. Review each of the four quadrants and four projected yaw orientations.
3. Inspect four individual motor-circle-to-obround correspondence lines on the 2D SVG source-projection view. Adjust **Hypothetical circular gauge diameter (NOT a bolt size)**. Observe the CAD-model centerline residual and hypothetical gauge margin. If a parameter or source report changes, all prior visualizations are invalidated and regenerated.
4. Optionally export **unqualified planar hypotheses JSON**. It preserves the model-only source hashes, all sixteen candidate rotations, projected translations, four individual slot correspondences, unresolved axial translation as `null`, and all physical approvals `false`. No candidate is written into or silently accepted by the existing 3D mating proposal.

The previous dual-GLB 3D viewer, native-axis annotations and optional v3.1 20-feature contour overlay remain intact. The 2D solver **deliberately does not apply** a candidate yaw to the model's 3D mechanical pose.

### Independent local audit

The operator also receives a private Python reference CLI and v3.2 report in a downloadable bundle. The independent reference script requires the original two unchanged STEP files, and source-linked v2.9/v3.0/v3.1 reports. It checks the cross-report byte hashes, computes the same 16 candidates using 24 correspondence permutations per orientation, and refuses to overwrite an existing evidence report. It does not require a graphics engine or claim to repeat source-face classification, which remains the responsibility of the original v3.1 BREP tool.

## Remaining physical engineering gates

- **Identify a real motor contact/seating plane**, normal, housing clearance and exact face IDs for the received revision. Neither the end of a split circular passage nor a nearby flat source face establishes the intended mounting seat.
- **Independently measure frame slots and motor fastener features**, including actual width, travel, screw/thread specification, depth, head washer interference and physical tolerances.
- Obtain and review a real *axial* registration datum (currently null), source-native handedness/normal, continuous yaw and housing assembly pose, with a physical evidence receipt.
- Only then permit an **exact BREP pairwise collision/clearance evaluation** under both nominal and adverse tolerance scenarios. Clearly distinguish zero intersection at one nominal pose from engineering approval.
- Maintain separate validated power, connector, ESC, battery, rotor clearance and flight readiness checks.

**The PR remains DRAFT. Zero physical/mechanical/flight approvals have been upgraded.**
