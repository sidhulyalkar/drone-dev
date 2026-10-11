# AeroForge v2.0 · Dated Manufacturer SKU Research Catalog

## Scope

One vertical slice of **published exact SKU identities** integrated into the existing X500 V2 reference and kit-screening UI. This is **not** a shopping cart, live inventory scraper, qualified hardware bill of materials, electrical wiring guide or approved aircraft.

## Verified-in-source manufacturer references, reviewed October 11, 2026

Official Holybro X500 V2 Store: https://holybro.com/products/px4-development-kit-x500-v2

SKU | Published bundle variant | Documented page-listed reference price at review
---|---|---
30188 | Pixhawk 6C / M10 GNSS / SiK 433 MHz | USD 579
30189 | Pixhawk 6C / M10 GNSS / SiK 915 MHz | USD 579
30199 | Pixhawk 6X / M10 GNSS / SiK 433 MHz | USD 669
30200 | Pixhawk 6X / M10 GNSS / SiK 915 MHz | USD 669

The SKU IDs, bundle options and page-listed USD values come from the official manufacturer page. **Prices are stored solely as dated references and are not live.** Stock, shipment destinations, import duties, seller identity, hardware revisions and regional RF compliance are not independently checked and must not be inferred from the presence of a published option.

Holybro also publishes X500 V2 Frame Kit **SKU 30120**, nominal 500 mm wheelbase and 144 x 144 mm plates: https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2 . Its older documentation mentions 16 x 16 mm motor mount while the current Holybro Store also mentions 19 x 19 mm. They are retained as a revision-dependent source discrepancy, not blindly merged into a qualified mating interface.

The older Holybro X500 documentation refers to M8N and motor-side XT30; its current store lists M10 and notes MR30 motor connectors with XT30 ESC connectors. Differences must be resolved against the received kit and the actual revision. For Pixhawk 6X the current store notes a PM02D-HV variant and relevant firmware requirements, not yet automatically qualified.

An independent official SpeedyBee example, **F405 V4 BLS 55A 30×30 FC/ESC Stack**, published SKU `SB-F4V4-55-STACK`, is retained as `MANUFACTURER_DISCONTINUED`. Source: https://www.speedybee.com/speedybee-f405-v4-bls-55a-30x30-fc-esc-stack/ . Its 30.5 mm mounting pattern, listed Betaflight/INAV support and nominal ESC current are manufacturer-level facts, not a physical fit guarantee or current procurement option.

## New data model

`core/source_catalog_v20.mjs` defines `SOURCE_CATALOG_SCHEMA`, `SOURCE_SKUS`, `findSourceSku`, `sourceSkuChoices`, `inspectSourceSku`, `diffSourceSku`, `createSourcingResearchPacket` and `attachSourcingReference`.

Each record retains a manufacturer page, published SKU and possible vendor-defined variant ID, UTC-free snapshot date, source-referenced claims, delivery revision **null**, source discrepancies, item lifecycle, dated historical price (if supplied), unverified inventory, and explicit false procurement/physical/power/flight qualification.

The screening function flags mismatched Pixhawk bundle families, non-4S batteries versus the documented kit ESC family, and discontinued items. `attachSourcingReference` only annotates a matching canonical X500 V2 revision-scoped source reference; it does **not** change the selected drone's real hardware identity or grant any approval. If the user changes the kit controller family or battery cell selection, the UI drops an incompatible linked research SKU rather than carrying it into the new variant silently.

## Minimal UI

Under **Engineering → X500 Hardware**, expand the secondary **Source catalog** disclosure. The default screen has one manufacturer SKU selector, a few documented claims and source details, and an explicit research-only status. Technical requirements and contradictory documentation are expandable, as is a second-candidate comparison.

`sourcing_ui_v20.mjs` supports side-by-side published identity comparisons and JSON evidence packet export, with a link to the official manufacturer reference. **The vendor link is not presented as an order-ready CTA**. A `Link as research candidate` action exists only for complete-kit SKUs that match the currently selected X500 controller family and 4S kit battery screening; it records the source SKU in the canonical exported X500 record without marking any physical hardware as received.

## Release acceptance

- Exact SKU options and manufacturer page references are unique, dated, HTTPS and research-only.
- Store choices cover all four 6C/6X × 433/915 MHz published variants.
- Discontinued SpeedyBee and conflicting documentation remain explicit.
- A mismatched 6C/6X SKU or an off-series battery blocks linking.
- The canonical X500 record remains unqualified for procurement, electrical power or flight even after a source SKU is linked.
- Chromium tests verify mismatch rejection, variant switching, research linking/unlinking, discontinued item handling and research-packet export, in addition to all existing v1.9 tests.

## Next engineering tranche

1. Add vendor/part-level SKU provenance and independent revision verification for motor, ESC, FC, PM and connectors, with exact delivered-part identifiers.
2. Make source-specific part identity explicit in the Build 3D inspector, without equating X500 vendor parts to the separate illustrative FPV airframes.
3. Persist structured sourcing research workspaces by stable candidate IDs, but keep costs and inventory as dated snapshots with visible timestamps.
4. Integrate manufacturer-licensed STEP assets, independently checked coordinate/datums and traceable mount/interface pairings.
5. Only after reliable physical compatibility and safe integration: offer qualified BOM/part-order workflows.
