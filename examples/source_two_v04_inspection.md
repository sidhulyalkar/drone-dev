# AeroForge v0.4 · Engineering inspection packet

Reference: source-two-v0.1-tmotor-1750
Engineering status: BLOCKED
Flight authorization: NEVER DERIVED FROM AEROFORGE

## Part identities
- frame: tbs-source-two-v01
- motor: tmotor-v2207v2-1750
- prop: tmotor-t5143s-revision-unknown
- stack: speedybee-f405v5-55a

## Interface graph
- **PASS_DOCUMENTED** [frame-stack-pattern] frame → fc-esc (mechanical): Source Two DXF reveals 30.5-mm square mount and stack lists 30.5-mm nominal pattern. Bolt-hole/spacing and installation not yet qualified.
  - Evidence: TBS-MAIN-DXF, SPEEDYBEE-STACK
  - Next: Check actual bolt diameter, spacers, plate and board shape in 3D.
- **HOLD_GEOMETRY** [stack-height] frame → fc-esc (geometry): No registered manufacturer STEP/GLB and stack Z-envelope for this pairing.
  - Evidence: TBS-CAD, SPEEDYBEE-STACK
  - Next: Perform datum registration and collision check against actual mesh.
- **PASS_DOCUMENTED** [battery-motor-voltage] battery → motor (electrical): 6S is within the motor documented 5–6S screening range.
  - Evidence: TMOTOR-MOTOR
  - Next: Confirm pack sag, connector, current and thermal limits.
- **PASS_DOCUMENTED** [battery-esc-voltage] battery → fc-esc (electrical): 6S is within the selected stack 2/3–6S rating.
  - Evidence: SPEEDYBEE-STACK
  - Next: Check measured pack voltage transients and exact harness.
- **PASS_DOCUMENTED** [esc-current] motor → fc-esc (electrical): Nominal ESC continuous per-channel exceeds max current in one T-Motor static test. Does not qualify thermal duty cycle.
  - Evidence: SPEEDYBEE-STACK, TMOTOR-MOTOR
  - Next: Measure application current, temperatures and harness bottlenecks.
- **HOLD_SOURCE** [battery-connector] battery → fc-esc (connector): Connector pairing not specified
  - Evidence: SPEEDYBEE-STACK
  - Next: Verify current, polarity, real connector gender and wiring before powering.
- **FAIL_SOURCE** [stack-availability] fc-esc → procurement (sourcing): SpeedyBee F405 V5 OX32 55A stack: DISCONTINUED. Retail listings are not real-time procurement authority.
  - Evidence: SPEEDYBEE-STACK
  - Next: Choose a current, exact and demonstrably obtainable stack before ordering.
- **HOLD_SOURCE** [fc-firmware] fc-esc → autopilot (protocol): Candidate advertises Betaflight; the current simulation contract targets PX4 and has no validated PX4 firmware target.
  - Evidence: SPEEDYBEE-STACK
  - Next: Validate the exact autopilot and simulator path independently (do not assume Betaflight compatibility with PX4).
- **HOLD_SOURCE** [fc-pinout] fc-esc → receiver-video (connector): No version-locked actual battery, receiver, video/BEC pinout integration is provided.
  - Evidence: SPEEDYBEE-STACK
  - Next: Record source revision, ports, BEC load, UART assignment, continuity and props-off bench results.
- **HOLD_MEASUREMENT** [motor-screw-depth] frame → motor (mechanical): Motor bolt clearance/engagement is unknown.
  - Evidence: TBS-CAD, TMOTOR-MOTOR
  - Next: Inspect fastener lengths/clearance against original mechanical drawings and actual motor.
- **HOLD_SOURCE** [prop-hub] motor → prop (mechanical): 4-mm manufacturer motor shaft value does not prove prop hub/retention fit.
  - Evidence: TMOTOR-MOTOR, TMOTOR-PROP
  - Next: Inspect specific propeller revision, bore, fastener and directions.
- **HOLD_MEASUREMENT** [rotor-clearance] frame → prop (geometry): Measured XYZ motor centers and prop swept diameter not supplied.
  - Evidence: TBS-CAD, TMOTOR-PROP
  - Next: Extract motor XYZ from registered original STEP, inspect all 3D intersections and dynamic clearance.
- **HOLD_MEASUREMENT** [coordinate-provenance] frame → rotor (evidence): Motor centers are not measured or registered to source CAD.
  - Evidence: TBS-CAD
  - Next: Check actual source revision, axes, datums and independent measurements.
- **HOLD_MEASUREMENT** [ready-to-fly-mass] aircraft → test (evidence): No weighed aircraft with installed battery and flight hardware.
  - Evidence: MISSING
  - Next: Attach test record with scale serial, method, revision and date.
- **HOLD_MEASUREMENT** [cg-inertia] aircraft → simulator (physics): No measured baseline mass/CG and inertial tensor.
  - Evidence: MISSING
  - Next: Measure base CG and 6 inertial tensor components; include wiring/battery position.
- **HOLD_CALIBRATION** [simulation] aircraft → PX4-Gazebo (simulation): Missing measured inertias, motor coefficients, spin response, actual rotor mappings and valid PX4 target.
  - Evidence: TMOTOR-MOTOR
  - Next: Complete physical tests and then execute pinned SITL.

## Source and measurement separation
Manufacturer facts, source CAD, user assertions and calibrated measured findings remain different evidence classes.
DXF-derived holes only prove 2D manufacturing drawing locations, not 3D assembly registration.
No powered or flight operation is authorized by this inspection packet.

Design SHA-256: 804aab84e4b8712d71ded1d4d95906df4f15c14d66c01fc7efad6963675d6ffb
