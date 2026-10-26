# AeroForge v2.5 · Evidence Check Definition Stability and Browser Regression

## Why this patch matters

A versioned observation can remain genuinely attached to the historical interface requirement that triggered it, even if the current research registry updates that requirement. v2.3 linked an observation to `edgeId:checkIndex` alone, which is not sufficient when an engineering checklist is edited or reordered.

The v2.5 change preserves the **v2.3 import schema**, while strengthening newly created links with immutable, exact-text `requirementSnapshot` and `edgeSignature` (interface role and expected part endpoints), as well as `observationChecksum` (the existing v2.2 event receipt's noncryptographic integrity checksum). This prevents accidental reassociation when a different imported journal reuses an event ID. These remain user-declared associations, not authenticated signatures. The v2.2 FNV-style checksum detects accidental mismatch, **not adversarial tampering**.

### Status semantics

| Evidence status | Meaning | Counts in checks with current self-reported receipts? |
| --- | --- | --- |
| `SELF_REPORTED_EVIDENCE_LINKED` | Current aircraft context, current observation and exact requirement/endpoint snapshots match. | Yes, **still unverified** |
| `STALE_OR_INVALID_EVIDENCE` | Aircraft context changed, the observation is missing or no longer matches the interface. | No |
| `LEGACY_CHECK_BINDING_REQUIRED` | Historical v2.3 file has no definition snapshot. Can be imported, but must be reviewed and relinked manually. | No |
| `CHECK_DEFINITION_CHANGED` | Requirement text or interface role/endpoints no longer match the snapshot in the link. | No |
| `LEGACY_RECEIPT_BINDING_REQUIRED` | The export has a requirement snapshot, but no event receipt checksum. | No |
| `RECEIPT_CHANGED_OR_REPLACED` | A different observation event reused the old ID, or the original receipt changed. | No |

Relinking appends a new association, retains the previous link for audit, and never overwrites the v2.2 journal. Neither recorded receipt nor second-person review closes hardware checks or sets power, purchase or flight approvals.

The new collapsed interface checklist links to manufacturer source pages and provides **Select this check** on each requirement, taking the inspector to the exact link form.

## Browser safety and CI improvements

Prior to v2.5, the Playwright GitHub Actions job named "Browser workflow smoke tests" invoked *only* `tests/browser_v13.spec.mjs`. Having a `tests/browser_v24.spec.mjs` file did not mean that suite was actually executed.

The job now explicitly runs all three suites:

- `tests/browser_v13.spec.mjs`
- `tests/browser_v24.spec.mjs`
- `tests/browser_v25.spec.mjs`

The new suite exercises a user-recorded inspection event, direct selection of a check, link export with requirement definition snapshots, staleness on Pixhawk variant change, and the disabled link action when no evidence exists.

The v2.4 paired CAD form now starts with **empty** source-native mounting centers and hole spacings. No fictitious `0,0,0` motor mount or nominal `16 mm` pattern is prefilled; users must enter independently inspected values. The source-matching, hash, preview and all-false qualification safety contracts are unchanged.

## Outstanding physical engineering

Only synthesized software fixtures have been exercised here. Official manufacturer STEP source files have not been retrieved into this development environment. Before making physical assertions, the next work must include genuine frame/motor source acquisition with permitted-use review, source hash/revision logs, independently checked length-units and frame/motor mounting datums, and geometry-level interference/clearance analysis by qualified reviewers. The current AABB broad-phase is an **inspection cue only**.

**Keep this PR in draft until the expanded GitHub CI suites pass and manual visual/accessibility review is complete.**
