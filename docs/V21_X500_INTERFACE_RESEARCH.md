# AeroForge v2.1 · X500 Part Interfaces and Source-Bound Research

## Purpose

Extend the v2.0 published-SKU research catalog into a typed, source-auditable description of X500 motors, ESCs, PDB, controller power families, motor mounting, and still-missing cables/measurements. Give the **Build 3D part inspector** a direct, clearly separate entry to X500 manufacturer research without misrepresenting the illustrative FPV parts as source-backed X500 hardware.

## Manufacturer documentation reviewed 2026-10-11

- [Holybro X500 V2 development kit](https://holybro.com/products/px4-development-kit-x500-v2): motor 2216 920KV, BLHeli S 20A ESCs (documented for 4S), preinstalled motor MR30/ESC XT30, PDB XT60/XT30, Pixhawk 6C analog PM02 V3 or Pixhawk 6X digital PM02D (newer kit notes PM02D-HV). **This is published family evidence, not inspection of delivered connectors or pinouts.**
- [Holybro X500 V2 spare parts](https://holybro.com/products/spare-parts-x500-v2-kit): option SKU **520085** for CW 2216 920KV motor, **520086** for CCW, **520081** for BLHeli S 20A ESC, and **18069A** for pre-soldered XT30 PDB. The spare-parts parent listing SKU is not itself the SKU of every option.
- [Holybro X500 V2 frame](https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2): frame-kit SKU **30120**, nominal 500 mm wheelbase, 144×144 mm frame plate and documented 16×16 mm motor mount, while the [current store X500 frame listing](https://holybro.com/collections/multicopter-kit/products/x500-v2-kits) lists 16×16 and 19×19 mm. Both remain revision-dependent source candidates until independently measured.
- [Holybro PM02D published product](https://holybro.com/products/pm02d-power-module): published SKU **15011** (2S–12S listing), I2C interface for Pixhawk 5X/6X family; not a compatible analog substitute for Pixhawk 6C. Product SKU 15011 is *not proof* that the X500 kit's received 6X power module is the same specific HV revision.
- [Holybro digital power module setup](https://docs.holybro.com/power-module-and-pdb/power-module/digital-power-module-pm-setup): PM02D-HV uses INA228 and firmware-dependent setup; actual delivered PCB revision, control board compatibility and exact I2C harness remain unresolved.

## Delivered

`core/interface_registry_v21.mjs`: authoritative, static documentation-snapshot registry for nine X500-related part/family references. It separates published option SKUs from generic bundled controller/power-module families without a verified delivered SKU. Every record has date, source URL, nominal claims, interfaces, missing connector gender/pin map, revision null, and explicit false purchase, power and flight qualification.

`analyzeInterfacePair` recognizes only *published interface-family* intersections such as MR30 motor phase, XT30 ESC DC, analog PM02 V3 or digital PM02D I2C. It does **not** fill in missing pin assignments, connector genders, polarities, voltage/current ratings, or mechanical datums. Digital PM02D with a 6C controller is a hard family mismatch; matching 6X/PM02D is still unverified at the pin and hardware-revision level.

`compileX500InterfaceAudit` selects a 6C analog or 6X digital bundle family, the CW/CCW published motor option, PDB and ESC references. It preserves required inspection holds: separated battery SKU, signal wiring/motor output mapping, fastener/mounting pattern, received physical connector and motor current/thermal testing. Battery series other than 4S blocks this documented X500 ESC kit screening even when controller/power family is otherwise consistent.

`interface_audit_ui_v21.mjs` adds a collapsed **Hardware interfaces** disclosure under **Engineering → X500 Hardware**. It shows selected vs alternative manufacturer family references, connector role labels, review requirements, a linked source document, an expandable dependency graph, and JSON research export. This is deliberately not a wiring harness rendering or a purchasing UI.

`inspector_ui_v19.mjs` exposes **Explore X500 [part] references** for selected procedural frame, motor, ESC, stack and PDB elements. The action opens the X500 research category in Engineering without changing the user's current FPV design. The UI explicitly states that X500 manufacturer references belong to a different aircraft family and are research analogues, not substitutions. No link is shown for unsupported scene components such as cameras.

## Evidence controls

- Published CW/CCW motor labels **cannot** establish PX4 actuator numbering, spin direction of the installed machine, or prop orientation.
- A matching MR30 or XT30 family **cannot** establish physical connector gender/keying, wiring order, polarity, continuous current capacity or physical fit.
- Published motor mount patterns cannot qualify a motor/frame mate without inspecting both received parts, exact fasteners and CAD datums.
- The X500 6X digital module and stock PM02D-HV versions may differ; the published standalone PM02D SKU cannot be silently assumed to match the received kit.
- There are no stock checks or validated current prices. The source documentation is a dated reference, not an order-ready BOM.
- No source link, export, family match or UI status authorizes purchasing, charging, battery energizing, propeller spin, test flight or commercial operation.

## Tests

Unit cases include exact published option identifiers and manufacturer provenance, CW/CCW separation, MR30/XT30 family matches with unverified polarity, hard 6C/PM02D rejection, 6X digital holds, mechanical mount ambiguity, selected kit family and 4S blocking, and source packet permissions.

Chromium cases include source interface navigation from the Build 3D inspector, variant-aware engineering audit status, published ESC/motor references, 6S block, and research-only exported records. Previous CAD integrity, 3D modes, mobile and assembly tests remain in CI.

## Next valuable milestone

1. Inspect actual manufacturer's STEP and one received motor/ESC/PDB set to create verified revision identifiers and measured mounting/connector datums.
2. Add controlled, opt-in manufacturer source updates with archived response hashes, checked source scopes and detected changes before replacing the snapshot.
3. Create formal `pinMapEvidence`, `mechanicalMateEvidence` and `partInspection` records, with evidence author, tool calibration and revision invalidation. Do not infer them from matching connector family names.
4. Attach resulting hardware-specific verified edges to a real BOM revision while keeping the generic FPV catalog independent.