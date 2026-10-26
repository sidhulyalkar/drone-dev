# AeroForge v3.7 | Original-source, variant-specific bounded BREP execution

**Draft, research-only. No physical fit, manufactured-part identity, fastener/thread, electrical or flight approval.**

## Purpose and evidence status

AeroForge v3.6 can produce *hypothetical assembly composition plans*, but did not actually reimport the original STEP files, rebuild a selected assembly or execute any variant-specific Boolean. v3.7 closes that software gap with a **complete source-bound execution contract, offline bounded worker, and browser result-review protocol**. It does not imply that a new CAD intersection has already been performed.

The original operator-uploaded X500 frame `x500v2-frame.step` SHA-256 `e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360` and independent `AIR2216II_Motor_3D.STEP` SHA-256 `ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15` were previously verified and studied. **Both original STEP binaries are unavailable in this session; no new source Boolean run was executed.** Previous source-hash receipts are not a substitute for reimporting those original binary models when a fresh BREP calculation is required.

The original frame XCAF source contains 244 solid occurrences, including four pairs of coincident `DJ-2216-KV880` model instances. The separately supplied AIR2216II CAD is an independently unqualified replacement candidate. v3.7 does not change that motor identity or grant a manufacturer BOM.

## Recover original source data without changing historical evidence

