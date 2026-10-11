# AeroForge v0.8 proposal: Assembly Copilot

Status: DESIGN PROPOSAL / NOT IMPLEMENTED. Research date: 2026-10-10.
Related: v0.7 exploded showcase, v0.6 evidence-aware X500 reference.

## Research provenance and limits

Primary reference: Joshua Bardwell, "2023 Freestyle FPV Drone Build For Total Beginners":
https://www.youtube.com/playlist?list=PLwoDb7WF6c8l24IM83wIS94XzhuMVC2gx

Research used public video titles, descriptions, timestamped chapters, GetFPV/Lumenier companion kit pages, Oscar Liang's 2026 and 2024 written build logs, PX4's X500 guide, and community troubleshooting examples. **Video footage was not played through, complete transcripts not obtained, and precise episode count/order beyond identified numbered entries was not independently verified against YouTube's live playlist.** Content below is a product design synthesis, not a transcript or endorsed derivative tutorial.

Public 2023 video entry points and chapter-oriented lessons:
- 1: Opening video indexed at https://www.youtube.com/watch?v=tNwHNYgWnp8 ; title/chapter detail not recovered.
- 2: Frame, ESC, motors, FC https://www.youtube.com/watch?v=vQKXGVMLVYU (motor screw length at 06:28; ESC/frame isolation 12:33; FC/ESC matching 33:53)
- 3: Smoke check https://www.youtube.com/watch?v=9jALj0GPmww (XT60 continuity at 01:37; protective power first at 05:27)
- 4: Analog VTX https://www.youtube.com/watch?v=yIcRf_xSujc (pad layout, antenna-before-power, VTX table, camera)
- 5: DJI O3 VTX https://www.youtube.com/watch?v=kinmxuOnoUM (mechanical video installation, binding, OSD)
- 6: Walksnail VTX https://www.youtube.com/watch?v=5PWL68Y1Fvs (connector, wiring, firmware, OSD)
- 7: ELRS receiver https://www.youtube.com/watch?v=Dz7bdXWKC1Q (receiver pinout and binding; "binding alone is not enough" at 22:45)
- 8: Betaflight channel mapping and endpoints https://www.youtube.com/watch?v=EDnQEep2X4I (gimbal calibration, controls, channels)
- 9: Betaflight auxiliary modes https://www.youtube.com/watch?v=ekgYYWN7eI4 (arm switch, angle, turtle, beeper)
- 10: Betaflight motor setup https://www.youtube.com/watch?v=CBZxFdJUFRg (motor protocol, output order and direction)
- 11: Final Betaflight setup https://www.youtube.com/watch?v=PJR_uiPi95M (flight-controller orientation, calibration and rates)
- 12: Final mechanical assembly https://www.youtube.com/watch?v=9L96RIOJn34 (capacitor, strain relief, top plate and camera angle)
- 13: Battery retention https://www.youtube.com/watch?v=uFHVA_qM3uw (battery strap and lead security)
- 14: First flight https://www.youtube.com/watch?v=mS-fJGWN8s0 (failsafe, props, preflight review)

These are 2023 FPV/Betaflight lessons. Their software settings, vendor SKUs and procedures MUST NOT be imported unchanged into PX4/QGroundControl, nor should they be treated as current manufacturer wiring instructions. External video links open the original video; AeroForge should never rehost footage or copy transcripts without proper permission.

Additional sources:
- https://www.getfpv.com/learn/fpv-build-logs-and-guides/advanced-tips-for-building-a-racing-or-freestyle-drone/
- https://www.getfpv.com/commercial-industry-drones/education/beginner-diy-fpv-drone-kit-qav-s-2-joshua-bardwell-se-5-hd-ready.html
- https://oscarliang.com/how-to-build-fpv-drone/
- https://oscarliang.com/how-to-build-fpv-drone-analog/
- https://docs.px4.io/v1.14/en/frames_multicopter/holybro_x500v2_pixhawk6c
- https://docs.px4.io/v1.17/en/config/actuators

## Product thesis

Current: Design > compare > visualize > evidence holds > static assembly packet.
Target: Design > purchase planning > receive & inventory > **interactive revision-specific assembly graph** > photograph/test/verify > exact firmware-path setup > unpowered electrical check > supervised bench validation > simulator practice > first-flight review > maintenance/repair.

