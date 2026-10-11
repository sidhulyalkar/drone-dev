# AeroForge 0.5: PX4 research program and simulation evidence gates

Two tracks are independent:

1. **Atlas / PX4 Explorer:** intended larger (planning class only) 450–550 mm multirotor quad with modular sensing. Frame, flight controller, ESCs, power distribution, link, payload and optional companion computer all remain **UNQUALIFIED**. Target 15 min is a requirement, **not an endurance prediction**. No manufacturer SKUs or price claims are attached.
2. **Source Two / FPV benchmark:** historical mechanical and propulsion reference, not PX4-compatible by implication. Existing investigated Betaflight-oriented stacks are not mapped to a PX4 board target. The upstream frame source is [ps915/source_two](https://github.com/ps915/source_two); it is GPL-3.0 and **not copied into this MIT repository**. Published DXF-derived datum coordinates are attribution-linked research facts, not registration of an assembled frame.

## Next milestone acceptance criteria

- Exact frame revision, current obtainable BOM, datasheets, manufacturer CAD and source captures including license; mark missing items open, not green.
- Record motor-center XYZ, prop clearance to frame, sensor mounting and center of mass from the actual assembled CAD; preserve source hashes, transform frames and units.
- Record FC firmware and PX4 board target, ESC outputs, ESC protocol, motor directions and tested loss-of-link behavior. Electrical work must follow manufacturer documentation and qualified procedures.
- Measure mass and complete inertia tensor, thrust/torque as functions of rotor speed or control input, response times and real battery pack behavior. Record test condition, fixture, source revision, hash, uncertainties and repeatability.
- Generate Gazebo model **only after** the full calibration input audit passes; independently check actuator ordering, rigid-body response, controller and sensor models. Simulation accuracy requires correlation against real measurements. Do not use the synthetic sandbox as PX4 validation.
- Generate a revision-linked assembly planning packet with torque specs, exact connectors, cable routing, power protection, prop safety and inspection records after manufacturer authority is established.
- Flight operation, even after modeling, requires physical build inspection, controlled field testing, local rule review and independent safety approval.

## Validation

```bash
npm test
python3 -m pip install -r requirements-cad.txt
npm run test:cad
```

`core/program_v05.mjs`: bounded architecture and explicit release gates.
`core/simulation_v05.mjs`: calibration completeness audit, physical qualification always false; 1D synthetic vertical dynamics with no flight-control fidelity claims.
`core/evidence_v05.mjs`: immutable-style evidence record shape, file hashes as identifiers only; independently inspect source content before interpreting claims.
`program_ui.mjs`: browser interface to both tracks, exports and synthetic trajectory visualization.

### Not delivered

No assembled STEP model, no current qualified hardware procurement list, no instrumented motor stand, no PX4 SITL run, no valid measured flight dynamics and no physical flight testing. CI tests check software contracts and synthetic geometry only.
