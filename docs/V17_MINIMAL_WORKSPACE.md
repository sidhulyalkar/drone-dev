# AeroForge v1.7 · Minimal Workspace Interface

## Product goal
Make an aircraft understandable before teaching every engineering term. Preserve CAD integrity, sources, assembly notes, holds, exports and revision-sensitive evidence through v1.6.

## Information architecture
**Explore** is the default. Mission planner, presets, live 3D configurator, mission architecture and its 3D concept scene.
**Build** contains the exploded showcase and revision-aware Assembly Copilot.
**Engineering** contains reference parts, qualification, simulation, X500 kit graph, dimensional screening and imported CAD/source-datum/feature labs.
Three permanent buttons replace eleven equally prominent top-level shortcuts. The secondary All tools dropdown preserves each existing section anchor. Old deep links activate the right workspace, including nested mission-v10 inside mission-v09. Query parameter view=build or view=engineering also works. An explicit hash takes precedence over the query.

## Progressive disclosure
- Mission planner initially shows mission and budget. More options reveals payload and optimization priority without changing values.
- Component Lab retains values and begins behind Customize components.
- Flight summary retains readiness and blocker count, illustrative cost and time. Full analysis reveals additional metrics, sensitivity and engineering envelopes.
- If actual blockers are present, their compatibility findings remain visible in the compact view.
- No UI selection grants physical, purchase, power or flight approval.

## Implementation
core/workspace_v17.mjs classifies persistent root sections and resolves URL workspace selection.
navigator_ui_v12.mjs now toggles the hidden attribute on existing main children, never reconstructing the models or forms. Reappearing WebGL areas receive resize notifications; ResizeObservers can then recalculate dimensions.
index.html retains all section identifiers, adds three workspace controls and an All tools disclosure, and removes duplicate v1.6 stylesheet/script imports.
workspace_v17.css includes responsive layout, keyboard-visible focus, mobile navigation and reduced-motion adherence.

## QA
Unit tests check classification, hash/query precedence, selectors, retained deep links and removal of duplicate imports.
Chromium tests check default Explore, collapsed and expanded controls preserving form values, Build/Engineering switches retaining dimensional review, old deep links and the mobile viewport while maintaining previous CAD-source and hardware tests.

## Deliberate non-goals
- Three.js viewers are not yet merged into a single renderer; that needs a separate lifecycle-aware performance release.
- No new registered source geometry or physically validated flight configuration.
- Existing modules still load on entry, although their heavy content is not all visible; true code splitting needs browser QA first.
- Safety holds and evidence gates are unchanged by workspace visibility.

## Next
1. One shared 3D viewport with lifecycle-aware modes and safe GPU cleanup.
2. A selected-part inspector connecting SKU, source, geometry, compatibility and build instructions.
3. Progressive onboarding with mission -> inspect -> build checks.
4. Visual/mobile/keyboard testing, failed-WebGL path and performance budgets.