The big advantage over a video playlist is preventing the user from proceeding with a physically unsafe or incompatible substitution. The advantage over paper checklists is every stage highlights the exact components and interfaces on the selected 3D revision.

## User-facing experience

Desktop: left progress rail / large orbitable 3D assembly in center / right context pane with exact component, pinout source, tool, screenshot of manufacturer manual if permitted, user-supplied photos and next gate. Bottom ribbon: referenced video clip link, play/pause mechanical animation, previous/next step.

Mobile bench mode: single step visible at once, large tappable Next and "Something doesn't fit", pinch zoom, hands-free optional narration, high-contrast wiring colors paired with textual net names, keep screen awake if supported, offline text/geometry/cache (original YouTube video requires network).

Each step:
1. What to find in the kit (exact part IDs, quantities, orientation, vendor reference).
2. Why this stage exists (short conceptual explanation).
3. Dry-fit animation and the actual geometry authority label.
4. Tool/equipment list and sourced caution.
5. Action in user-friendly language; optional YouTube link deep-linked to relevant timestamp.
6. Expected result, photo/example as illustration only, common failures, troubleshooting branches.
7. Evidence receipt (photo, multimeter value with units, measured clearance, source revision, note, timestamp).
8. Status: waiting / doing / needs-review / blocked / independently checked.

Clicking a part in exploded mode jumps to its assembly steps; selecting a wiring edge traces both connector ends and associated pin/signal names. A new part revision invalidates only steps whose evidence dependencies were affected, never blindly carries over a pass.

## Workflow stage model

The following is a GENERIC authoring template; the exact step order may vary by verified physical design:
A. Scope and inventory: confirm parts, receipt revision and non-kit purchases: receiver/radio, goggles/VRX, LiPo/charger, solder tools, consumables and spares.
B. Dry fit: inspect the frame, screw length, stack height, cable routes, rotor disk clearance, USB access, antenna location, battery lead and payload CG without cutting/soldering.
C. Frame assembly: frame plates, standoffs, arms, motors and fasteners; inspect screw penetration and specified torque from manufacturer, not generic guesses.
D. ESC/FC stack: standoff registration, insulation from conductive carbon, access orientation, source-correct harness pinout.
E. Electrical: motor wires, battery lead, capacitor and compatible receiver/video/GPS links. Render pin-to-pin graph only where SKU-specific pinout is sourced; otherwise a TODO, never a fabricated diagram.
F. Unpowered QA: resistance/continuity and polarity, insulation/strain relief, propellers physically removed and battery disconnected. An actual independent measurement is required to proceed; a checkbox cannot manufacture it.
G. Controlled initial power and firmware: only after certified/appropriate supervision and manufacturer safety procedure. Store tool results when available; do not directly energize hardware from the browser.
H. Radio/video: firmware versions, link/bind evidence, sensor/receiver orientation, endpoints/switch mapping; separate Betaflight and PX4 adapters.
I. Motor/actuator mapping: propellers removed for controlled bench testing, follow current hardware manuals; record output assignment/observed direction and independent verification.
J. Finish and retention: secure wires and antennas, top plate and external fixtures, battery straps, strain relief, balance/payload centers.
K. Flight-readiness review: airspace and registration, local RF compliance, human review, failsafe validation, simulator practice, propeller installation only after all prior gates.
L. Post-flight / repair: inspect failure modes, flight logs, firmware diff backup, component replacement, revalidate affected gates.

## Separate firmware plugins

- Betaflight: FC target, UART serial RX, VTX table when analog, OSD, RX channel/endpoints, AUX modes, motor direction and arm/failsafe tests. External tool links and backups; NO guessed CLI configuration.
- PX4/QGroundControl: firmware/airframe identity, sensor alignment, compass and accelerometer calibration, RC/flight modes, power/battery config, actuator geometry/output assignment, failsafe, log capture. Never apply Betaflight settings to PX4.
- Unknown/custom firmware: default to blocked software-verification task until source-backed adapter exists.
- Independent of firmware: frame, motor screw, carbon insulation, battery charge/connector identity, wiring/polarity, tool safety, payload mount, CAD collision and inspections.

## Data contracts

