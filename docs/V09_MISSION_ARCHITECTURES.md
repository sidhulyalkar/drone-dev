# AeroForge v0.9: Everyday Mission Architecture Studio

## Purpose

Section 15 extends AeroForge beyond swapping the same six quadcopter presets. It introduces six mission-derived aircraft concepts, 40 reusable **component classes** organized into 12 subsystem categories, four topologies (guarded quad, quad, hex, VTOL) and a transparent conceptual integration screen.

These are **not real SKU-qualified part lists**. Every module is marked `CONCEPT_ONLY`, even when the underlying sensing or autopilot technology is mature. No values for mass, endurance, pricing, thrust, coverage, battery life or reliability are made up.

## Six usable design prompts

| Design | Topology | Job to be done | Characteristic modules | Hardest unresolved question |
| --- | --- | --- | --- | --- |
| Aisle Wisp | guarded quad | Inventory a controlled empty warehouse or high shelving | VIO, optical flow, ToF, enclosed props, logging | Indoor localization drift, contact safety |
| Solar Surveyor | quad | Document roof and solar panel anomalies | Stabilized RGB, calibrated thermal, RTK, geofence | Radiometry and safe structure standoff |
| Air Mosaic | quad | Map exploratory particulate concentration alongside stationary reference monitors | PM2.5, humidity, sampling boom, logger | Rotor-induced flow bias and co-location |
| Garden Atlas | quad | Compare plant canopy reflectance over garden/farm plots | RGB, multispectral, calibration panel, RTK, offline maps | Reflectance calibration and repeated georegistration |
| Pathfinder Mapper | hex | Survey accessible trail surfaces in controlled public-park work | LiDAR, RGB, privacy redaction, RTK | Survey permissions, accuracy and safe people avoidance |
| Canopy Cartographer | VTOL | Survey large habitats for conservation and restoration | Airspeed, transition control, multispectral, mapping | Transition dynamics, wildlife protections and aerodynamic qualification |

All deliveries are human-reviewed *information outputs*, not autonomous diagnosis, compliance certificates or permission to operate.

## New component expansion

`core/mission_lab_v09.mjs` adds component classes across: airframes, autopilots, propulsion, navigation, imaging, sensing, companion compute, power, safety, communications, software and payloads.

Examples: prop guards, six-rotor sets, airspeed sensors, RTK, stereo depth, scanning LiDAR, PM2.5 monitoring, multispectral and radiometric cameras, stabilization gimbals, optical-flow positioning, emergency disarm, Remote ID integration slot, privacy redaction, geofencing, companion compute, encrypted logger, sampling booms, terrain lighting, weatherproof enclosure concepts, and service kits.

Each component declares:

- Stable class identifier, subsystem category and eligible conceptual topologies.
- Dependency class IDs and conflict references (where relevant).
- Intended mission role and conceptual external interface class.
- The measurements or independent evidence necessary before it could become a verified SKU.

`analyzeMission(id, additions)` reports unresolved interface holds for every chosen component, plus scenario-specific risks, airspace review and physical qualification holds. Some invalid module combinations return `BLOCK`; **zero conceptual blocks never means airworthy**.

## User experience

1. Choose one of six mission cards.
2. Inspect the *not-to-scale* airframe architecture diagram and expected information output.
3. Enable relevant optional subsystems; read tradeoffs and evidence holds.
4. Compare selected scenario with a different topology and see shared versus differing module classes.
5. Export machine-readable concept JSON or a printable, human-readable design brief.
6. Optionally open the nearest **illustrative** quad in the existing configurator. Optional new mission modules do **not** alter that legacy physical design or import into the v0.8 Assembly Copilot.

## Engineering and legal boundaries

- The schematic drawings depict rotor count and a conceptual wing, **not measured geometry**. They do not prove rotor clearance, mass distribution, thermal behavior, payload CG or structural strength.
- A field-monitoring payload requires application-specific calibration and controlled interpretation. Airborne PM readings are especially sensitive to rotor wash, humidity, inlet and ground-station reference effects. EPA's enhanced air sensor guide is a starting point.
- PX4 documents camera protocols, MAVLink gimbal integration, RTK GNSS, optical flow and other sensor classes, but compatibility depends on exact SKUs and flight controller firmware.
- PX4 and ArduPilot support multiple multicopter and VTOL airframes; support for a vehicle type does **not** qualify a custom aircraft or a new tilt-rotor transition.
- Most U.S. non-recreational outdoor drone flights generally involve FAA Part 107 requirements. Investigate VLOS, airspace, Remote ID, privacy, site permission, restrictions over people and protected natural areas before operations.
- VLOS/battery limits mean retail delivery or city-scale unattended fleets would need a separate, more regulated design program and are **not** presented as simple beginner drones.

## Authoritative references (reviewed October 2026)

- https://docs.px4.io/main/en/hardware/drone_parts
- https://docs.px4.io/main/en/sensor/
- https://docs.px4.io/main/en/camera/
- https://docs.px4.io/main/en/advanced/gimbal_control
- https://docs.px4.io/main/en/airframes/
- https://en.ardupilot.org/copter/docs/frame-type-configuration.html
- https://www.epa.gov/air-sensor-toolbox/how-use-air-sensors-air-sensor-guidebook
- https://www.faa.gov/uas/commercial_operators
- https://www.faa.gov/uas/getting_started/remote_id
- https://www.faa.gov/uas/commercial_operators/operations_over_people

## Release QA

- New module IDs and mission IDs must be unique and all mission references must resolve.
- Every default scenario must have no missing *conceptual* dependencies or unsupported topology modules.
- Adding an optional component must change the mission inventory and evidence-hold list without modifying the underlying template.
- All outputs remain conceptual, unpriced, non-airworthy and non-permitted regardless of how many modules are selected.
- JSX/DOM-free engine can be tested with `npm test`; all UI ID bindings are checked by the regression suite.

**Not implemented yet:** vendor SKUs, custom CAD assets for hex/VTOL, additive component masses/power budgets, sensor calibration jobs, mission simulator integrations, fully implemented assembly recipes and browser end-to-end visual QA.

## Priorities for v1.0

1. Promotable revision-specific vendor catalog with power/interface schemas, mass and CAD provenance.
2. Natively parameterized 3D part arrangements for hexacopters and VTOL, with collision checks.
3. Explicit module-slot geometry and saved component-placement proposals (never auto-qualified).
4. Scenario-targeted simulation, camera coverage and sensor field-of-view planning.
5. Extend Assembly Copilot graphs to exact user-selected modules and evidence-gated per-SKU connectors.
