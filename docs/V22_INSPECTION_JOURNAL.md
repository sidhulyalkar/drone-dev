# AeroForge v2.2 · Inspection Journal and Evidence Invalidation

## Goal

Turn the published X500 V2 reference parts in the v2.1 interface graph into a reproducible **user-recorded inspection workflow** without suggesting that an undocumented connection or physical aircraft has been qualified.

## What is actually recorded

Inside **Engineering → X500 Hardware → Physical evidence journal**, users can record observations against a specific manufacturer-reference part ID. Four evidence types are supported:

1. `received_identity`: visually observed label, claimed received revision, observer, date and notes.
2. `dimensional_measurement`: named feature, finite positive value in mm and instrument description; the app does **not** certify tool calibration or datum selection.
3. `connector_observation`: observed connector family, keying/gender description and method; it does not infer polarity, pinout or valid mating.
4. `cad_mating_hypothesis`: the source CAD SHA-256, explicitly described datum and proposed mating method; it never establishes actual registered motor axes or verified mechanical fit.

An optional local evidence file can be SHA-256 hashed within the browser if it is at most 15 MB. Only its filename, length and hash are saved in the journal. **The file bytes are not uploaded, embedded in exports or stored locally by this feature.** Hashing distinguishes bytes, not proof of the manufacturer's identity or their provenance.

## Data integrity and journal semantics

`core/inspection_journal_v22.mjs` defines `aeroforge/inspection-journal/v2.2` and a deterministic append-only event sequence with IDs `evt-0001`, `evt-0002`, etc. Each event includes a noncryptographic FNV-style checksum to detect accidental edits. **The checksum is neither a cryptographic signature nor an independently trusted chain of custody**; someone who can edit the file can also regenerate it.

The journal records the actual X500 kit `revisionIdentity`, controller variant and battery series. A change to any of them causes previous observations to display as `STALE CONFIGURATION`, but it preserves the full event history. New evidence may be recorded for the updated aircraft context. An earlier observation can be independently *reviewed on record* by a different named reviewer only while the originating aircraft selection is current. Such a review includes a date and substantive notes; it does not verify the identity of the reporter or independently certify the physical result.

Pure functions:

- `startInspectionJournal(record)`
- `appendInspectionObservation(journal,record,payload)`
- `appendInspectionReview(journal,review)`
- `reconcileInspectionJournal(journal,newRecord)`
- `validateInspectionJournal(journal)` via deterministic replay, ID order, checksums and schema guards
- `inspectionSummary(journal,record)`
- `attachInspectionEvidenceSummary(record,journal)`
- `researchInspectionPacket(journal,record)`

All summaries and exports retain false `procurementApproved`, `powerApproved`, `flightApproved`. The published interface graph remains the authority for *family-level documentation only*. A user-supplied measurement or review does not rewrite that graph's verification state.

## Privacy, persistence, and portability

The journal starts in the current browser tab. Use **Export journal** to download a JSON research packet with notes, observers, reported identities, record dates and file hashes. The JSON contains personal information if entered, so store it appropriately.

**Save on this device** is explicit, optional `localStorage`. **Restore device copy** validates the stored journal against the schema and current X500 context; observations for outdated aircraft revisions remain stale. **Delete device copy** clears only the browser-storage copy. Local downloaded exports are not deleted and source file bytes are never persisted by the journal UI.

Importing a journal replaces the current in-tab working session after schema and checksum checks. Invalid or malformed imports are rejected without replacing the active session. Imported self-reported receipts are still not trusted independent evidence.

## User interface

The journal is a single collapsed secondary section under **Engineering → X500 Hardware**, with short, visible configuration summary and three disclosures: add observation, record review, view audit history. It is intentionally absent from the beginner Explore flow.

The canonical X500 record export now includes an `inspectionSummary` whenever an active journal exists, and the X500 identity label displays current/stale counts. This does not modify the selected family part IDs, promote the kit to physical compatibility, or grant bench-power authority.

## Tested behaviors

- Initial documentation-only status and false qualification flags.
- Four observation kinds, strict numeric limits, real ISO dates and optional digest receipt.
- Review requires a different named observer, date not before observation, and one review per observation.
- Revision and battery-series change retains historical records but invalidates their current applicability.
- Import validation rejects corrupted event checksums, IDs, malformed payloads, and unsupported schemas.
- Canonical X500 export retains unapproved sourcing/flight status.
- Chromium flows: capture, review, export, stale configuration, opt-in device save/restore/delete, malformed import rejection.

## Why this does not make the aircraft qualified

To proceed beyond documentation and self-reported inspection, an appropriately qualified reviewer must establish independent tool calibration, actual received item identity, source-revision traceability, mechanically registered motor/frame CAD, connector-level verified electrical diagrams, current and thermal limits, verified controls, and flight-specific safety and regulatory requirements. No such qualification is automatically inferred by AeroForge v2.2.

## Next work

1. Controlled source artifact attachments with strict privacy controls and optional reproducible CAD measurement receipts.
2. An explicit per-interface evidence matrix where observations address specific required checks rather than merely attaching to a whole component.
3. A reviewer workflow with review evidence pointers, differences, calibrated instruments, and invalidation on part changes.
4. Actual X500 V2 STEP + motor mesh ingestion and independent mechanical datum review before any automated fit or purchasing qualification.