Use immutable designFingerprint plus a buildSessionId, sourceRecordId and component revisions. Planned schema split:
- lessonTemplate: stageId, applicability predicate, prerequisites, stable identifiers for involved parts/ports, requiredTools, warningSeverity, geometryLayers, animationSteps, inputSchema, validationRuleId, troubleshootingPaths, sourceIds and optional external videoId+timestamp.
- stepInstance: buildSessionId, designFingerprint, lessonTemplateVersion, selected parts/ports, current status, recorded observations, evidenceRefs, timestamps, reviewer identity, dependency hashes.
- evidenceReceipt: evidenceType (photo/continuity/measurement/log/manual-lookup), target interface, unit, observed value, source and rev, user attestation, trust tier, checks performed, review status. No evidence receipt is equivalent to a physical test on its own.
- capabilityAdapter: firmwareFamily, versionRange, validated board firmware target, mapping data, allowed instructions and blocked settings.

Dependency engine: strict topological order with conditional branches. State transitions allowed only if prerequisites have applicable evidence. Warning conditions may pause user progress; hard blockers must never be self-overridden by visual UI. Failure states preserve diagnostic context and recovery path. Every captured photo/test is local by default and exportable; avoid public upload or unsafe telemetry streaming.

## One complete workbench step

Step: "Install the ESC/FC stack." If frame/ESC/FC components are identified with verified source geometry:
- Viewer isolates bottom plate, stack screws, insulating hardware and ESC.
- Animate the board lowering along its actual axis, with collision regions.
- Display gap measurement and power-pad access.
- Show a pad/connector pairing only when pinout facts are sourced for both hardware revisions.
- Link to Bardwell Part 2 around 10:38 and 12:33 as *instructional reference*, but clearly identify his board model as different if necessary.
- Require user-provided visual confirmation, inspection note and exact pack SKU before declaring ready for the next gated activity.
If geometry or pinout is absent: overlay "ILLUSTRATIVE; MEASURE FIRST", provide dimensional tasks, and leave hardware fit unresolved.

## Acceptance tests before public launch

1. Assembler produces deterministic relevant stage graph for FPV vs PX4; does not include Betaflight CLI in PX4.
2. If user substitutes FC/ESC or changes physical component revision, affected stage passes are invalidated, unrelated ones preserved.
3. Missing pinout is never rendered as a claimed real wire connection.
4. View/step is keyboard and touch usable, previous/next, pause, reduced-motion mode, offline fallback.
5. Battery polarity, first-power inspection, propeller-removal and failsafe gates cannot pass via checkbox alone.
6. Build status cannot promote procurement/flight authority from synthetic video, CAD proxy or unchecked manufacturer spec.
7. Media links point to original creator episodes with source provenance and optional timestamp; no copied/rehosted footage.
8. Test broken/unsupported firmware target, missing radio receiver, motor screw too long, obstructed USB, ESC touching carbon and bad XT60 polarity.
9. Uninterrupted mobile session persists after reload with revision ID and does not leak user photos outside local storage without opt-in.
10. Generate a human-readable, printable build packet with open gates, actual completed evidence and parts substitution log.

## Prioritized build increments

v0.8a: define stage graph and pure gate engine (one tested manual demo for Source Two FPV); integrate part selection from v0.7 showcase; mobile friendly stepper and external video timestamp links.
v0.8b: hardware-specific templates for Holybro X500 V2 / PX4, sourced assembly/pinout mapping, receipt/evidence export and diff invalidation.
v0.8c: interactive verified-geometry step animations and conditional wiring viewer; photo-assisted notes (no automatic verification).
v0.8d: versioned firmware/QGroundControl workflows, safe diagnostic playbooks, simulator handoff and maintenance lifecycle.

Success metric is not time on videos. Track the percentage of build sessions completed without incorrect parts or repeat reassembly, median blockers resolved before first power, inspection completeness and return-to-repair recovery time. Collect metrics only with explicit opt-in; do not treat completion of online steps as flight qualification.

## Upstream creator policy

Video tutorials remain links to original YouTube videos or official embeds under platform rules. AeroForge authors original text/3D instructions anchored in manufacturer hardware evidence; do not republish Bardwell's full scripts, captions, still frames or images without permission. Source URLs and timestamps help the user learn from the creators.
