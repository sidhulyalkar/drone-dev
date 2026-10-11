# AeroForge v1.6 · CAD Feature Picker and Circle-Fit Evidence

## Why this exists

v1.5 supported source-bound manual motor-center coordinates but had no direct on-mesh measurement assistance. v1.6 introduces feature-level **surface-pick evidence**, a numerical 3D circle candidate, and an explicit transfer to a specific X500 rotor hypothesis.

Neither clicking a surface nor fitting a circle identifies a motor-shaft center automatically. All results remain editable unreviewed observations; manufacturer authenticity, physical registration, shaft concentrically and flight qualification remain blocked.

## Guided workflow (Sections 17–19)

1. Download the genuine, revision-specific `x500v2-frame.step` and produce a source-bounded GLB/manifest using the v1.3 converter. Load **manifest + GLB + original STEP** in the local browser viewer and verify file digests. A matching hash merely identifies local bytes; it does not independently prove manufacturer origin.
2. In Section 19 choose the *hypothesized* motor label R1–R4. Click **Begin surface-point picking**. This requires a rendered local GLB, matching original STEP bytes and an assembled (0% exploded) view.
3. Choose **at least 4 spatially distinct points along one visible circular edge**. Each click is a triangulated mesh-surface position in CAD kernel millimetres. The clicked object has an unregistered mesh label and integer mesh index, not a semantic component or motor identity.
4. Click **Calculate circle center**. The pure numerical engine selects a maximal-area seed triangle, fits its 3D circumcircle, then evaluates all other observations against the fitted plane and radius. It returns plane/radial RMS and maximum deviations, feature radius and a derived center. A fit with large residual blocks transfer. Four points are the minimum so at least one point can validate a three-point seed; more are preferable.
5. If the feature geometry is convincing, click **Copy hypothesis to motor row**. You must first create a row for that motor in Section 18 with its real propeller diameter. The application fills only the CAD-native candidate XYZ and attaches a source-specific unverified circle-fit evidence receipt. It does not infer propeller size.
6. Complete observer notes, source-unit declaration, source→body-FRD axis mapping, then independently reinspect the motor register. A circle-fit candidate remains `CAD_SURFACE_CIRCLE_FIT_HYPOTHESIS` in the data contract.
7. Pass source-datum coordinates to Section 16 for **another** conservative XY rotor-disk/part-envelope screen. Actual aircraft CG, PX4 motor-position metres, wiring, controller output mapping, structural fit, authentic vendor data, and flight readiness remain unresolved.

### No-WebGL alternative

Section 19 also accepts explicit native CAD XYZ + mesh index + mesh label CSV rows (`X,Y,Z,meshIndex,meshLabel`). Coordinates are typed as `USER_TYPED_SURFACE_COORDINATES_NOT_VERIFIED`, not falsely presented as raycast observations. The same geometric fit and exact source-hash binding apply. WebGL is not a prerequisite for inspecting the numeric data.

## Data contracts

- `core/landmark_v16.mjs` publishes `aeroforge/cad-feature-measurement/v1.6` with STEP/GLB SHA-256 hashes, source revision, actual picked points, fitted center, radius, plane normal, numerical residuals, and explicit failed qualification fields.
- `core/registration_v15.mjs` now preserves an optional `featureEvidence` for motor observations of type `CAD_SURFACE_CIRCLE_FIT_HYPOTHESIS`; it rejects a source revision change, mutated fitted point coordinate, or forged motor verification bit.
- A numerical fit never certifies that picked points were on the correct physical feature. Outlier thresholds are heuristic UI screening, not a mechanical tolerance or metrology certificate.
- `cad_viewer_v13.mjs` converts clicked world-space triangle hits back into the original native GLB/CAD coordinate frame by inverting the root scene transform. Picking is disallowed in exploded mode because a displaced mesh would not give an original CAD-native position.
- Manually typed points and raycast points use different provenance markers. Every source selection/reset invalidates the current fit and clears old overlay/registration evidence.

## Known limitations

1. CAD mesh tessellation and picking resolution depend on the local STEP-to-GLB converter; a triangle surface hit may not coincide with the underlying exact circle edge in the analytic STEP representation.
2. The numerical fit uses a maximal-area three-point seed rather than weighted least-squares refinement. It provides holdout residuals but is not robust to all outlier distributions. Physical metrology still requires independent tools and source dimension evidence.
3. There is no automatic inference of correct motor mesh, shaft center, mounting hole pattern, fastener engagement, motor spin direction or true body CG.
4. No Holybro CAD bytes or manufacturer-defined part transforms have yet been independently inspected by the assistant. The new browser test fixtures are synthetic.
5. Exporting an unverified registration is a research/engineering planning step, **never** permission to purchase, energize, spin a propeller, or fly.

## Upstream documentation

- [Holybro X500 V2 CAD download](https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download)
- [Holybro X500 V2 mechanical references](https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2)
- [PX4 FRD actuator geometry](https://docs.px4.io/main/en/config/actuators)

## What v1.7 should prioritize

Import the actual STEP in a controlled isolated environment, verify manufacturer revision/license, register a motor STEP instance with actual frame mounting surfaces, and build an inspectable part-to-part transform ledger. Add a calibrated, independently checked datum constraint rather than treating a mathematically fitted circle as the source of truth.
