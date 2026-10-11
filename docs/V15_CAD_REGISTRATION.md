# AeroForge v1.5: Human-Observed CAD Registration Bridge

## Purpose

Connect the *local original STEP bytes* checked in v1.3 to the v1.4 canonical X500 component reference and to the v1.1 dimensional screening engine. A software annotation pipeline does not authenticate a vendor's STEP, motor position, source axis conventions, physical fit or flight suitability.

## Reference sources

Official X500 V2 documentation describes nominal **500 mm wheelbase**, **144 × 144 mm body plates**, a **28 mm plate separation**, and a **16 × 16 mm motor pattern**. Holybro's current store also lists a **19 × 19 mm mounting pattern**, depending on hardware/revision. Do not overwrite source discrepancies with a single assumed value.

- https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2
- https://holybro.com/products/px4-development-kit-x500-v2
- https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download
- https://docs.px4.io/main/en/config/actuators

## Workflow

1. Download original X500 V2 frame STEP from Holybro, verify allowed use/license, record revision and SHA-256. Convert to a hash-bound GLB+manifest with `tools/cad_visual_package_v13.py`; Section 17 verifies the original STEP bytes plus generated GLB match the manifest. An isolated virtualenv with CadQuery is required for local conversion.
2. In new **Section 18 (inside the CAD viewer)**, select the source-CAD-to-body-FRD signed axis permutation, and document its mechanical evidence. Enter source kernel datum XYZ in millimetres and four individually observed motor shaft centers in the STEP coordinate system. No coordinates are prefilled or inferred from the nominal wheelbase.
3. Declare that you inspected source importer length units against a reference. This checkbox remains a **self-attestation**, not independent source review. Provide the observation record label and exact evidence notes. No registration occurs without them.
4. Click **Inspect marked motor geometry**. The browser enforces a right-handed axis matrix (determinant +1), validates the four coordinates/prop diameters and transforms points to a *user-datum FRD* frame. It overlays four markers on the **original CAD-native scene** while maintaining its source kernel-space coordinates.
5. A transparent wheelbase comparison finds the best of three potential pairs of opposite diagonals among four user-entered motor centers and compares those distances against the published nominal 500 mm. A 15 mm closeness threshold is an illustrative review cue, **not a manufacturer tolerance, fit qualification, identification of the actual motor numbering or verification of mounting orientation**.
6. The proposal becomes part of the X500 hardware record as `unverifiedMotorDatumFRDMm`; actual CG-relative PX4 motor positions, measured CG, frame datum registration and physical clearance approvals stay **null/false**.
7. Click **Screen in dimensional inspector** to transfer the draft to v1.1. Its SHA-256 becomes an **imported identity claim**, not a new local hash event. Export remains disabled until the user runs the dimensional screening again, and its status remains unverified.
8. Editing a registration field invalidates the proposal and clears old motor markers; changing or clearing the source CAD invalidates the registration and unlinks its source from the X500 hardware record.

## Contract inputs

`core/registration_v15.mjs` defines `aeroforge/x500-registration-proposal/v1.5`. The input accepts signed axis mappings such as `['+X','+Y','+Z']` or `['-Y','+X','+Z']`, a source STEP origin in kernel millimetres, and four manual rotor records `{id,centerKernelMm,propDiameterMm}`.

All coordinates in the preliminary dimensional draft use the user-defined body FRD origin, not whole-aircraft center of gravity. The provenance is a manual CAD annotation, **not an independently verified measured motor location**. A source STEP hash match cannot elevate that evidence. PX4 motor positions must ultimately be in FRD metres relative to measured whole-aircraft CG; output mapping, spin directions, CG/inertia and regulator requirements also remain unresolved.

## Software test matrix

- Identity, 90-degree signed-axis conversion, translation from nonzero source datum, and rejection of mirrored/reflected transforms.
- Reject absent, wrong or unverified original STEP bytes, unrecognized CAD filenames, missing measurement notes/observer and missing units declaration.
- Four-motor count, duplicate motor identifiers, nonfinite coordinates, unknown fields and out-of-range propeller diameters.
- Nominal-diagonal comparison explicitly cannot grant physical fit, manufacturer identity, independent coordinate validation or flight approval.
- Immutable linkage to the exact locally hash-checked source/GLB pair and rejection of a changed source revision.
- Chromium integration test uses **invented bytes** under the known filename solely to exercise the software pipeline; it tests annotation, hardware record link, dimensional transfer, stale invalidation and source reset.

## Hard boundaries and next steps

The production X500 V2 frame STEP bytes have NOT been retrieved, parsed, or independently verified by the assistant. The registration is a practical measurement intake and data-identity contract, **not a completed manufacturer-specific mechanical model**.

The remaining manufacturer vertical slice requires a real frame STEP+motor STEP, documented mechanical transforms and motor-shaft center identification, an independent reference dimension measurement, a real mesh-based fit/interference audit, hardware pinouts and SKU-specific electrical qualification. Do not regard the bridge as proof of safe mechanical construction, battery energizing, operation or flight.
