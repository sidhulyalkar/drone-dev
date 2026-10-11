# AeroForge v2.3 · Per-interface evidence matrix (first implementation)

The new pure module `core/interface_evidence_v23.mjs` joins the v2.1 documented interface graph with the **existing v2.2 immutable observations** through a separate, explicit association ledger.

- Each check is addressable as `edgeId:checkIndex`, for example `motor-esc:0`.
- Users link an existing `evt-####` observation to a check, with a substantive rationale.
- The underlying observation must be current and reference one of the interface's documented parts.
- A second-person journal review is displayed as **review recorded**, not certified.
- Changing the aircraft revision, controller or battery selection keeps links for audit but shows them as stale. 
- Checks display either `MISSING_CURRENT_EVIDENCE` or `EVIDENCE_RECORDED_NOT_VERIFIED`. Neither means the requirement is satisfied.
- Unpowered electrical checks, polarity, pin maps, ratings, physical registration, and safety reviews remain outstanding.
- No automatic purchasing, bench-power or flight authority is ever emitted.

## API

`startInterfaceEvidenceLinks(record)`, `appendInterfaceEvidenceLink(ledger,journal,record,link)`,
`validateInterfaceEvidenceLinks(ledger)`, `reconcileInterfaceEvidenceLinks(ledger,record)`,
`interfaceEvidenceMatrix(ledger,journal,record)`.

The ledger is a research association layer, **not cryptographically authenticated evidence**, and should be exported or stored only with explicit user consent. It is deliberately not merged into the v2.2 journal schema.

## Still needed

1. A collapsed check-level UI and explicit, consent-based save/export/import for association records.
2. Recorded manufacturer pin-level drawings, polarity and independently checked reviewer artifacts.
3. Genuine X500 frame STEP and motor CAD ingestion, hashes, source licenses and independently recorded mechanical datum comparisons.
4. Physical assembly inspection and calibrated measurement by a qualified practitioner.

**Current release scope:** core check-level association model + automated regression tests, not a flight qualification or physical-CAD validation.
