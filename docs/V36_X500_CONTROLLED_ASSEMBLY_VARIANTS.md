# AeroForge v3.6 | Controlled assembly variants with unqualified source-model replacement plans

**Status:** Engineering research release (draft). No actual original CAD geometry has been removed, no new BREP solid intersection has been computed, and no physical compatibility, purchase, power-on or flight approval exists.

## Why variants must become first-class data

The v3.5 original frame STEP assembly tree includes the `DJ-2216-KV880` motor CAD definition at four frame arm locations, with **two coincident source occurrences per location**. An independent `AIR2216II` motor STEP was uploaded separately. Those distinct source identities cannot be combined into a valid physical assembly by simply drawing the AIR model over the existing frame model.

AeroForge now distinguishes a deliberately **retained original-motor** research composition from an explicitly **hypothetical single-arm AIR2216II replacement**. These are alternative proposed simulations only; neither decides the actual installed motor, correct model revision, approved fastener, compatible ESC, or source motor mating face.

### Four exact source locations

| Arm | Frame source pattern | Arm-subassembly motor leaf | Coincident root motor leaf |
| --- | --- | ---: | ---: |
| arm-1 | `frame-quadrant-nn` | 56 | 189 |
| arm-2 | `frame-quadrant-np` | 83 | 191 |
| arm-3 | `frame-quadrant-pp` | 110 | 190 |
| arm-4 | `frame-quadrant-pn` | 137 | 188 |

The occurrence paths, source definition labels, source-solid indices and equality witnesses originate from the historical hash-verified STEP/XCAF audit. Two coincident source occurrences **do not establish two physical motors**.

## Source-evidence contract

The `core/x500_assembly_variant_v36.mjs` model accepts **only** the verified original v3.5 browser source assembly review, its original source JSON report and SHA-256 of its **exact bytes**. The browser computes this digest after validating both original STEP/GLB packages and every preceding v2.8–v3.4 source report.

The variant engine rejects:

- Unknown sites or scenario names, changed original motor component/arm paths, definition-label disagreement or duplicated source motor leaf assignments
- Changed original STEP source fingerprints, missing 244-source-leaf inventory or missing nine historic geometry-distinct positive model collision groups
- A source report claiming verified manufacturer BOM, physical part count, motor interchangeability, mounting fit, electrical/power or flight authority
- Missing individual named collision group correspondence or fabricated/modified historical pair identities

It never mutates the input review, original files, original 244-solid inventory, original GLB, or the manually entered CAD mating proposal.

## Supported scenario behavior

### A. Retain the original source motor representation

- **No** new `AIR2216II` source motor is inserted into the source-model plan.
- No original CAD solid is excluded, and all 244 original occurrences remain part of the source description.
- The earlier v3.3 30-pair Boolean test is marked **not applicable**, because it tested an extra AIR2216II overlay, *not* the native X500 frame design by itself.
- No physical original motor, manufacturer assembly BOM or fit is confirmed.

### B. Hypothetically replace one arm motor with AIR2216II

- The operator selects one explicit arm location.
- The proposal records exactly two original **coincident source occurrence IDs** at that site as **excluded from a future imaginary model composition only**, with 242 other original occurrences still listed.
- The other three existing motor-location pairs and every bracket/fastener-like component remain included.
- The original 30 raw BREP source pair measurements, their original 13 positive source comparisons and the nine geometry-distinct positive collisions remain permanently preserved.

**Arm 1** is the only position to which the historical v3.3 candidate AIR overlay test applied. When comparing the old **unchanged** 26 original geometry-pair report rows to the hypothetical arm-1 exclusion mask:

| Historical model comparison | Original overlay | Filtered historical view |
| --- | ---: | ---: |
| Distinct original model comparison groups | 26 | 22 |
| Model-positive comparison groups | 9 | 5 |

These filtered counts are **not a new BREP evaluation**, and are **not clearance, proof that the remaining 22 pairs still intersect by the same volumes under physical replacement, or permission to remove hardware**. The five positive rows correspond to the previously observed bracket-like and fastener-like original source components. Any actual variant Boolean result is **not run / null**.

For **arms 2–4**, the historical Boolean evidence is explicitly marked **not evaluated for that arm**. The software does **not** reuse arm-1 collision numbers, extrapolate geometry or claim mirrored mechanical fit.

## Engineering UI

Engineering → Frame ↔ motor CAD registration study → **Compare retain-existing versus hypothetical AIR2216II replacement (unqualified)**.

The optional v3.6 panel appears only after the full original-source v3.5 assembly evidence has been verified. It has two scenario choices and four arm locations, displays the exact proposed source occurrence mask, historical source collision counts, outstanding engineering gates and a downloadable standalone **UNQUALIFIED JSON scenario plan**. It does not update an active aircraft record or modify a 3D mating pose.

## Reproduce a portable scenario manifest

The pure-Python `tools/x500_variant_manifest_v36.py` reads the original v3.4 collision reconciliation and v3.5 XCAF hierarchy JSON evidence. It checks the SHA-256 **of those exact source-derived reports** against their lineage and refuses to overwrite an existing result.

```bash
python3 tools/x500_variant_manifest_v36.py \
  --v34 /private/x500-source-occurrence-audit.v34.json \
  --v35 /private/x500-xcaf-assembly-identity.v35.json \
  --mode HYPOTHETICAL_AIR2216II_REPLACEMENT \
  --site arm-1 \
  --out /private/x500-arm1-unqualified-variant-plan.v36.json
```

This command can run even if the original manufacturer STEP files are unavailable, because it works **only from prior operator-source-linked reports**. It records `originalSourceFilesRehashedThisExecution=false`. It cannot claim it independently repeated the original CAD geometry inspection or recomputed exact intersections.

Regression tests in both Node and Python establish deterministic masks, immutability of 30 original pair observations, unchanged five remaining historical model-positive groups at arm 1, no borrowed collision counts for other sites, and rejection of elevated source/BOM/physical approval flags. Chromium smoke tests verify the panel remains hidden without the full original source chain.

## Mandatory next gates: from scenario *plan* to measured and simulated fit

1. Obtain the real purchased X500 kit **SKU/revision**, actual installed motor/ESC designation, manufacturer's motor base drawing and fastener specifications. Distinguish the original STEP's `DJ-2216-KV880` model from the independently supplied `AIR2216II`, and separately from any current catalog motor variant.
2. Reacquire or re-upload the **original frame and motor STEP files** when a new CAD Boolean job is needed. The historical source SHA-256 receipts are insufficient to re-execute OpenCascade on missing source geometry.
3. Define a new immutable *selected-component membership list* for a precisely named **hypothetical** assembly, including whether existing motor mounting screws, washers, spacers and brackets should remain.
4. Once qualified contact planes, proper 3D datum pose and selected components are established, run a fresh bounded all-retained-solid BREP collision and clearance test. A timeout, missing solid, ambiguous assembly identity or skipped part is **INDETERMINATE/BLOCKED**, never clear.
5. Independently verify thread engagement, tolerances, rotor disks, propulsion/electrical system, center of gravity, power-on and flight safety with real hardware and appropriate supervision.

**Draft PR only. Original STEP/BOM and all physical/mechanical/procurement/power/flight approval flags remain unaltered and false.**
