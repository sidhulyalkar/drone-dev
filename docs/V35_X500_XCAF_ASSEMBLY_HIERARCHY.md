# AeroForge v3.5 | Recovering the real STEP assembly hierarchy and naming the collision solids

**Status: original-source CAD evidence only. Draft PR. Not a qualified physical BOM, motor substitution, repair procedure, fastening specification, motor/ESC pairing, procurement or flight approval.**

## Source identity and historical revision

Two unchanged locally held, originally published STEP files were inspected:

| Original source | Operator-acquired SHA-256 | STEP header / export metadata |
| --- | --- | --- |
| `x500v2-frame.step` | `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360` | AP214 `AUTOMOTIVE_DESIGN`, Autodesk Translation Framework, 2022-07-19 |
| `AIR2216II_Motor_3D.STEP` | `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15` | AP203 `CONFIG_CONTROL_DESIGN`, SolidWorks 2022 / SwSTEP 2.0, file timestamp 2025-04-17 |

These timestamps and product names are **inside source CAD metadata**, not a manufacturer-certified physical revision. The publicly available Holybro documentation currently describes an X500 V2 Development Kit with **four Holybro 2216 KV920 motors**, whereas older PX4 documentation names **2216 KV880 (V2 Update)**. Thus a published frame STEP, downloaded separate motor STEP and current product catalog **must not be silently treated as one same-revision fitted assembly**.

Public sources for provenance comparison:

- https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download (source file listing)
- https://holybro.com/products/px4-development-kit-x500-v2 (kit specification, four 2216 KV920 motors)
- https://docs.px4.io/v1.14/en/frames_multicopter/holybro_x500V2_pixhawk5x (historical four 2216 KV880 motors)

Verify exact SKU, revision and actual purchased kit configuration directly before any physical approval.

## Recovered original STEP product/occurrence hierarchy

The OpenCascade `STEPCAFControl_Reader` with XCAF label tools now recovers from the uploaded *frame STEP*:

- **One** top-level original source assembly, XCAF name `(Unsaved)`
- **111** named top-level source **occurrences** (not 111 independently certified component types)
- **244** leaf solid occurrences after recursively expanding nested assembly component references
- **Four** `HMX5V-ARM-V1_ASM` arm assembly instances, each with 27 flattened original source-solid leaves
- Source component names, definition label, instance label, full parent assembly name/label path and source-native geometry bounds for **every single flat original source solid index**

The existing flattening code also returned 244 solids. The v3.5 offline generator cross-checks the original XCAF depth-first leaf order against all **244 original v2.8 flat-solid source AABBs**, and independently verifies source-file SHA-256. It does not rely on the number alone: every non-duplicate original flat solid's nearest XCAF source bounds resolve to its original index; the four coincident duplicates resolve to the first original geometry occurrence. The differently computed source bounding-box inflation can differ by as much as **5.729503 mm**, so *AABB proximity is not a tolerance or a mechanical fit certification*. Detailed TShape/placed-vertex coincidence remains documented by the earlier v3.4 exact BREP audit.

## Critical original CAD discovery: two representations of the four existing motor-model locations

The XCAF source reports the motor definition `DJ-2216-KV880` eight times, twice at each of four corresponding CAD locations. The four nested arm-assembly motor leaves are:

| Frame flat solid | Source path |
| ---: | --- |
| 56 | `HMX5V-ARM-V1_ASM:1 / DJ-2216-KV880:1` |
| 83 | `HMX5V-ARM-V1_ASM:2 / DJ-2216-KV880:1` |
| 110 | `HMX5V-ARM-V1_ASM:3 / DJ-2216-KV880:1` |
| 137 | `HMX5V-ARM-V1_ASM:4 / DJ-2216-KV880:1` |

The second set is directly under the top-level assembly:

| Frame flat solid | Name | Spatially coincident source CAD reference |
| ---: | --- | ---: |
| 189 | `DJ-2216-KV880:3` | 56 |
| 191 | `DJ-2216-KV880:5` | 83 |
| 190 | `DJ-2216-KV880:4` | 110 |
| 188 | `DJ-2216-KV880:2` | 137 |

All eight refer to the same *source CAD motor-model definition label* `0:1:1:25`. Original v3.4 BREP TShape, orientation, placed bounding-box and vertices independently established the **four coincident source geometry groups**.

**This does NOT establish that eight physical motors ship in a quadcopter.** In the manufacturer's STEP export, the same *modeled* motor geometry is referenced once within each arm assembly and once directly at root. These are source-assembly occurrences; whether duplicate representations, variants or other CAD-export reasons require authentic BOM/assembly evidence.