The manufacturer publicly lists both `x500v2-frame.step` and `AIR2216II_Motor_3D.STEP` at [Holybro's X500 V2 download page](https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download). Download them into a **private local directory**, not the public repository. This does not independently authenticate a purchased motor revision.

On macOS/Linux, verify the exact historical file identities:

```bash
shasum -a 256 /private/cad/x500v2-frame.step
# Expected: e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360

shasum -a 256 /private/cad/AIR2216II_Motor_3D.STEP
# Expected: ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15
```

**Stop if either hash differs.** The public manufacturer's current downloadable revision is not necessarily byte-identical to the previously studied original. Do not rename or alter changed source bytes and claim they are the historical geometry; create a new versioned source-identity experiment instead. The v3.3 raw survey, v3.5 XCAF report, v3.6 variant and matching v3.7 JSON plan are separately required. Recreating missing reports requires executing their documented earlier stages against the verified exact original source.

The public download page was located, but the two files were **not** re-downloaded or rehashed in this development session, and the original v3.3 survey is still unavailable here. No new source-backed Boolean result is implied. Review the original author's licensing and redistribution terms before sharing data or artifacts.

## Pipeline

<escape>Original v2.8–v3.5 source reports and exact original STEP/GLB receipts
→ verified v3.6 hypothetical replacement plan at exactly one arm
→ select one original v3.3 opposing-normal 3D source pose for that arm
→ immutable v3.7 run-plan JSON with original SHA-256 receipts and 242 retained frame indices + 4 motor indices
→ reimport BOTH original STEP binaries in a separate CAD worker
→ recompute bounding boxes for all 242 × 4 source-solid combinations
→ require exact historical v3.3 pair-set match AND an independent conservative near-contact guard (any extra contact blocks v3.7 clearance)
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
| `MODEL_POSITIVE_INTERSECTION` | Strictly positive OpenCascade modeled intersection volume **above** the 0.0001 mm³ reporting threshold; modeled interference blocker |
| `MODEL_ZERO_INTERSECTION` | Numerically **exactly 0 mm³** from the finished Boolean at this specific ideal CAD pose. Does not rule out tangential contact or physical interference |
| `INDETERMINATE_SUBTHRESHOLD_INTERSECTION` | Positive measured modeled volume in the interval (0, 0.0001] mm³. Preserve its numeric value but **never classify it as zero** |
| `INDETERMINATE_NONVOLUMETRIC_CONTACT` | OpenCascade returned nonempty face, edge or vertex contact with **zero modeled solid volume**, or an anomalous zero-volume result containing solids. Preserve the 0 mm³ measurement, but **never infer separation** |
| `INDETERMINATE_GEOMETRIC_CONTACT` | Boolean reports 0 mm³ but an **independent BRepExtrema distance query** measures a zero or near-zero gap (≤ 0.00001 mm). Preserve the gap in `modelMinimumDistanceMm`; never call it separated |
| `INDETERMINATE_TIMEOUT` | Worker did not finish in its hard limit; modeled volume unknown (null) |
| `INDETERMINATE_WORKER_ERROR` | CAD import, Boolean, result parse or subprocess error; modeled volume unknown (null) |

Any skipped pair is represented by a partial manifest with `complete=false`; no result volume is invented for it.

**Stricter numeric evidence contract:** Earlier pre-v3.7-hardening receipts might have represented a small positive volume as `MODEL_ZERO_INTERSECTION` using the historical 0.0001 mm³ threshold. Those receipts are now intentionally rejected by the browser reviewer. Re-run the bounded worker to obtain an explicit `INDETERMINATE_SUBTHRESHOLD_INTERSECTION` with the actual positive volume. A worker that completed all *attempts* may still have a non-clear modeled summary when any subthreshold, timeout, or worker-error row remains. The threshold is a numerical classification boundary, not a manufacturing tolerance.

### Browser post-run inspection

Select the source-hash-matched returned v3.7 worker result JSON in the same expanded v3.7 panel. The browser checks:

- Original STEP SHA-256 identities, exact SHA-256 of the **whole exported v3.7 run-plan bytes**, correct source pose and target arm
- Full 244 original frame-solid accounting, precisely 242 selected frame members and four selected motor members
- A fresh source AABB scan confirming **the identical candidate pair identity set**
- Every individual BREP pair source index, collision/timeout/failed classification, and absence of duplicate or unsanctioned original source solids
- Negative physical/manufacturing/procurement/power/flight approval flags

The viewer reports one of three **model-only** summary classes:

- `MODEL_INTERFERENCE_PRESENT`: at least one positive actual CAD model volume was observed; physical mounting is not approved
- `ALL_SCREENED_MODEL_PAIRS_ZERO_NOT_PHYSICAL_FIT`: all expected source pairs have exactly zero reported model intersection volumes, still **not proof of real-world fit**
- `INDETERMINATE_INCOMPLETE_OR_FAILED_BREP`: any attempted timeout/failure or incomplete pair set, without converting failure into clearance

The original v3.3 30-pair Boolean evidence, v3.4 occurrence reconciliations and v3.5 hierarchy stay unchanged. Nor does the v3.7 result alter an actual 3D mating proposal or source CAD geometry.

## Exact Boolean topology and nonvolumetric contact guard

The isolated v3.7 CAD worker now verifies the imported source-solid topology using CadQuery's OpenCascade validity check, as well as positive volume and bounded dimensions. A shape count of 244/4 alone never establishes that the import is valid.

After applying the selected source-native rigid pose, the worker first validates that the transformed candidate motor is still a non-null topologically valid solid; if it is not, the pair fails. Before interpreting any BRepAlgoAPI_Common result volume, the worker requires a successful Boolean build, checks the resulting BREP with `BRepCheck_Analyzer(...).IsValid()`, and inspects the returned solid and lower-dimensional topology. An invalid Boolean result **blocks** the pair as a worker error. A null or truly empty valid result may be classified `MODEL_ZERO_INTERSECTION`, but a nonempty surface/edge/vertex-only result or a zero-volume result containing solids becomes `INDETERMINATE_NONVOLUMETRIC_CONTACT`. Such results must never lead to an all-zero clearance claim. The per-pair JSON preserves an exact numerical `0` for this contact state, separate from the `null` values used for timeouts and worker errors.

This is intentionally strict. Some original STEP geometry may not pass these validity checks or may be represented differently by different OpenCascade builds. Do not disable the checks merely to obtain a green result: record the kernel and failure, inspect exact source shape identities and rerun under a pinned environment. CPU-only tests confirm the **classification contract** without importing original STEP. They do not demonstrate the real model has valid topology, reliable contact semantics, or physical fit.

## Portable, redacted model-evidence report

After selecting a v3.7 worker-result JSON in the browser, the panel now offers **Export source-redacted model evidence report JSON**. The button stays disabled until the existing v3.7 reviewer accepts the worker receipt and independently recomputes the complete model summary from its input fields. If the selected arm/pose or source verification changes, the export is revoked immediately.

The report is generated by `core/x500_variant_evidence_report_v37.mjs`. It is a **deterministic presentation artifact**, not a second CAD engine, a fresh Boolean calculation or independent attestation. It contains:

- `exactPlanJsonSha256` and **the SHA-256 of the uploaded worker-result file's exact bytes**, plus original source STEP hashes and selected pose/site identifiers
- All **planned** source-solid pair IDs in the original plan order, including explicit `NOT_EXECUTED` rows when a partial receipt omitted pairs
- Per-pair model volume and minimum-distance measurements, with `null` where not measured; independent gap witnesses remain mandatory for `MODEL_ZERO_INTERSECTION`
- Counts of modeled separation, positive overlap, ambiguous contact, worker errors and missing pairs, plus a model-only summary that never promotes an incomplete run to conclusive separation
- Separate, **NOT_VERIFIED** requirements for assembly occurrence crosswalk, motor identity/revision, mating faces, fasteners, tolerances, electrical compatibility, propulsion/loading and flight safety
- `sourceExecutionIndependentlyAttested:false`, `independentlyReproduced:false`, and negative hardware/physical/electrical/flight approval flags

It does **not** embed original STEP bytes, the raw historical surveys, source coordinate transforms or manufacturer proprietary geometry. Source-derived pair IDs and measured volumes/distances may still carry license or confidentiality restrictions, so **review before sharing**.

**Critical trust distinction:** The SHA-256 values authenticate the identity of the *submitted bytes*, not the fact that a CAD run occurred. A self-authored JSON matching the expected schema cannot prove original source acquisition, OpenCascade execution, independently reproducible solid identities, physical fit or flight readiness. A genuine source-backed experiment and its kernel build must be independently audited outside the browser. A fully model-separated report is still evidence of **one nominal pose only**, not a certified physical clearance.

### Independently verify a portable report's *internal consistency*

A second engineer can independently re-hash the **exact v3.7 plan JSON bytes** and **exact worker-result JSON bytes** and recompute the browser's entire redacted report using the Node.js CLI. This is useful for review without needing access to the private STEP binaries.

```bash
node tools/verify_x500_model_report_v37.mjs \
  --plan "/private/x500-arm-arm-1-exact-brep-request.v37.json" \
  --receipt "/private/x500-arm1-original-source-brep-result.v37.json" \
  --report "/private/x500-arm-1-model-evidence.v37.json"
```

Equivalent project command: `npm run evidence:verify -- --plan PLAN.json --receipt WORKER.json --report REPORT.json`.

The verifier reads bounded regular, non-symlink files, recalculates SHA-256 digests of both input byte streams, validates source-linked pair/status fields via the existing v3.7 browser contract, regenerates the deterministic report, and requires the supplied report **bytes** to match its canonical JSON export. Modifying any reported status, volume, distance, approval flag, source identity, plan, or receipt will cause a nonzero exit unless all interdependent evidence is also recomputed. Tests exercise genuine CLI subprocess execution and both positive and adversarial fixtures.

A successful verifier output says `CONSISTENT_SUBMITTED_RECEIPT_NOT_SOURCE_ATTESTATION`. This is **not** proof that the worker genuinely ran or that the operator possessed matching STEP geometry: an adversary can create mutually consistent but fictional files. True original-source qualification still needs independent source acquisition, geometry and XCAF identity witnesses, OCCT execution records, and appropriate physical validation. The CLI does not modify source files or write a replacement report.

## Independent distance witness for model-zero BREP results

**Actual OpenCascade kernel finding:** `BRepAlgoAPI_Common` can return a valid, *empty* `COMPOUND` for two touching solids. That exact same kind of empty result can occur for two geometrically separated solids. Therefore, checking only `Common.IsDone()`, `BRepCheck_Analyzer(...).IsValid()`, topology explorers and zero volume **does not prove the original solids are separated**.

The v3.7 worker now executes `BRepExtrema_DistShapeShape` for every Boolean pair initially classified as `MODEL_ZERO_INTERSECTION`. A successful query must report a finite, nonnegative model minimum distance and at least one solution. Its distance becomes part of the immutable per-pair receipt:

- `MODEL_ZERO_INTERSECTION`: Boolean volume = 0 and independently measured minimum distance **greater than** 0.00001 mm.
- `INDETERMINATE_GEOMETRIC_CONTACT`: Boolean volume = 0 and measured minimum distance in [0, 0.00001] mm.
- Other statuses (`MODEL_POSITIVE_INTERSECTION`, positive subthreshold penetration, nonvolumetric topology contact, timeout, worker failure) carry `modelMinimumDistanceMm: null`. Distances for these cases must not be fabricated from AABB proximity.

The `0.00001 mm` threshold is a numerical contact guard, **not** an engineering tolerance or guaranteed separation accuracy of OpenCascade. Numerical tolerances and CAD validity must ultimately be qualified against original source geometry and repeated across known kernel versions. Older receipts that claimed model-zero without this independent distance witness are now intentionally rejected by the browser validator.

A test using genuine OpenCascade on **synthetic cubes** reproduces the ambiguous empty Boolean, and a separate opt-in CI workflow (`Synthetic OpenCascade kernel conformance`) installs pinned CadQuery and OCCT dependencies to run that test. The standard engineering test suite retains its CAD-free preflight tests; neither suite constitutes a real X500 source execution. The local kernel experiment showed distinct distances for touching and separated cubes, not certified physical clearance.

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
