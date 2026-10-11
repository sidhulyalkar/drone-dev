# AeroForge v1.0 · 3D Mission Systems and Mounting Handoff

## Release purpose

Close the design gap between Section 15's *new mission/module combinations* and the older four-motor showcase. This is a **rendered, explorable, source-honest prototype layout**, not source-registered manufacturer CAD, a complete assembly or a flight-validated simulator.

## Delivered

1. `core/architecture_v10.mjs` builds a pure scene descriptor for each v0.9 mission, honoring the stated aircraft topology: standard quad, fully guarded quad, six-rotor multicopter and a conceptual quadplane-style VTOL.
2. `mission_3d_v10.mjs` uses the existing Three.js import map to display separate frame, rotor, rotor guard, wing, cruise propulsion hypothesis and physical sensor/payload proxies. Orbit, zoom, part click/focus and separation are interactive. The panel degrades to the existing 2D mission diagram if WebGL/Three.js is unavailable.
3. A heuristic visual mount allocator offers slots (nose, top, belly, left/right pod, rear/mast). Every result is labeled `ILLUSTRATIVE_ASSIGNED_NOT_FIT_CHECKED`; mount exhaustion returns `UNASSIGNED_CAPACITY_HOLD`. Co-located software has no fake geometry; the renderer does **not** infer actual cable or bracket compatibility.
4. A per-module interface requirement record carries actual electrical and physical measurements as `null`: mass, size, mounting pattern, thermal dissipation, voltage/current, pinout source, SKU and revision. Changing the selected mission/modules regenerates a deterministic descriptor.
5. `compileMissionBuildHandoff()` creates a versioned evidence worklist: inventory → CAD → propulsion → integration for each physically relevant module → independent review → calibration/simulation. It is downloadable as JSON and a human-readable Markdown worklist.
6. Regres­sion checks cover four topologies, unique render nodes, finite normalized coordinates, per-module provenance holds, mount allocation and worklist dependency order.

## Important implementation boundary

The normalized scene units are **not** metres, millimetres, airfoil dimensions, or motor center offsets. They are a stable storyboard for visual exploration only. The VTOL renderer illustrates one hypothetical quad-lift/pusher concept and **does not** claim to match a manufacturer VTOL configuration or a calibrated flight-transition controller.

Scene objects lack real prop-diameter geometry, inertia, clearance or wire gauge. Mesh intersections are not analyzed. No computed physical load, airtime, coverage, pricing or mounting dimensions are claimed.

**v0.8 Assembly Copilot remains an FPV/quad-oriented teaching workflow.** The v1.0 mission integration creates a separate machine-readable evidence-gated assembly handoff, and explicitly declares `supportedByExistingAssemblyCopilot:false` for unimplemented hex and VTOL workflows. A future adapter must not silently reuse four-motor instructions on a hex or wing.

## Verification path to a real build

- Identify delivered manufacturer SKUs and exact revision manuals, with immutable source hashes.
- Import each supported STEP/GLB using a documented unit scale. Register frame datums and motor axes in real physical coordinates.
- Measure actual component envelopes, fastener engagement, propeller disks, camera field of view, inter-component clearances, center of gravity and inertia.
- Qualify source-correct voltage/current/connector endpoints and pin-level harnesses. Keep unknowns unresolved.
- Test sensor timing, obstacle sensing, image calibration, EMI and thermal behavior.
- Independently inspect a physical prototype; run documented PX4/Gazebo generic baselines before claiming a calibrated custom twin.
- Review current flight regulations/permissions with the actual scenario, locale, aircraft, operator and conditions.

Relevant authoritative upstream background:
- https://docs.px4.io/main/en/config_mc/
- https://docs.px4.io/main/en/config/actuators
- https://docs.px4.io/main/en/config/airframe
- https://docs.px4.io/main/en/camera/
- https://docs.px4.io/main/en/advanced/gimbal_control
- https://www.faa.gov/uas/commercial_operators

## Running

From the root: `npm test`, `npm run test:cad`, `npm run serve`. Open Section 15, select a scenario and add modules. Then interact with the 3D scene, inspect mount holds, and export the assembly handoff. If external Three.js CDN access or WebGL is blocked, the existing 2D schematic and pure worklist remain usable.

## Acceptance caveat

The JavaScript and Python regression/contract suites can run on GitHub Actions. Manual in-browser 3D verification on desktop, mobile, keyboard, reduced-motion and WebGL fallback is still required and should be recorded separately. Do not claim source-accurate CAD or a flight-tested digital twin.

## Next tranche

Start with the actual Holybro X500 V2 manufacturer CAD and sensor/mount part families before expanding high-detail procedural art. Build a source-registered mount library, canonical coordinate transforms, enforceable envelope checks and a browser QA matrix.
