# AeroForge v3.7 | Original-source, variant-specific bounded BREP execution

**Draft, research-only. No physical fit, manufactured-part identity, fastener/thread, electrical or flight approval.**

## Purpose and evidence status

AeroForge v3.6 can produce *hypothetical assembly composition plans*, but did not actually reimport the original STEP files, rebuild a selected assembly or execute any variant-specific Boolean. v3.7 closes that software gap with a **complete source-bound execution contract, offline bounded worker, and browser result-review protocol**. It does not imply that a new CAD intersection has already been performed.

The original operator-uploaded X500 frame `x500v2-frame.step` SHA-256 `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360` and independent `AIR2216II_Motor_3D.STEP` SHA-256 `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15` were previously verified and studied. **Both original STEP binaries are unavailable in this session; no new source Boolean run was executed.** Previous source-hash receipts are not a substitute for reimporting those original binary models when a fresh BREP calculation is required.

The original frame XCAF source contains 244 solid occurrences, including four pairs of coincident `DJ-2216-KV880` model instances. The separately supplied AIR2216II CAD is an independently unqualified replacement candidate. v3.7 does not change that motor identity or grant a manufacturer BOM.

## Pipeline

<escape>Original v2.8–v3.5 source reports and exact original STEP/GLB receipts
→ verified v3.6 hypothetical replacement plan at exactly one arm
→ select one original v3.3 opposing-normal 3D source pose for that arm
→ immutable v3.7 run-plan JSON with original SHA-256 receipts and 242 retained frame indices + 4 motor indices
→ reimport BOTH original STEP binaries in a separate CAD worker
→ recompute bounding boxes for all 242 × 4 source-solid combinations
→ require exact match against the planned conservative AABB pair set
→ execute each screened source pair in a new bounded OpenCascade process
→ immutable v3.7 BREP result with positive/zero/failed/timeout status for every attempted pair
→ separate browser reviewer and explicit physical-fit NOT APPROVED.</escape>

### Plan content and invariants

`core/x500_variant_exact_brep_v37.mjs` builds a run plan only from an original-source verified v3.6 hypothetical replacement and matching v3.3 contact-pose browser review. It rejects unknown arms, source hashes, extra/deleted motor occurrences, reflected/non-orthonormal 3D poses, incorrectly paired source motor/plate faces, wrong arm location, missing v3.3 AABB pair records and elevated physical approval flags.

It includes **all 242 retained original frame solid indices** (244 minus the two same-place source motor occurrences at the selected arm), **all four independent motor source solid indices**, and each source AABB candidate pair. The old-motor exclusion applies only to the *imaginary test assembly*; the original frame STEP remains unmodified.

The motor face and frame face remain **geometric orientation hypotheses**, not physical manufacturer-approved contact seats. The existing reported geometry is source CAD from potentially different hardware revisions; dimensional and tolerance qualifications remain separate.

### Offline execution

In Engineering → Frame ↔ motor CAD registration study, after verifying the complete v2.8–v3.5 original-source evidence chain, expand **Plan new bounded BREP checks for one hypothetical replacement**. Select one arm and opposing-normal pose. Save **both** matching files:

1. `x500-arm-arm-1-source-variant.v36.json` (precise JSON bytes hash-linked to the next plan)
2. `x500-arm-arm-1-exact-brep-request.v37.json` (immutable source/membership/pose and candidate pair execution request)

Use those exact unmodified JSON bytes, the original v3.3 raw source contact report and the original two STEP binaries in a local CAD environment with CadQuery, OCP and Python 3.11+:

```bash
python3 tools/x500_variant_brep_runner_v37.py \
  --plan "/private/x500-arm-arm-1-exact-brep-request.v37.json" \
  --variant "/private/x500-arm-arm-1-source-variant.v36.json" \
  --source-survey "/private/x500-source-contact-hypotheses.v33.json" \
  --frame-step "/original/x500v2-frame.step" \
  --motor-step "/original/AIR2216II_Motor_3D.STEP" \
  --screen-timeout 150 \
  --worker-timeout 90 \
  --out "/private/x500-arm1-original-source-brep-result.v37.json"
```

Run the supervisor from a **fresh CAD-free parent interpreter** on POSIX (macOS/Linux). The screen and each Boolean execute in separate subprocess groups with hard timeouts and group termination. `--max-pairs N` allows a **partial diagnostic run**, which is recorded as incomplete, never as full clearance. The supervisor refuses to overwrite existing results.

When original source AABB recomputation differs from the v3.3 preflight, the tool stops with **INDETERMINATE** rather than silently omitting pairs. Source import schema, OpenCascade tolerances, and BREP kernel build may affect AABB conventions: those should be investigated and version-pinned on the real original source, not weakened by arbitrarily dropping spatial candidates. The raw worker path cannot be fully qualified before the original STEPs are re-uploaded and a real run completes.

Per-pair statuses:

