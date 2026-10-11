# AeroForge v0.3 · Evidence-first real hardware engineering

Date: 2026-10-10. Reference contract: `aeroforge-reference-assessment/v0.3`.

## Goal and current authority

Preserve Worcester-style configuration and visualization, but do not silently promote a plausible-looking drone to a purchasable or flyable design. The complete v0.2 synthetic catalog and UI remain available unchanged. A new, separate **Reference Lab** identifies actual vendor part revisions, preserves source facts, exposes unknowns and generates a reproducible evidence packet for one Source Two racing-class study.

**Engineering status: EVIDENCE_HOLD. This is not a qualified aircraft, and no parts checkout, fabrication approval, powered test instructions or flight permission exists.** Source Two is a lightweight racing frame recommended by the vendor to experienced pilots, not automatically an appropriate beginner/robotics aircraft.

## Hardware matrix

| Role | Manufacturer identity | Facts used | Evidence | Incomplete / risk |
| --- | --- | --- | --- | --- |
| Frame | TBS Source Two V0.1 5in | 220mm wheelbase, 72g, 2mm upper, 3mm lower, 4mm arms, 20×20/30.5×30.5 stack holes | TBS manufacturer + GPL source | Exact motor XY/bolt hole/clearance from CAD still absent |
| Motors | T-Motor Velox V2207 V2 1750KV ×4 | 35.1g incl. leads, 5–6S, 36.6A 60s peak specification; tested thrust/current | T-Motor manufacturer | Arm mount fit, screw depth, thermal/cooling environment |
| Props | T-Motor T5143S family ×4 | Matched to motor's published *static* test curve | T-Motor manufacturer | Tip sweep 5.1in inferred from designation, hub dimensions/unbalance absent |
| Controller/ESC *research lead* | SpeedyBee F405 V5 + OX32 55A | 3–6S, 30.5mm stack, 55A continuous / channel, 8.1g FC + 19.1g ESC | SpeedyBee manufacturer | **Discontinued**; cannot be procurement selected. A replacement SKU requires its own facts. |
| Battery / RF / FPV / mounting | intentionally unspecified | Only explicit user mass/cell/planning inputs | None yet | No complete BOM / pricing / wiring / mass/inertia qualification |

A source-verified *fact* does not by itself make a component *interface* compatible. In particular: a supported 30.5×30.5 stack-hole **pattern** does not guarantee connector orientation, capacitor/solder access, regulator capacity or plate clearance. Source frame CAD must be reviewed to recover actual XY motor centers, geometry and collision envelopes. `references` is a frozen in-code fact registry with field-level provenance and sources exported in `sources/reference_sources.v0.3.json`.

## Geometry chain

1. Publish the vendor's frame CAD URL and GPL license. Do not vendor or republish GPL model inside the MIT AeroForge app as unqualified original geometry.
2. If available locally, import manufacturer STEP into `tools/step_to_glb.py`. This emits a display `.glb` and `*.provenance.json` with hashes and bounds. Source file remains local. (Requires CadQuery, trimesh, NumPy.)
3. Visualize that GLB in the Reference Lab. This visualizes manufacturer geometry **as imported**; correct unit origin/part revision still requires independent confirmation.
4. Extract **true motor-shaft XY**, mounting holes, prop swept envelope, stack position, standoff height, camera geometry, wiring and battery volumes from CAD, and record the origin/revision used to extract them.
5. Run true solid interference tests with manufacturing tolerances and valid prop deflection envelopes. No interference certification is performed by this v0.3 renderer.

Current SVG envelope represents four motor centers at `(±77.78, ±77.78)` **as an explicitly editable symmetric X proxy**. Source Two is a stretched racing frame, therefore the default motor-center layout is **NOT** vendor-verified geometry. Published `wheelbase=220mm` alone cannot establish all pairwise tip clearances. Editable coordinates support engineering what-ifs, not geometry certification.

## Propulsion model: only bounded real bench data

T-Motor publishes static bench measurements of the **V2207 V2 1750KV** with **T5143S** propellers between 50% and 100% throttle at 22.5–23.8 V in their test setup. `interpolateMeasuredStaticCurve(thrustG)` uses piecewise-linear interpolation only **inside** that documented table, returns `null` outside, and is not an in-flight aerodynamic model. This is fundamentally different from v0.2, whose max thrust/endurance are synthetic planning numbers.

For the reference's currently assumed ~660g gross mass, each motor's hover share is about 165g, outside the published table's smallest 546g thrust point. AeroForge refuses to extrapolate an operating point, electrical hover power, or flight duration. Static thrust-to-input-mass ratio uses one explicit vendor bench endpoint with the chosen *assumed or user-attested* mass and is **not** a guaranteed thrust margin.

## SITL: gating instead of fake simulation

`simulationContract()` exports `aeroforge-px4-gazebo-handoff/v0.3` with `readyForSITL=false`. No executable SDF, PID tuning, actuator coefficients or flight dynamics are invented. Missing fields remain JSON `null`. To promote a research build, acquire and independently check:

- measured takeoff mass and center of gravity, complete inertia tensor in kg·m²;
- rotor XYZ and spin directions from original CAD / physical layout;
- thrust/torque coefficients against actuator speed, ESC/motor response time, voltage-sag/thermal model;
- airframe drag and camera/gimbal/payload dynamics (where relevant);
- suitable PX4 hardware/firmware/airframe mapping, or a separate ArduPilot target;
- simulator version, plugin mapping and automated reproduction of measured step/hover response.

Reference: [PX4 Gazebo simulation and custom model steps](https://docs.px4.io/v1.18/en/sim_gazebo_gz/). Static bench endpoints do not supply full time-domain rotor dynamics. No SITL execution or flight-control model validation took place in this release.

## Assembly documentation

The generated Markdown assembly packet contains a fingerprint of the exact reference inputs, each HOLD/BLOCKER with its required closure evidence, five staged checklists, and authoritative vendor source URLs. User checkboxes are unreviewed attestations; they do not create authorization. The UI does **not** give generic pin-specific wiring, motor test instructions with props on, or a completed battery-safety plan. Each operation must use revision-matched documentation and independent electrical inspection. Relevant US recreational guidance: [FAA recreational rules](https://www.faa.gov/uas/recreational_flyers), [registration / Remote ID](https://www.faa.gov/uas/getting_started/register_drone).

## Engineering promotion criteria for v0.4

1. `DOCUMENTED`: stable exact manufacturer SKU, release/revision, link, spec PDF and manufacturer fact extraction.
2. `INTERFACE_MEASURED`: true imported frame CAD, known component geometry and mounting/clearance graph.
3. `ELECTRICAL_QUALIFIED`: wiring schedule derived from **specific manuals**, actual BEC loads and current/temp ratings.
4. `PERFORMANCE_CALIBRATED`: measured battery, thrust/current/ESC/heat, payload mass and low-load hover logs.
5. `SITL_CALIBRATED`: proven custom PX4/ArduPilot actuator mapping, mass/inertia, wind/step tests and replay evidence.
6. `ASSEMBLY_REVIEWED`: exact revision-specific mechanical/electrical build with checks signed by an experienced reviewer.
7. `OPERATION_REVIEWED`: independently verified applicable airspace, TRUST/registration/Remote ID/rules before outdoor flight.

Every gate must retain unresolved evidence and must fail closed if upstream part revision changes.
