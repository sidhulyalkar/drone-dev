# AeroForge v2.7 | Genuine X500 source-file intake

## Current source discovery and boundary

Holybro publicly lists two actual source CAD downloads on its [official X500 V2 download page](https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download):

| Source part | Advertised original filename | Approximate published size |
| --- | --- | --- |
| X500 V2 frame | `x500v2-frame.step` | 23 MB |
| AIR2216II motor | `AIR2216II_Motor_3D.STEP` | 772 KB |

The official Holybro store lists both 16×16 and 19×19 mm motor mounting patterns for the X500 V2 product family. Which pattern applies to an actual model revision or received motor/frame must still be established by direct geometry inspection and independent physical measurement.

**These bytes have NOT been retrieved or parsed inside the development environment.** This release creates a local pipeline for ingesting the genuine files when downloaded; no actual vendor-specific SHA-256 values, verified source revisions, solid counts, motor-mount centers or fit judgments are currently claimed. External publication of a file does not necessarily grant permission to redistribute that file or derived meshes.

## Exact local workflow

1. Visit the official Holybro download page above and download the two exact STEP source files. Store them **outside Git**, e.g. `~/Downloads/Holybro-X500-originals/`, preserving their original names. Do not download a third-party replacement if a vendor file cannot be retrieved.
2. Inspect the download history/source and save the official URL and any dated vendor revision or licensing notice. If the source revision is not published, explicitly declare `vendor revision NOT stated in downloaded source`, not a fabricated revision number.
3. Install the project-local CAD environment (do not install CadQuery globally):

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-cad.txt
.venv/bin/python -m pip install cadquery
```

4. Record SHA-256 for the **actual original bytes**:

```bash
FRAME="$HOME/Downloads/Holybro-X500-originals/x500v2-frame.step"
MOTOR="$HOME/Downloads/Holybro-X500-originals/AIR2216II_Motor_3D.STEP"
FRAME_SHA=$(shasum -a 256 "$FRAME" | awk '{print $1}')
MOTOR_SHA=$(shasum -a 256 "$MOTOR" | awk '{print $1}')
printf 'FRAME %s\\nMOTOR %s\\n' "$FRAME_SHA" "$MOTOR_SHA"
```

5. Define explicitly self-reported source identifiers and note current redistribution uncertainty:

```bash
ARGS=(
  --frame "$FRAME"
  --motor "$MOTOR"
  --frame-sha256 "$FRAME_SHA"
  --motor-sha256 "$MOTOR_SHA"
  --frame-revision "vendor revision NOT stated in downloaded source"
  --motor-revision "vendor revision NOT stated in downloaded source"
  --license-note "Public CAD download observed; permission to redistribute original or derivative meshes has not been confirmed."
)
.venv/bin/python tools/x500_source_intake_v27.py "${ARGS[@]}" --preflight-only
```

The preflight requires two distinct expected file fingerprints, original filenames, recognizable ISO-10303-21 header/DATA/termination markers, a separate source identifier and a substantive licensing note. It rejects altered bytes, bad downloads, HTML, ZIP and truncated files. **Syntactic STEP recognition does not parse real geometry or authenticate Holybro.** The digest you calculate yourself identifies only your local acquisition; check independently published fingerprints if Holybro supplies them in the future.

6. Only once the preflight passes, generate both local visual assets in one protected transaction:

```bash
.venv/bin/python tools/x500_source_intake_v27.py "${ARGS[@]}" \\
  --out-dir ".cad-local/x500-v2-first-intake"
```

This runs the existing CadQuery STEP tessellation for *each* original file, validates both source/GLB manifests and writes the following **only if both conversions succeed**:

```text
.cad-local/x500-v2-first-intake/
  x500v2-frame.glb
  x500v2-frame.visual-package.json
  AIR2216II_Motor_3D.glb
  AIR2216II_Motor_3D.visual-package.json
  x500-paired-source-intake.v27.json
```

The input STEP files are **never copied into this generated output folder**. Do not use the same output directory for a new revision: the intake refuses to overwrite an existing destination. Git ignores both original STEP patterns and `.cad-local/`.

7. Run `npm run serve`. Open **Engineering → Local manufacturer CAD → Frame ↔ motor CAD registration study**. Select the matching **manifest + GLB + original STEP** for each part. Optionally attach `x500-paired-source-intake.v27.json`, then click **Verify two source packages**. AeroForge rechecks both STEP and GLB byte digests, manifest identities and (if supplied) the pipeline receipt, before exposing the annotated 3D assembly hypothesis.

## Verification levels

| Level | What the pipeline can claim | What it cannot claim |
| --- | --- | --- |
| Source discovered | Official Holybro documentation advertises these names | Source revision, copyright redistribution grant |
| Preflight completed | These exact local files match recorded SHA-256 and recognizable STEP envelopes | Genuine manufacturer origin, units, CAD solids |
| Conversion completed | CadQuery parsed both files and made two hash-bound GLBs/manifests | Measured holes, correct part identity, coordinate registration |
| Local browser comparison completed | Both original STEP/GLB fingerprints agree with the paired receipt | Vendor signature, manufacturing fit, polarity or bench-power safety |
| CAD research proposal | User-proposed mating transform and display-only geometry | Physical assembly approval, CG, rotor mapping or flight approval |

The browser's evidence checklist and v2.6 viewer retain all physical holds. A successful source intake remains `readyForMechanicalManufacture: false`, `procurementApproved: false`, `powerApproved: false`, and `flightApproved: false`.

## Next physical evidence milestone

Inspect the actual frame STEP solid hierarchy, full 3D bounds, source-native axis conventions and specific mounting pad geometry. Separately inspect the motor STEP shaft/base, fastener pattern and mounting surface. Record independently calibrated reference dimensions for at least one geometric datum before promoting any source-native coordinates to a trusted aircraft frame. Do not infer part authenticity or factory revision from the filename alone.
