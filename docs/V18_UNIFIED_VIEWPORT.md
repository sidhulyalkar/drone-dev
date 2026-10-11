# AeroForge v1.8 · Unified Everyday 3D Viewport

## Goal

Use one clearly prioritized Build workspace viewer for assembled, exploded and local verified GLB geometry. Preserve the specialist CAD source-space inspection tool in Engineering rather than pretending its feature-picking controls are the same as a general aircraft configurator.

## Delivered

- Three explicit Build viewing modes: Aircraft, Exploded, Local CAD.
- Aircraft/Exploded use the existing procedural airframe manifest, part selection, camera, and tour controller.
- Local CAD mode uses the **same showcase Three.js WebGLRenderer and canvas**. It loads an isolated GLB root into that scene, scales it for a visually comparable viewport and turns off the procedural aircraft layer.
- Local CAD is locked until the Engineering package inspector has verified its manifest and GLB bytes. The Build receiver independently repeats `verifyCadPackage` against the same local GLB before invoking the renderer.
- CAD models remain in their native, unregistered coordinate frame and are normalized solely for visual framing. The screen never overlays or aligns them on the physical source X500 frame.
- CAD solid selection uses mesh-level visual names with an unverified provenance panel. It never borrows the catalog model's part descriptions, fit measurements or approval labels.
- Source changes and reset revoke the entire Build CAD package and disable the mode, without changing existing design or Build notes.
- Hidden Build/mission/CAD viewer canvases skip GPU draws when their workspace is not visible; already constructed scene state is preserved. Specialized Engineering CAD picking continues to use its own dedicated renderer.
- Explicit model and source authority labels stay visible, even in compact navigation.

## Browser interaction

Open **Build**. Choose Aircraft or Exploded to view the procedural parts; the familiar tour and part focus remain available.
To view locally converted CAD, first open **Engineering → Real CAD viewer** and select matching GLB + manifest (and optionally the original STEP file). Once hash checks succeed, return to **Build → Local CAD**. The same Build canvas displays unregistered source-derived solid geometry and a list of those solids. Use Engineering for the detailed source-point picking lab. A missing or tampered package leaves the CAD mode disabled.

## Important trust boundaries

1. A SHA-256 match links only local bytes and manifest claims, **not** manufacturer authenticity, geometry revision correctness, mounting transform, physical clearance, procurement or flight permission.
2. Local CAD preview and procedural geometry are distinct layers, never assumed congruent, and have no verified common datum.
3. The imported GLB is a visual preview in glTF metres. It is not independent validation of the source STEP's units or motors.
4. Reopening a previously verified package after reload requires selecting the local files again. GLB bytes are intentionally not stored permanently in localStorage.
5. The Engineering viewer remains separately mounted for source-space picking and accurate user annotations. v1.8 unifies the **everyday Build canvas**, not all GPU contexts throughout the entire app.

## QA

New Node tests exercise mode transitions and locked CAD provenance. Chromium interaction tests cover mode changes preserving one Build canvas, switching workspaces, tampered GLB rejection through the existing tests, local CAD data migration into Build, source reset and authority labeling.

## Next

- Make the Build viewer the default contextual 3D surface in Explore as well, without duplicating renderer contexts.
- Implement a reusable source-linked part inspector that maps physical SKU/revision, geometry, interface graph and assembly tasks.
- Add GPU capability/lost-context recovery instrumentation, measured frame-time budgets and automated screenshots at mobile/tablet/desktop breakpoints.
- Physically inspect Holybro STEP and motor-source solids with independent datum and dimensional review before any mechanical fit claims.