# AeroForge v3.0 | Exact-source BREP planar adjacency review

## What changed

Two original-named, **locally hash-verified user-uploaded** STEP sources remain the sole basis of this analysis. We use an OpenCascade/CadQuery BREP topology operation, not the tessellated GLBs, to ask which original cylindrical surface faces share an actual CAD topological edge with which original planar faces.

**Source identities (operator-uploaded bytes, not vendor signatures):**

| Part | Source STEP SHA-256 | Imported solids |
| --- | --- | ---: |
| X500 V2 frame | `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360` | 244 |
| AIR2216II motor | `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15` | 4 |

The source v2.9 feature report has its **exact JSON bytes** SHA-256 recorded in the new report. In the browser, the candidate report must match those original bytes, both original STEP files must hash against their original-source manifests, and the corresponding frame/motor GLB files must match their manifests, before these reported topological observations are displayed.

### Four outer frame patterns

All four original-source frame solid candidates (35, 62, 89, 116) contain the same supporting cylinder-face index family **108, 112, 116, 120**. Each of these selected cylindrical faces shares a BREP edge with both of these planes on its own source solid:

| Plane face index | Native CAD coordinate | Plane normal | Face area |
| --- | --- | --- | ---: |
| 105 | Y = 15.5 mm | −Y | approximately 504.437 mm² |
| 103 | Y = 17.0 mm | +Y | approximately 504.437 mm² |

The 1.5 mm separation is an exact CAD-native observation in the uploaded models, not a certified actual manufactured thickness, screw engagement depth, tolerance or approved interface. The cylinder-face family forms a *square with a 19 mm **diagonal***. It does **not** prove that its side measures 19 mm or that all four faces are actual bolt holes.

### Motor observation and the important negative result

The motor candidate solid is 0, with supporting cylindrical face indices `4, 7, 10, 13, 63, 66, 69, 72`. These BREP surfaces form two source-native opposing-distance families of **16.0 mm and 19.0 mm**, with the motor's source-native long dimension along X.

**No single X-normal planar face is directly edge-adjacent to all eight selected cylinder faces.** Nearby candidate planes exist, including plane face 44 at native X ≈ 1160.175 mm, plane face 42 at X ≈ 1176.275 mm, and others. *Near* does not establish *touches* or *mates*, and even topological edge-sharing alone would not prove that a face is the physical motor mounting surface. A cylinder's `Axis.Location()` longitudinal coordinate must never be interpreted as the mounting-plane height.

## Reproducible procedure

1. Start from the original two STEP files and the exact, privately delivered `x500-mount-feature-candidates.v29.json`. No source geometry is committed to this repository.
2. Run `tools/x500_brep_plane_adjacency_v30.py` in the local CadQuery environment:

```bash
.venv/bin/python tools/x500_brep_plane_adjacency_v30.py \
  --frame-step "$HOME/Downloads/Holybro-X500-originals/x500v2-frame.step" \
  --motor-step "$HOME/Downloads/Holybro-X500-originals/AIR2216II_Motor_3D.STEP" \
  --candidates ".cad-local/x500-mount-feature-candidates.v29.json" \
  --out ".cad-local/x500-brep-plane-adjacency.v30.json"
```

The generator checks both exact original STEP SHA-256 digests before OCP import, demands all 244/4 original imported solids, validates every referenced cylindrical source face's radius and axis direction, scans neighboring BREP planar faces by **`TopoDS_Shape::IsSame` shared-edge identity**, and fails on incomplete candidate sets or false approval declarations. It records the original candidate report digest and refuses to overwrite an existing report.

3. Open **Engineering → Real CAD viewer → Frame ↔ motor CAD registration study**. Select and locally verify the original STEP + GLB + visual-package JSON for both components. Add v2.9 `x500-mount-feature-candidates.v29.json`, then optionally v3.0 `x500-brep-plane-adjacency.v30.json`, and click **Verify two source packages**.
4. Expand the separate **Review direct cylindrical-to-planar BREP adjacency** panel. Inspect per-candidate original solid and face IDs, exact directly shared axial planes and warning when **none** is shared. This panel is *read-only* and does not auto-fill a proposed axial mounting datum.
5. When an independently labeled manual research pose is created and **Preview two source meshes in 3D** is opened, eight small source-bound frame-only dots mark those original BREP plane coordinates: orange = native Y 15.5 mm, violet = native Y 17.0 mm, at each of the four candidate frame centers. These markers are **not** a physical face visualization, and their placement does not identify a motor mounting plane or approve a fit.

The optional v3.0 report may also be absent. Older manually entered research hypotheses remain available under their prior rules, but without v3.0 topological evidence.

## Trust and license boundary

The renderer cannot independently reconstruct exact BREP topology from GLB triangle meshes; it can verify the source-linked receipt chain and check that the reported topology is internally consistent with this known-source observation. This is **not a signed remote attestation**, and a malicious actor with local file control could forge unsigned reports. For independent high-assurance review, reproduce the face-adjacency tool against the original STEP bytes on a separate trusted workstation and physically inspect source revisions and real hardware.

The private download bundle contains two source-derived GLBs, original STEP digests, the v2.9 report and this v3.0 face-adjacency report, but **not the original STEP files**. Permissions for redistributing derivative meshes are not established. No physical mounting hole classification, actual motor seating face, hardware tolerances, fastener/thread engagement, BREP solid interference under a justified pose, electrical interface, procurement, power-up or flight approval has been established.

## Next gated engineering milestones

- Identify BREP loop/edge geometries for each cylindrical face, classify through-hole versus counterbore/boss candidates, and reject ambiguous or partially split faces.
- Inspect the motor's support plane geometry around the 16 mm and 19 mm face families, including whether the cylinders connect via curved or stepped surfaces before reaching an axial plane. Record planar contact candidate data with **supporting topology**, not just proximity.
- Establish right-handed source-native frame↔motor datum transformations from physically justified mounting faces; distinguish 19 mm diameter/diagonal evidence from 19 mm side-spacing references.
- Run exact solid-level interference/clearance checks with toleranced machining/printing errors only after the mounting planes, mating parts and revisions are independently corroborated.

**Release: DRAFT. All manufacture/procurement, electrical, powered and flight approvals remain false.**
