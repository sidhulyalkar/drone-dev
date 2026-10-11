# AeroForge v1.9 · Contextual Component Inspector

## Goal

Turn 3D part selection into a focused engineering decision: What is the part? Which *illustrative* catalog class is selected? Which candidate alternatives change the design screen? Is there a manufacturer/source reference to investigate? Which actual Assembly Copilot step handles this part?

## Implementation

`core/component_inspector_v19.mjs` is the pure, testable data-model resolver. It maps each procedural scene ID (`frame`, `canopy`, `stack`, `esc-0..3`, `motor-0..3`, `prop-0..3`, etc.) to the active design's relevant catalog slot and detects when a visual object is *not* a separately orderable item (upper plate, power harness, antenna, ESC proxy, payload).

It extracts documented **illustrative class specifications** without promoting them to physical measurements. `screenCatalogAlternatives` independently invokes the existing full design engine for each candidate substitution, exposing blocked screening findings but NEVER elevating a lack of simulation blockers into verified compatibility. Class prices are labeled *illustrative*, not live vendor quotes.

`core/evidence.mjs` remains a separate real-world research-candidate ledger. It currently contains a TBS Source One V5 class analogue and SpeedyBee F405 V4 reference with sources, unresolved revision issues, and no permitted purchasing claim. Other catalog classes explicitly show that there is no verified SKU or order link.

`inspector_ui_v19.mjs` provides a small panel inside the **Build** 3D view with factual class data plus three collapsed disclosures: assembly steps, alternatives, and real-world sources. The original exhaustive part browser is itself collapsed as `Browse all components`. DOM text is constructed with `textContent` to avoid interpolating catalog/source fields into HTML.

The inspector listens for the existing showcase selection, current design changes, and the active Assembly Copilot plan. A step button carries the exact active plan key and step ID; the assembly UI rejects requests for old revisions. The candidate button sends a validated slot/id event to `app.mjs`, which reapplies the class and reruns the full engine and its blockers. The Build showcase preserves the selected conceptual part across a catalog swap where it still exists.

The existing CAD preview remains distinct. Selecting an imported CAD **solid** does not map it to a synthetic catalog SKU and cannot produce purchase guidance. When in CAD mode the generic catalog inspector is hidden and the CAD evidence view remains visible.

## Safety/engineering authority

- No exact received hardware SKU, manufacturer revision, measured mounting fit or wiring pinout is inferred.
- Manufacturer links, where present, are research/specification references, not qualified shopping carts; availability and current pricing are not established.
- A simulated candidate with zero screening blockers is still not confirmed physically compatible with the aircraft.
- Assembly-step links are learning and evidence records, not authority to energize, spin props or fly.
- All CAD source-hash checks, electrical blockers and revision invalidation behavior from previous releases remain in force.

## Acceptance checks

Unit tests: all 25 procedural part IDs map correctly; subassemblies never invent standalone SKUs; candidate swaps trigger full-engine screening; source references retain unknowns and non-orderable status; assembly links match exact current plan IDs; HTML DOM IDs and event contracts are wired.

Chromium tests: selecting a motor opens its contextual record and exact assembly step; trying a motor alternative reruns the design, retains selected component and surfaces blockers; selecting a frame displays the source-backed candidate and unresolved evidence. Existing workspace, mobile, CAD integrity and state preservation tests remain release blockers.

## Next

v2.0 should add a formal component-source registry for revision-qualified manufacturer SKUs, explicit connector and mounting compatibility relationships, source-traceable ordering URLs, user-set budget objectives, and a side-by-side candidate-to-candidate mechanical comparison. No automatic purchase qualification until received hardware dimensions and safety-critical electronics are independently inspected.