# AeroForge engineering assembly packet

Design revision: AF-c1789991
Status: EVIDENCE_HOLD; NOT FLIGHT QUALIFIED
Frame: TBS Source Two V0.1, 5-inch
Motors: 4× T-Motor Velox V2207 V2 1750KV
Prop: 4× T-Motor T5143S
Reference stack: SpeedyBee F405 V5 OX32 55A stack (DISCONTINUED; must replace)
Battery: UNSPECIFIED

## Evidence blockers / holds
- **HOLD ROTOR_XY:** Motor centers are a symmetric-X visualization proxy. Next: Import the original CAD, extract the motor centers, and record their drawing revision.
- **HOLD PROP_SWEEP:** Propeller tip envelope is inferred from model name. Next: Measure the actual tip-to-tip diameter and fixture/hub stack-up.
- **HOLD MOTOR_ARM_INTERFACE:** Arm-to-motor mounting is not qualified. Next: Inspect both mechanical drawings and motor fastener lengths.
- **HOLD PROP_HUB:** Propeller hub and motor shaft interface is not qualified. Next: Inspect original prop and motor drawings; check retention system.
- **HOLD STACK_EOL:** Reference SpeedyBee F405 V5 stack is discontinued. Next: Record a specific available replacement SKU and obtain its exact manufacturer documentation.
- **HOLD BATTERY_SKU:** Battery is an unqualified 6S mass assumption. Next: Specify the exact pack SKU and inspect its datasheet.
- **HOLD UNRESOLVED_MASS:** Accessories and assembly mass are assumptions. Next: Weigh the revision-specific parts and complete BOM.
- **HOLD NO_ALL_UP_MASS:** No measured ready-to-fly mass. Next: Weigh the assembled aircraft with actual battery/props/camera.
- **HOLD RC_FAILSAFE:** Radio, receiver, failsafe and ground link are unspecified. Next: Specify exact control link and test failsafe props-off.
- **HOLD REGULATORY:** Operation requirements not independently documented. Next: Review current FAA and local airspace rules for actual aircraft/operation.
- **HOLD SITL_COEFFICIENTS:** Gazebo thrust/torque coefficients and inertias are missing. Next: Measure mass properties and identify motor kT/kQ and spin-up dynamics; then calibrate SITL.

## Sequence

### 01 · Source evidence
- [ ] Freeze exact frame, motor, prop, ESC/FC, battery, radio/video SKU revisions
- [ ] Download the Source Two v0.1 CAD directly from upstream, preserving GPL terms
- [ ] Inspect manufacturer mechanical drawings and dimensional interfaces
- [ ] Replace the discontinued FC/ESC with an available specified assembly

### 02 · Mechanical qualification
- [ ] Import actual frame STEP and identify each of four motor shaft centers
- [ ] Inspect clearance volumes for props, battery, stack, camera, wiring and antenna
- [ ] Check every motor screw length against mounting-plate depth and winding clearance
- [ ] Weigh components and determine assembled center of gravity and mass properties

### 03 · Unpowered build & electrical
- [ ] Assemble frame without propellers and check fastening/stack isolation
- [ ] Derive connector-specific schematic from current FC/ESC/BEC and VTX manuals
- [ ] Double-check polarity, continuity, fused protections and correct charger/LiPo handling
- [ ] Props-off initial power-up through current-limited protective equipment

### 04 · Firmware and test evidence
- [ ] Verify exact firmware target, motor ordering, spin directions and sensor alignment props-off
- [ ] Configure and test RX link-loss, arming interlock and low-voltage response props-off
- [ ] Record revision-scoped ESC and propulsion tests in controlled fixture
- [ ] Build/calibrate PX4 SITL ONLY after required measured inertial/actuator parameters exist

### 05 · Independent approval & staged flight
- [ ] Verify TRUST/registration/Remote ID and airspace suitability for the actual mission
- [ ] Obtain an experienced independent inspection before any prop-on tests
- [ ] Perform controlled first flight at appropriate authorized site and log findings
- [ ] Review logs and close discrepancies before increasing flight envelope

## Reference sources
- TBS-FRAME: https://www.team-blacksheep.com/products/prod:source_two_5in
- TBS-CAD: https://github.com/ps915/source_two
- TMOTOR-MOTOR: https://store.tmotor.com/product/v2207-v2-fpv-motor.html
- TMOTOR-PROP: https://store.tmotor.com/product/t5143s-fpv-propeller.html
- SPEEDYBEE-STACK: https://www.speedybee.com/speedybee-f405-v5-55a-stack/
- PX4-SITL: https://docs.px4.io/v1.18/en/sim_gazebo_gz/
- FAA-REG: https://www.faa.gov/uas/getting_started/register_drone

> The packet is a planning checklist, NOT assembly approval, a wiring diagram, or an operating permit.
