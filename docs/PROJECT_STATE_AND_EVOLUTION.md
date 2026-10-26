# AeroForge project state and evidence-first roadmap

**As of 2026-10-23 | v3.7 draft | Research CAD only**

AeroForge's purpose is to make aircraft hardware configuration studies inspectable, reproducible, and honest about missing engineering evidence. It is **not** an aircraft design certification or flight-authority system. It must never derive physical-fit, procurement, electrical or flight approval from a single nominal CAD collision result.

## Current audited state

- **Software contracts:** A v3.7 single-arm, source-bound X500 V2 hypothetical AIR2216II replacement run plan and isolated OpenCascade worker are implemented. Tests exercise synthetic plans, refusal paths, Python bounded subprocess infrastructure, and Chromium source-gating.
- **Original model:** Prior source work records 244 original frame solid occurrences, 4 independent AIR motor CAD solids, and eight preexisting CAD motor occurrences in four coincident pairs. These are source model instances, *not* a verified physical BOM.
- **Historical geometric evidence:** v3.3 has 30 historical source solid-pair comparisons, 13 positives, and v3.4 groups 9 distinct positive model-geometry groups. The arm-1 historical masked view is not a freshly computed variant-specific Boolean.
- **Unverified:** Original operator-supplied STEP binaries are unavailable in the current development session; there is no newly executed v3.7 original-source BREP receipt, independently reproduced result, physical fit, real motor selection or flight-ready configuration.
- **Delivery:** PR #1 is a large multi-milestone draft. A passing synthetic CI build validates software behavior but **does not** establish source geometry or physical fit. Keep the existing PR draft while source execution and reviewability remain open.

## Reproducible evidence maturity model

Use these independent states for each **source pair + selected component instances + variant + pose**:

| State | Necessary evidence | Permitted claim |
| --- | --- | --- |
| `DESIGNED` | Spec, input schema and versioned plan | A test is specified, not performed |
| `CONTRACT_TESTED` | Synthetic positive/negative CI, deterministic provenance rules | Software contract behaves on tested fixtures |
| `SOURCE_EXECUTED` | Original source bytes rehashed, reimported, original occurrence crosswalk, all planned new source CAD checks completed or explicitly failed | One exact CAD analysis was actually executed; result may be blocked |
| `INDEPENDENTLY_REPRODUCED` | Fresh independent run with pinned tooling, per-solid identity witnesses and explainable numeric differences | Source CAD calculation is reproducible within stated tolerances |
| `PHYSICALLY_VERIFIED` | Authenticated purchased component identity, measured mechanical interfaces and fastening, tolerances, electrical checks and documented physical tests | Only the individually evidenced physical requirements are verified |

**Never infer a higher state from a lower one.** State should be stored per experiment, not globally on an aircraft. An interference-positive result is a model blocker even if the run is complete. Failure/timeout always prevents any model-clear result. Physical and flight authorizations are distinct and remain false unless separate engineering processes justify them.

### Four different identities

1. **File identity:** original STEP SHA-256 and byte hashes for the raw source reports and run plan.
2. **Assembly occurrence identity:** XCAF label/reference, parent occurrence path, placement transform, source part name, and source file identity. A repeated located instance is not automatically another purchased part.
3. **Geometry identity witness:** source BREP shape type, volume, centroid, AABB and optional topology summaries, with an explicitly pinned kernel/version and numeric comparison tolerance. A numeric witness is *not* a stable bytewise cross-kernel hash.
4. **Physical hardware identity:** manufacturer/part/revision, lot or source of purchase, measured interfaces and actual installed assembly. CAD files alone cannot authenticate this.

OCCT XDE distinguishes definitions from located component instances and can carry validation properties. Favor a typed occurrence registry and independent crosswalk instead of assuming flattened integer indices remain stable across all STEP readers.

References:
- https://github.com/Open-Cascade-SAS/OCCT/wiki/xde
- https://www.occt3d.com/dev/doc/overview/html/occt_user_guides__xde.html
- https://www.occt3d.com/dev/doc/overview/html/occt_user_guides__step.html

## Execution roadmap and release gates

### Gate A: qualify one source-backed execution (highest priority)

**Do not add more aircraft families until this is done.**

