# AeroForge · Evidence-first hardware qualification

**Principle:** Source documentation is not a mechanical fit test; a good-looking model is not evidence of airworthiness.

## Candidate maturity

| Label | Meaning | Allowed product behavior |
|---|---|---|
| `ILLUSTRATIVE` | Generic sizes and synthetic costs | Screen hypothetical combinations, no purchase links |
| `SOURCE_LEAD` | Named real hardware with manufacturer/distributor documentation | Show provenance and remaining questions, never silently substitute |
| `REVISION_SOURCED` | Exact SKU/revision, dated full specification with primary sources | Candidate for compatibility calculations; no flight approval |
| `MEASURED` | Instrumented measurements, CG/clearances, thrust-current and thermal logs | Model calibrated to qualified dataset with uncertainty |
| `BUILT_INSPECTED` | As-built serial/revision, independent inspection and recorded tests | Can present inspection records; no automatic flight authorization |

Current `core/catalog.mjs` selections are exclusively `ILLUSTRATIVE`. Real leads under `core/evidence.mjs` are `SOURCE_LEAD` and **never change the flight calculations**.

## Source record expected schema

```json
{
  "source_id":"mfg-component-revision-date",
  "manufacturer":"…",
  "product_name":"…",
  "manufacturer_part_number":"…",
  "revision":"…",
  "part_category":"frame|motor|prop|fc_esc|battery|video|rf|payload|ground",
  "retrieved_at":"YYYY-MM-DD",
  "manufacturer_url":"https://…",
  "drawing_url":"https://…",
  "availability":"current|discontinued|unknown",
  "evidence_grade":"source_lead|revision_sourced|measured",
  "physical":{"mass_g":null,"geometry_mm":null,"mounting":null},
  "electrical":{"battery_cells":null,"voltage_range":null,"current_A":null,"regulator_rails":null},
  "measurements":[{"dataset_id":"…","fixture":"…","instrument_calibration":"…","raw_csv":"…"}],
  "unresolved":["…"]
}
```

Every numerical field must distinguish `manufacturer_declared`, `lab_measured`, and `estimated`. A reviewer must preserve the unit, original quote, URL, retrieval date and revision-specific caveats. A source can disagree with a retailer; never merge conflicts silently.

## Required gates for first build

1. Confirm actual frame wheelbase, plate geometry, hole centers, camera mount and motor base pattern. Verify clearance with the propeller *swept envelope* and any duct shape, accounting for flex and production tolerances.
2. Confirm exact motor stator and KV variant, prop size/pitch/shaft mounting, thrust/current curves at actual pack voltage, thermal limits and ESC headroom.
3. Confirm flight-controller target and firmware, 4-in-1 ESC rating, regulator currents under *simultaneous* loads, connector pinouts and EMI/antenna separation.
4. Confirm battery pack nominal and maximum voltage, wire/connector compatibility, charging chemistry, pack mass and realistic usable energy and voltage sag.
5. Confirm airframe as-built weight, full payload and center of gravity, battery mounting restraint, antenna protection and fastener length with tolerances.
6. Perform documented props-off inspections before electrical startup. Store motor mapping, radio-loss failsafe, current limiter records, motor test safety and calibrated sensor reports.
7. Complete regulatory, site, airspace and weather review and obtain independent inspection for real flight tests.

## Initial source leads, researched 2026-10-10

- **TBS Source One V5 5-inch frame**: manufacturer/distributor specs list 226 mm wheelbase, 30.5/20 mm FC patterns and nominal 123.5 g. Important: V5 versus V5.1 revisions can vary; verify exact product and measurements. [Lumenier frame reference](https://www.lumenier.com/products/tbs-source-one-v5-5-frame-kit).
- **SpeedyBee F405 V4 BLS 55A 30×30 stack**: manufacturer lists 30.5 mm mounting, 3S–6S input and 55 A continuous ESC output, but **discontinued**. Do not build a live purchasing flow around this product. [SpeedyBee original page](https://www.speedybee.com/speedybee-f405-v4-bls-55a-30x30-fc-esc-stack/).

**Future work:** choose one *currently available* product in every airframe slot, capture source revisions, qualify pairwise compatibility and produce a fully documented measurement worklist. Source facts must not be confused with purchase availability or physical verification.
