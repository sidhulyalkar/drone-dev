# AeroForge v2.9 | Source-bound X500 mounting feature candidate review

## Source, authority and exact file identity

The October 12, 2026 user-supplied `x500v2-frame.step` and `AIR2216II_Motor_3D.STEP` were hashed, imported into CadQuery/OCP and converted to private local GLB files in v2.8. This v2.9 milestone uses **the original STEP's cylindrical BREP surface inventories**, not the lower-detail GLB mesh, to identify repeatable **unlabeled** geometry patterns.

Source SHA-256:
- Frame: `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360`
- Motor: `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15`

These are hashes of uploaded files, not publisher-signed OEM authenticity checks. The source CAD export dates (2022 frame / 2025 motor) **are not proven compatible product revisions**.

## What real geometry supports

**Frame:** Repeated groups of *four cylindrical BREP surface axes* are present at each of four X/Z locations in the original frame-native Y-up hypothesis:

| Candidate | Native frame X (mm) | Native frame Z (mm) | Referenced original solid index |
| --- | ---: | ---: | ---: |
| frame-quadrant-nn | -176.876 | -176.876 | 35 |
| frame-quadrant-np | -176.876 | +176.876 | 62 |
| frame-quadrant-pp | +176.876 | +176.876 | 89 |
| frame-quadrant-pn | +176.876 | -176.876 | 116 |

The **square side length is about 13.435 mm, while the diagonal is 19.0 mm**. This distinction matters. The 19 mm cylinder-center diagonal MUST NOT be mislabeled as a 19×19 mm bolt pattern. The frame centers have radial distance about 250.1 mm from native X/Z zero, consistent with an approximate nominal 500 mm diagonal, but this is a coordinate observation, not a direct wheelbase/certification measurement.

**Motor:** A group of cylindrical-surface axes on original solid 0, approximately diameter 2.5 mm, yields *two separate* opposing pairs with center separations of **16.0 mm** and **19.0 mm**. The pair midpoints agree at about native Y = 732.08475 mm, Z = 0 mm. These are in the motor's native X-longitudinal frame; the X axial position of the actual mounting surface is **NOT established** by the BREP cylinder's arbitrary `Axis.Location()` coordinate.

The motor's source-native 16/19 pair distances are interesting in relation to Holybro's published alternative spacing references. However, they do **not** demonstrate that the corresponding circles are threaded mounting holes, or that either pattern mates to the four frame candidates.

## Reproduce the five-pattern candidate report

Start from the two real, original STEP files already verified by the v2.7 intake, or from the complete original-source BREP reports delivered privately to the operator.

```bash
# When the BREP cylinder reports already exist in a private directory:
python3 tools/x500_mount_feature_candidates_v29.py \
  --frame-brep .cad-local/x500/x500v2-frame.brep-cylinder-candidates.v28.json \
  --motor-brep .cad-local/x500/AIR2216II_Motor_3D.brep-cylinder-candidates.v28.json \
  --out .cad-local/x500/x500-mount-feature-candidates.v29.json
```

The generator requires both original named source fingerprints, both unqualified complete BREP inventories, four repeated outer frame arrangements and an independent common-centered motor 16/19 dual pair. It fails closed rather than publishing a partial family. It also records hashes of the source BREP reports, the exact supporting solid IDs, per-face references and the **unknown** cylinder-axial coordinate.

The resulting JSON is small enough to load locally in the browser and does not contain either proprietary STEP file or the GLB geometry. It is retained privately rather than committed as an asset to the public repo.

## Inspect candidates inside AeroForge

Open **Engineering → Real CAD viewer → Frame ↔ motor CAD registration study**. Choose the original frame + motor STEP, GLB and visual package JSON for each part, and optionally the paired-source v2.7 report. Then choose `x500-mount-feature-candidates.v29.json` under **Optional v2.9 local BREP feature candidate index** and click **Verify two source packages**.

The collapsed **Review 5 CAD cylindrical-face mounting candidates** panel becomes available only if both original STEP hashes, GLB manifests, source revisions, sizes and candidate report values agree with the exact known source observations. The panel identifies each of the four frame quadrant patterns and the dual motor pair pattern.

**Explicit research interaction:** clicking **Use transverse coordinates in draft** copies only the two values perpendicular to a candidate cylinder axis. For the frame, native Y remains blank; for the motor, native X remains blank. You must independently inspect the physical mounting surface position and fill the missing coordinate, as well as supply your own measurement rationale and fastener notes. The application cannot infer mating-plane elevation by copying the `Axis.Location()` of an infinite BREP cylinder.

The optional feature report **never** sets `mountingHoleIdentityApproved`, `motorShaftAxisApproved`, `tolerancedFitTested`, `physicalFitApproved`, `procurementApproved`, `powerApproved` or `flightApproved` to true. The parser rejects any report claiming upgraded authority.

## What is needed before a true mechanical mate

1. Inspect actual source BREP planar faces near each candidate quartet and determine support surface normal, plane coordinate, through-hole versus boss classification, and body ownership. Remember BREP solid/face indices can change after exporter/kernel version changes.
2. Independently verify corresponding motor base threaded hole identities, thread specification, hole depth, screw engagement, rotating housing separation, and physical part revision.
3. Distinguish true mounting-hole **side spacing** from diagonal distances in CAD projected circles, and model approved drilling pattern tolerances.
4. Derive a physically justified, reproducible source-native rotation and translation, then perform accurate BREP interference tests with tolerances, not broad-phase GLB/AABB overlap.
5. Require independent review of original actual parts, ESC wiring, propeller dimensions, clearance and mechanical/power/flight safety before any approval.

**Status:** five *source-bound geometric inspection candidates*, zero confirmed fastener holes, zero approved mates and zero flight qualification.
