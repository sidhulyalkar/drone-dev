# AeroForge v0.8 · Assembly Copilot

## What is implemented

Section 14 is a usable workbench, not an automated inspection or certification product. It generates a conditional, deterministic series of original steps for either **FPV / Betaflight** or **X500 V2 / PX4**, linked to the current illustrative configurator and the v0.7 exploded-view part IDs.

- Change the FPV video family (analog, DJI O3, Walksnail or unresolved) to switch the video installation reference and revision dependency.
- Change PX4 controller variant (Pixhawk 6C vs Pixhawk 6X) to update the PX4 documentation path and matching module family.
- Select a stage; inspect required tools, prerequisites, relevant visual parts, troubleshooting guidance and an external primary learning/reference link.
- Select a part chip to jump to its illustrative 3D model in Section 13. Selecting a part in the showcase also navigates to the first associated assembly stage.
- Record notes, issues, source references and self-reported measurements with units. The application stores them under `aeroforge.assembly.v08.local-only` in this browser's localStorage. Nothing is uploaded by this feature.
- Export an editable JSON work record and a human-readable Markdown packet containing evidence holds, selected step sources and invalidated older records.
- Stage evidence is scoped to an explicit dependency key. A changed stack, motor, video system or airframe revision preserves unrelated notes and archives affected notes as invalidated, instead of silently granting their old status to the new hardware.

## Explicit authority boundaries

**Nothing in the Assembly Copilot authorizes charging, battery connection, motor spin-up, first power, flight or purchase.** Safety stages remain blocked or `SAFETY_REVIEW_REQUIRED` even after every user observation is saved; there is no self-service 'verified' button. The 3D viewer uses **procedural educational geometry**, not a collision-qualified manufacturer assembly, and no wiring pins are synthesized or presented as trustworthy connections.

The PX4 track refers to **Holybro X500 V2 component families**, not the editable illustrative drone currently displayed in Section 13. Click-to-focus is an educational representation until a manufacturer CAD model is imported with hashes, revisions and measured anchors. The program never imports Betaflight CLI settings into a PX4 build.

Part-number text entered by a user changes dependency keys, but it is not automatically checked against current manufacturer source data. Photos, multimeter log uploads, professional signoff, source-authenticated pinouts, physical inspection records, and autonomous firmware configuration are **not yet implemented**. Users may record instrument models and measurement values; all entries remain `SELF_REPORTED_UNREVIEWED`.

## Source provenance

Primary assembly-course learning references are original Bardwell 2023 FPV playlist video URLs with timestamps from the companion research document: https://www.youtube.com/playlist?list=PLwoDb7WF6c8l24IM83wIS94XzhuMVC2gx . No re-hosting or transcript reproduction.

PX4 learning links and setup references:
- https://docs.px4.io/main/en/frames_multicopter/holybro_x500v2_pixhawk6c
- https://docs.px4.io/main/en/config/actuators
- https://docs.px4.io/main/en/sim_gazebo_gz/vehicles
- https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2

Current manufacturer firmware and wiring manuals supersede generic learning videos. Do not infer a pad assignment from a video featuring a different SKU.

## Developer architecture

| Module | Purpose |
|---|---|
| `core/assembly_v08.mjs` | Pure conditional graph, strict inputs, dependency fingerprints, receipt capture, revision reconciliation, printable packet |
| `assembly_ui_v08.mjs` | Responsive workbench, local-only persistence, exports, v0.7 part focus integration |
| `assembly_v08.css` | Standalone styles and mobile stage navigation |
| `tests/assembly_v08.test.mjs` | FPV/PX4 branches, video choice, prerequisite order, revision invalidation, safety hold, UI contracts |

Run `npm test` for all JavaScript tests, `npm run setup:cad && npm run test:cad` for the separate Python geometry smoke tests.

## Next steps

1. Replace generic kit part IDs with live purchase receipts and manufacturer-revision-specific identity in the evidence ledger.
2. Add pinout-aware wiring connections only after matching both endpoint revisions and source documents.
3. Store optional photos and measurement artifacts in local IndexedDB with revocation/exports; no implicit upload.
4. Integrate actual imported CAD at each step, including assembly constraints and mechanical interference testing.
5. Add human-reviewed signoff receipts with provenance while retaining non-authoritative status absent real-world verification.
6. Perform visual/browser QA at desktop/mobile resolutions, keyboard navigation and reduced-motion settings.

**There is no release-ready aircraft or calibrated flight simulator in v0.8.**
