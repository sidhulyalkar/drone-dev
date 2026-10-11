# AeroForge v0.4 delivery contract

The next release should promote one **complete current-production aircraft** rather than multiply partial airframe mockups.

1. Replace the discontinued F405 V5 reference stack with an available exact FC+ESC, recording pinout, frame and camera fit; select an exact battery, receiver, FPV transmitter and propeller with verified vendor specifications and mass.
2. Acquire the source frame STEP, import/export geometry with preserved license, and extract true motor XYZ; retain individual source hashes, dimensions and geometry transform metadata. Add stable component datum frames/attachment transforms.
3. Implement actual mesh / solid intersection checks with tolerances: rotor sweep v frame/payload, motor mount holes/depth, stack vs plate/standoff clearance, camera and power component envelopes, CG and wire routing.
4. Create a typed compatibility graph across mechanical holes, connectors, electrical voltages/current and protocols. Rule inputs must cite manufacturer fields with explicit revision IDs.
5. Bench-measure mass and thrust-current at low load under actual 6S voltage sag, compute bounded uncertainty/sensitivity, instrument temperatures and current rating; validate against logged hover.
6. Generate an executable PX4 Gazebo SDF **only when** validated inertia, actuator coefficients, mesh and motor mappings are present. Test hover and step response in continuous integration with pinned PX4/Gazebo versions.
7. Generate an exploded assembly, revision-specific BOM, exact manufacturer-manual wiring map and inspection checkpoints. No power / flight operations authorized by software alone.
8. Set acceptance fixtures: wrong screw lengths, swapped motor direction, voltage/connector mismatch, changed vendor revisions, collision, missing source and pack CG offset must fail with traceable blockers.

Do not silently replace discontinued or unknown components with synthetic ones. Preserve `status=EVIDENCE_HOLD` until the listed gates are independently met.
