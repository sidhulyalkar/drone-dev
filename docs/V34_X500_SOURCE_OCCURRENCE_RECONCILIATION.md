# AeroForge v3.4 | Original-source coincident BREP occurrence audit

**Release: DRAFT. Source-CAD geometry investigation, NOT a manufacturer BOM, physical fit, fabrication release, powered-system approval or flight clearance.**

## Why v3.4 was needed

In v3.3 the selected candidate motor orientation produced **30** conservative AABB-positive frame/motor solid pairs. A completed independent exact OpenCascade Boolean evaluation observed **13 positive-volume CAD-model intersections**. Four of those 13 came from nearly identical positive overlap volumes for source-frame solid **56** and source-frame solid **189**. We investigated the original STEP occurrences rather than assuming either a genuine duplicate physical part or two separate obstructions.

This matters because a CAD export may contain multiple occurrences of one source shape at different locations, more than one occurrence at the *same* location, or alternative assembly variants. A reliable engineering system must distinguish those without deleting geometry from a real assembly.

## Exact source and lineage

- Original user-uploaded frame `x500v2-frame.step` SHA-256: `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360` (244 imported solids)
- Original user-uploaded motor `AIR2216II_Motor_3D.STEP` SHA-256: `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15` (4 imported solids)

Hashes identify operator-acquired source file bytes, **not manufacturer authenticity**. v3.4 also records SHA-256 for the exact v3.3 64-pose survey JSON and the complete 30-pair supervised exact BREP Boolean JSON. The browser verifies both reports as part of the existing original STEP/GLB and v2.9–v3.2 linked report chain, then recomputes all v3.4 aggregate values from the preserved original v3.3 rows.

## Source-BREP coincidence method

The offline `tools/x500_source_occurrence_audit_v34.py` tool reimports the original frame STEP in the same CAD importer/source-native order. It considers **all 244 × 243 / 2 frame-solid pairs**, and requires ALL of these for one source-only repeat group:

1. `TopoDS_Shape.IsPartner` confirms a shared original underlying BREP `TShape` definition, not just similar mass or appearance
2. Identical topological orientation and source placement transformation, within **1e−6 mm** for positional entries
3. Identical placed bounding-box coordinates within **1e−6 mm**
4. Bidirectional spatial nearest-neighbor agreement among all original-source placed BREP vertices within **1e−6 mm**

**Using `IsPartner` alone is incorrect.** For example, source solids 57 and 58 share a TShape but are distinct physical-space placements separated by approximately 19 mm. Sorting almost-equal vertex coordinates lexicographically is also incorrect for symmetric parts: tiny numerical jitter can change the ordering. The actual audit uses a bidirectional nearest-neighbor spatial test instead.

### Original-source occurrence finding

| Canonical frame solid | Second coincident occurrence | Placement/vertex difference |
|---:|---:|---|
| 56 | 189 | Within about 8 × 10⁻¹² mm |
| 83 | 191 | Within about 8 × 10⁻¹² mm |
| 110 | 190 | Within about 8 × 10⁻¹² mm |
| 137 | 188 | Within about 8 × 10⁻¹² mm |

These are **four pairs of coincident BREP CAD occurrences**. The original model still has **244 source solid occurrences**, but **240 distinct placed-geometry groups** under this deliberately strict criterion.

There is no independent evidence yet that a pair maps to one or two physical manufactured components. The audit marks every `samePhysicalPartConfirmed` flag **false** and `unresolvedOEMPhysicalPartMultiplicity` **true**.

## Exact BREP collision evidence: two faithful views

For the same unchanged v3.3 pose, `frame-quadrant-nn-orientation-1-motor-plane-28-frame-plane-103`:

| Measure | Original source occurrences | Geometrically distinct groups |
|---|---:|---:|
| CAD frame entities in uploaded STEP | 244 | 240 |
| Source-frame/motor exact Boolean comparisons | **30** | **26** |
| Pairs with positive source-model intersection volume | **13** | **9** |
| Largest pairwise positive source-model volume | 5,491.38771511 mm³ | 5,491.38771511 mm³ |

The **original 30 Boolean measurements are never edited or removed**. The 26-row derived view keys each test by its original-source *coincident-geometry group* and original motor solid index. For a group with more than one original occurrence, the record contains all source row identifiers and **minimum, maximum, and numerical spread** of the previously measured Boolean volumes. It uses the **maximum** as the conservative value and marks the group collision-positive if **any** original occurrence was positive.

For source solid 56 and 189 against motor solid 2, ideal-model Boolean volume differed slightly (`4637.12635314` versus `4637.12628632` mm³, about `0.00006682` mm³) despite coincident source geometry. That is preserved as a kernel-numerical disagreement, not silently reconciled or interpreted as a physical difference.

Importantly, **nine geometrically distinct positive-intersection groups remain**. This is still a failed/blocked source-model mounting pose, not a newly compatible candidate. Grouping source CAD occurrences does not resolve collisions of the actual individual parts. Manufacturer part-count evidence, assembly variant selection and toleranced fit remain unverified.

## Reproduce original evidence

With CadQuery 2.8+, scipy, the unchanged original frame STEP and your private v3.3 JSON reports:

```bash
python tools/x500_source_occurrence_audit_v34.py \
  --frame-step /path/to/x500v2-frame.step \
  --survey /private/x500-source-contact-hypotheses.v33.json \
  --boolean /private/x500-source-brep-batch-probe.v33.json \
  --out /private/new-x500-source-occurrence-audit.v34.json
```

The offline auditor hashes original bytes, fails closed on a mismatched source or incomplete/changed 30-pair result, and refuses to overwrite prior evidence.

### Engineering browser workflow

In the previously established Engineering → Frame ↔ motor CAD registration study, hash-verify both local original STEP/GLB pairs and the full v2.9 → v3.3 evidence chain. Add `x500-source-occurrence-audit.v34.json`. The browser validates the v3.4 original source and exact v3.3 survey/Boolean report hashes; validates all four coincidence groups and their spatial witnesses; then independently rebuilds all 26 canonical collision-pair groups from the **raw preserved 30 Boolean rows**.

Expand **Inspect four coincident CAD occurrence groups and unchanged model collisions**. Each row shows which original source solids are grouped, which motor solid was involved, the conservative maximum modeled intersection volume and explicit unqualified physical status.

The viewer does not hide original geometry from the 3D study, does not suppress collision findings and does not change hardware orders or a manually proposed assembly pose.

## What remains unknown and must be verified

- **Manufacturer BOM and assembly hierarchy**: the STEP flat-solid import cannot independently prove one versus two physical parts, assembly variants or intentional duplicate/alternate representations
- **Actual selected hardware revision and mounting orientation**: candidate motor planes 28/33 remain unqualified physical contacts
- **Mechanical fasteners**: threads, diameters, attachment lengths, washers, underside clearance and slot travel
- **Complete physically selected assembly**: reconcile original solids to actual components, then rerun independent exact BREP solid intersections, tolerances and attachment checks under candidate *approved-for-test* configurations
- **Power/flight gates**: motor/ESC power, battery protection, propeller clearance and flight safety remain independently blocked

**All geometry-only, BOM, physical fit, procurement, power and flight approvals remain false. PR #1 stays draft.**