| Status | Meaning |
| --- | --- |
| `MODEL_POSITIVE_INTERSECTION` | Model-only OpenCascade intersection volume is above the explicit 0.0001 mm³ threshold |
| `MODEL_ZERO_INTERSECTION` | No positive intersection volume over that threshold, **only for this one ideal CAD pair and pose** |
| `INDETERMINATE_TIMEOUT` | Worker did not finish in its hard limit, with no reported model volume |
| `INDETERMINATE_WORKER_ERROR` | CAD import, Boolean, result parse or subprocess error; cannot claim clearance |

Any skipped pair is represented by a partial manifest with `complete=false`; no result volume is invented for it.

### Browser post-run inspection

Select the source-hash-matched returned v3.7 worker result JSON in the same expanded v3.7 panel. The browser checks:

- Original STEP SHA-256 identities, exact SHA-256 of the **whole exported v3.7 run-plan bytes**, correct source pose and target arm
- Full 244 original frame-solid accounting, precisely 242 selected frame members and four selected motor members
- A fresh source AABB scan confirming **the identical candidate pair identity set**
- Every individual BREP pair source index, collision/timeout/failed classification, and absence of duplicate or unsanctioned original source solids
- Negative physical/manufacturing/procurement/power/flight approval flags

The viewer reports one of three **model-only** summary classes:

- `MODEL_INTERFERENCE_PRESENT`: at least one positive actual CAD model volume was observed; physical mounting is not approved
- `ALL_SCREENED_MODEL_PAIRS_ZERO_NOT_PHYSICAL_FIT`: all expected source candidates were run to completion without positive modeled intersection, still **not proof of real-world fit**
- `INDETERMINATE_INCOMPLETE_OR_FAILED_BREP`: any attempted timeout/failure or incomplete pair set, without converting failure into clearance

The original v3.3 30-pair Boolean evidence, v3.4 occurrence reconciliations and v3.5 hierarchy stay unchanged. Nor does the v3.7 result alter an actual 3D mating proposal or source CAD geometry.

## Conservative AABB coverage guard (source-qualification blocker)

The original v3.3 AABB predicate required a positive interval overlap greater than a small numeric threshold (1e-5 source-native mm). That predicate is reproducible but is not conservative for exact contact or sub-threshold penetration. The v3.7 offline source reimport now computes **two** AABB candidate sets across the full 242 x 4 source-solid combinations:

1. **Historical strict candidate set:** matches the immutable v3.3-selected index pairs and allows historical comparison.
2. **Conservative near-contact candidate set:** also includes touching boxes and boxes separated by up to a 1e-5 mm screening margin. This is intentionally an overapproximation, not a physical tolerance or machining clearance.

The worker **fails closed** before any nominal-clearance receipt if those sets differ, because the v3.7 plan has not authorized checks for additional conservative candidates. A detected difference is a **plan coverage defect/indeterminate result**, even when all previously planned pair Booleans would be zero. Do not delete the new pairs or widen a tolerance just to pass. A follow-up source-bound plan revision must include all conservative candidates and freshly evaluate them before claiming complete model coverage. This may reveal contacts in the original STEP assembly when the source binaries become available; no such result has yet been obtained.

## v3.7 preflight and result hardening

The offline supervisor now uses a strict JSON decoder for source-bound plans, variants and source surveys. Duplicate JSON keys and non-finite JSON constants are rejected instead of allowing two readers to disagree about input meaning. Before CAD import, the worker also cross-checks the v3.5 assembly-report receipt with the variant lineage, all four original motor-assembly occurrence records, original and proposed motor names, exact excluded site, unchanged historic collision evidence, and hypothetical-only approval flags. These checks cannot independently authenticate manufacturer part revisions.

Fresh screen output must contain integer source-solid indices belonging to the selected variant and its independent motor source. The browser also rejects stringified pair indices rather than silently coercing them to numeric identifiers. All failures still block model-only clearance; no new fit claim is made.

The CPU-only tests exercise intentionally synthetic and tampered metadata with STEP verification mocked **only inside the test**. They do not replace the mandatory fresh hash verification, original-source CAD reimport, exact BREP run, or per-arm physical checks. In particular, the real-source CadQuery/OCP import ordering and transformed AABB conventions remain pending validation with the actual source binaries.

## Tests and qualification boundaries

Node synthetic tests verify four correctly scoped arm masks; necessary frame mounting plate remains present; other three arms' source-motor occurrences remain intact; no reused v3.3 result; right-handed continuous poses; full Boolean pair accounting; negative and positive model-only statuses; timeout handling; and false physical/BOM claim rejection.

Pure-Python tests cover original file hash rejection, source-native orthonormal transforms, source AABB geometry, pair-index handling and process-group isolation infrastructure. Chromium confirms no v3.7 planner is available without original v3.3 contact and v3.5 assembly evidence.

**Still necessary before actual physical assembly fit qualification:** real purchased X500 frame revision, motor model/ESC data, OEM mounting/contact face identity, authentic fastener-thread/washer/bolt engagement specifications, as-manufactured tolerances, source representation/BOM selection, rotor and center-of-gravity clearance, electrical integration and supervised testing. No new BREP result alone can satisfy these.

**Keep draft PR #1 unmerged and every physical/procurement/power/flight approval false.**