The other supplied original motor file is called **AIR2216II**. Its origin, CAD construction, and part revision are distinct from the embedded `DJ-2216-KV880` frame-model label. Physical interchangeability is **unverified**.

## Attribution of the nine distinct modeled collision groups

The earlier unaltered v3.3 exact BREP batch compared 30 original frame/motor source-solid pairs. v3.4 grouped four coincident source occurrence duplicates while preserving every original pair, yielding **26 distinct geometry pairs with nine positive modeled intersection groups**. v3.5 resolves the named source components for those nine positives:

| Named source component family | Distinct positive geometry pairs | What that means |
| --- | ---: | --- |
| `DJ-2216-KV880` | **4** | The separately positioned AIR2216II CAD intersects already modeled existing source-motor geometry |
| `BAN-DJ-DIAN-F2` | **1** | A named component in the motor-mount region intersects AIR2216II model geometry |
| `GB70-M3-6` | **4** | Four similarly named, fastener-like source CAD occurrences overlap the candidate motor model |

These names are source STEP names. `GB70-M3-6` suggests a screw family but **does not certify thread, length, material, hole tapping, or any actual fastener**. `BAN-DJ-DIAN-F2` is treated as *bracket-like* by name only. The nine original geometry-distinct positive intersection groups remain modeled interference findings.

The source case `frame-quadrant-nn-orientation-1-motor-plane-28-frame-plane-103` remains **unapproved**. A future true *replacement* assembly must intentionally state what modeled source components correspond to the old motor and its mounting hardware. It must never simply suppress the `DJ-2216-KV880` or `GB70-M3-6` solids to make CAD Booleans pass.

## Browser and source verification

The Engineering panel is an **optional, read-only** XCAF hierarchy viewer. Required operator files are:

1. Both original frame and motor STEP + verified GLB + visual manifest pairs (unchanged)
2. Original v2.9 source-cylinder feature report, v3.0 BREP planar adjacency, v3.1 source contour report
3. v3.2 independent in-plane reference report, v3.3 original-source 64-pose report and 30-pair exact Boolean evidence
4. v3.4 source repeated-geometry occurrence audit
5. Original v2.8 `x500v2-frame.measured-inventory.json`, and this v3.5 `x500-xcaf-assembly-identity.v35.json`

The browser first hashes the exact earlier source reports, then checks the original v3.5 receipts. It iterates and validates **all 244 individual source leaf labels / parent paths and corresponding source flat-solid bounds**, independently recomputes the 26 original canonical collision groups' names from the existing v3.4 model evidence, and rejects any claim of an independently approved OEM BOM, purchased motor count, AIR2216II substitution, manufacture or flight.

It displays a searchable list of the named source parts, the original source assembly paths, and all 26 collision groups with original source model volumes. It never deletes source solids, modifies the underlying 3D mating proposal or qualifies a replacement.

### Reproduction

The source generator can be reproduced locally against the exact original source file bytes and linked reports:

```bash
python tools/x500_xcaf_assembly_inventory_v35.py \
  --frame-step /original/x500v2-frame.step \
  --motor-step /original/AIR2216II_Motor_3D.STEP \
  --v28-inventory /private/x500v2-frame.measured-inventory.json \
  --v34 /private/x500-source-occurrence-audit.v34.json \
  --out /private/x500-xcaf-assembly-identity.v35.json
```

The command rejects unknown/missing original sources, changed predecessor receipts, mismatched leaf/flat order, incorrectly paired motor instances or falsely elevated approvals. It refuses to overwrite an earlier output. An independent reviewer may also inspect the original AP214 product-instance graph through XCAF.

## Next milestone: explicit replace-versus-retain variant and validated hardware evidence

The next system should capture an independent BOM/revision receipt and ask whether the operator is investigating a **frame-only build, existing-kit motor retention, or explicitly proposed replacement**. Each choice must retain its own source identity and unknowns. Excluding replaced old-motor geometry from a *separate hypothetical replacement test* is only meaningful with independent verified part identities and still requires full BREP collision screening with bracket, hardware and all other retained components.

Never promote replacement intent into source CAD edits, a recommended screw, signed mechanical fit, procurement, power-on or flight release. Obtain OEM motor base datum, mounting/thread specification, actual physical presence and 2022 vs 2025 vs currently sold revision mapping first.

**All physical/manufacturing/procurement/power/flight approvals remain false; PR stays DRAFT.**