- Recover the two exact original operator STEP files and the original raw v3.3 source survey and v3.6 matching variant/plan. Recheck both source SHA-256 digests and every report-plan digest. Do not commit private/licensing-restricted CAD sources to the public repository.
- Pin Python, CadQuery, OCP/OCCT versions and operating system in a local run manifest.
- Reimport all 244 frame and 4 motor solid occurrences. Every selected member must be an actual bounded positive-volume solid. Record import order, shape characteristics and every relevant XCAF component occurrence path.
- Recompute the full 242 x 4 (968) original source AABB combinations. Compare the exact source index candidate set with the immutable plan. Disagreements must abort source qualification, not be resolved by manually pruning collision candidates.
- Execute all AABB-positive pairs as independent bounded jobs. Persist timeout, import/Boolean exception, geometry validity, status and model volume for each pair. The unselected source motor CAD instances remain in the hypothetical retained assembly.
- Validate the worker receipt through the same browser contract and produce a human-reviewable failure/coverage report. Do not announce physical fit from all-zero nominal CAD volumes.

**Exit:** One reproducible **original-source model-only result** with complete or expressly indeterminate pair coverage, per-pair artifacts and tooling metadata. Do not claim the selected alternative is physically usable.

### Gate B: independent geometry identity and sensitivity audit

- Compare per-solid numeric signatures and XCAF occurrence identity across the historical v3.3-v3.5 pipeline and the new v3.7 import. Explicitly report permutations, lost locations and duplicate instances.
- Reproduce source reimport, AABB pair sets and Booleans with an independent process and pinned versions. Do not assume that tolerances or source index order are portable.
- Run systematic translation/rotation perturbations and contact/tolerance sensitivity sweeps after a physically meaningful datum is identified. Track penetration, near-contact, clearance, and unresolved under separate fields, with units and provenance.
- Benchmark fresh-import-per-pair overhead, process peak memory and failures before changing the worker isolation strategy.

**Exit:** Numerically explained reproduction and identified model fragility, not a certified fit.

### Gate C: mechanically meaningful variant assessment

- Confirm manufacturer part revision and actual component dimensions; distinguish the source frame's DJ-2216-KV880 CAD references from the independently supplied AIR2216II candidate and from any current physical X500 kit.
- Build independent requirements for seats, hole patterns, screw threads and engagement, access for assembly, fastener/boss geometry, propeller envelope, electrical limits and thermal/mechanical constraints.
- Record nominal vs measured geometry and independent uncertainty sources. Mark every unmeasured requirement **unknown**, not passing.
- Support compare-and-review across each arm with explicit differences in model collisions and coverage.

**Exit:** Traceable physical requirement test reports; no generic flight approval.

### Gate D: product/platform hardening (after A and B)

The proposed stable architecture should be a small set of domain concepts rather than a new top-level module for every patch version:

```text
source adapters (STEP/XCAF now, other CAD later)
    -> source identity + assembly occurrence registry
    -> immutable experiment specification (variant, pose, requirements)
    -> bounded geometry workers (AABB, BREP, sensitivity)
    -> append-only evidence artifacts (provenance, failures, measurements)
    -> deterministic claim/evidence evaluator
    -> web viewer + reports + developer CLI
```

**Public API candidates:** `SourceAsset`, `ComponentDefinition`, `ComponentOccurrence`, `VariantManifest`, `GeometryJob`, `EvidenceArtifact`, `RequirementAssessment`. Avoid collapsing geometric compatibility into physical approval.

The first user-facing deliverable should be a **qualification report**, not a new rendering engine: show source identity, component membership, model geometry result, open evidence gaps, individual blocked requirements, numerical units, and a shareable redacted artifact. Preserve original model sources privately when licensing or access is unclear.

## Engineering discipline

- **Reviewability:** Keep PR #1 draft until its purpose and release scope are agreed. Do not interpret green tests as proof of nominal source fit. Subsequently use smaller PRs with one hypothesis, one acceptance contract, specific negative controls and bounded diff sizes.
- **Reproducibility:** Preserve immutable raw input/output evidence separately from ephemeral derived UI state. Never amend a historical measurement in place to make a new variant appear compatible.
- **Safety and security:** Treat imported STEP as untrusted, potentially resource-intensive input. Keep per-job timeouts, use execution sandboxes and memory limits as the workflow expands, and never execute untrusted source metadata as code.
- **CI structure:** CPU-only synthetic contract tests for every change; private opt-in original-source CAD suite with explicit source file hashes, machine specs and no private binary upload to public CI.
- **Performance:** Profile actual source workloads first. Batch or cache import only if it preserves termination guarantees and original occurrence identity.

## Decision rule for the next increment

Prioritize work that reduces uncertainty in an already stated engineering claim. A feature is not a reason to create a new version unless it delivers new verified evidence, a meaningful safety contract, or a substantially easier independently reproducible workflow.

**Immediate next action:** Complete Gate A's original-source execution and per-member identity crosswalk. Everything else is downstream.
