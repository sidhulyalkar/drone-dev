# AeroForge v0.7: Exploded Assembly Showcase

## Product intent

Section 13 lets someone visually inspect the relationship between an airframe's structure, propulsion, control stack, power chain and sensor payload. Select one of six illustrative design presets in Section 01, then scroll to Section 13 to explore its **schematic procedural model**. Changes to the same configurator propagate into the showcase.

## Controls

- **Reassemble:** return each part to its nominal visual anchor and restore the overall camera framing.
- **Explode:** separate each part using a stable per-part 3D offset.
- **Play tour / Pause:** introduce the exploded assembly, visit parts in catalog order, focus the camera, then reassemble at the end.
- **Previous / Next:** inspect one part at a time and pause autoplay.
- **Subsystem:** filter to airframe, propulsion, control, power/wiring, sensing/FPV or payload.
- **Speed:** 0.5x to 2x tour playback.
- **Click model/list item:** manually focus that part. Arrow keys work while keyboard focus is in the showcase section.
- **Manifest JSON:** export geometry descriptors and selected reference assumptions for review. This is *not* a mechanical fabrication file.

The offline SVG fallback retains part selection, explanatory cards and tour progression without WebGL or Three.js. The 3D renderer requires the application's existing online Three.js import map. Part meshes are disposed when the design changes.

## Architecture

- `core/showcase_v07.mjs`: pure geometry descriptor generation and a deterministic, testable tour state machine; no Three.js dependency.
- `showcase_3d_v07.mjs`: separate Three.js groups for individual components, procedural geometry with materials/details, raycast selection, progressive explosive offsets and eased camera tracking.
- `showcase_ui_v07.mjs`: browser controls, live configuration updates, evidence cards, JSON export and 2D fallback.
- `showcase_v07.css`: responsive theater/inspector layout.
- `tests/showcase_v07.test.mjs`: structural invariants, controller transitions, reset/filters, input handling and DOM binding checks.

This feature does not change `core/engine.mjs`, safety gates, or qualified manufacturer parts. The X500 V2 and Source Two engineering labs remain separate.

## Authority boundary

Every descriptor carries `ILLUSTRATIVE_NOT_CAD_VERIFIED` and `UNVERIFIED_CLASS_NOT_SKU`. Propellers are schematic shape approximations, not blade airfoils; motor bell and PCB details are non-dimensional visual cues; esc/power wiring is not a wiring schematic. Component placement is based on the **illustrative wheelbase** and generalized visual scaling, not the imported CAD assembly. **Do not use exported anchors/offsets for manufacturing, drilling, electrical wiring, collision certification or flight clearance**. The source-backed manufacturer path still needs an actual STEP import, source revision and independent measurements.

## Validation

Run `npm test` for the full JS suite. The v0.7 module tests can also run independently with `node --test tests/showcase_v07.test.mjs`. A real browser/WebGL render QA and imported-manufacturer-CAD comparison are a separate required acceptance step, not covered by the Node tests.

## Next graphics iteration

1. Add optional source-registered GLB meshes, each with part IDs, units and provenance.
2. Introduce bounding-volume checks, fasteners, exploded-axis constraints and no-clipping animation planning.
3. Add focused cross-section views for wiring, bearing, motor stack and optical pathway.
4. Export timed showcase sequences as screen captures only when the current geometry source is visible throughout.
