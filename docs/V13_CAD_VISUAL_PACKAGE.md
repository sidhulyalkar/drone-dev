# AeroForge v1.3: Real CAD Visual Package Vertical Slice

## Delivered

A local, deterministic **source-bytes → CadQuery STEP tessellation → GLB + source-linked manifest → browser visual inspection** pipeline. The original Holybro X500 V2 manufacturer STEP assets were NOT downloaded or registered by the development environment. This release is a working import workflow, not a source-measured or aerodynamically qualified X500 assembly.

Files: `tools/cad_visual_package_v13.py`, `core/cad_package_v13.mjs`, `cad_package_ui_v13.mjs`, `cad_viewer_v13.mjs` and `cad_v13.css`. New source/evidence UI is Section 17. Pure JS tests verify GLB chunk integrity, embedded-only resource requirements, binary hashes, tamper detection and lack of physical release. Python smoke tests verify source byte hashing, reject altered STEP, require revision/URL/license text and reject invalid bounds. The full CadQuery conversion of Holybro source files is not performed in CI.

## Run the actual local source-import workflow

1. Download a STEP CAD file directly from Holybro's [X500 V2 download page](https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download). Confirm the specific revision and use/redistribution terms. The documentation lists `x500v2-frame.step` and `AIR2216II_Motor_3D.STEP`; if the downloaded filenames differ, use those actual names.
2. Install optional CadQuery in an isolated Python environment, not Homebrew/system Python:

```bash
cd ~/Documents/Projects/drone-dev
python3 -m venv .venv   # skip if your project venv already exists
.venv/bin/python -m pip install -r requirements-cad.txt
.venv/bin/python -m pip install cadquery
```

3. Hash the original bytes and convert. Use the **actual document revision/license terms**, not the example placeholders:

```bash
CAD="$HOME/Downloads/x500v2-frame.step"
SHA=$(shasum -a 256 "$CAD" | awk '{print $1}')
.venv/bin/python tools/cad_visual_package_v13.py "$CAD" "$HOME/Downloads/x500-frame.glb" \
  --sha256 "$SHA" \
  --revision "exact-downloaded-source-revision" \
  --url "https://docs.holybro.com/drone-development-kit/px4-development-kit-x500v2/download" \
  --license-note "Document the actual source/license restrictions before sharing derivatives"
```

The converter tessellates each imported solid (bounded to 500 and 1.2 million triangles), scales CadQuery-imported millimetres by 0.001 for glTF metres **without claiming the source unit assumption has been independently checked**, and writes a `.visual-package.json` adjacent to its `.glb`. The exact STEP and GLB SHA-256 hashes, revision, source documentation, licensing note, raw kernel bounding box and failure-to-qualify flags are retained.

4. Run `npm run serve`; open **Section 17: Real CAD viewer**, select `x500-frame.visual-package.json` and matching `x500-frame.glb`, optionally the original source STEP. Click Verify. Only a matching manifest/GLB hash can reach the renderer. Providing STEP allows an additional exact-byte source identity comparison; it still does not authenticate manufacturer origin.

5. Orbit, select and separate individual *CAD mesh solids* visually. Individual solids may not equal mechanically meaningful components. The viewer intentionally labels all solids unregistered and exposes their provenance status. Source assets remain local. The glTF loader only runs after validation rejects GLB external resource URIs and unevaluated required extensions.

## Critical limitations and required next work

- **No manufacturer STEP retrieved/inspected here.** No source-file fingerprints or exact X500 frame/motor coordinates can be published yet.
- **Not an assembly model.** Frame and motor STEP files are separate source artifacts. Their exact mating transforms, mounting datums, motor shaft axes, propeller sizes and component identities remain unresolved. Exploding tessellated solids does not prove mechanical part order, fastener fit or clearance.
- **No source license verification.** A user-provided text note is not a redistribution grant. Do not commit generated manufacturer meshes to public GitHub without verifying license and permission.
- **No mechanical engine release.** The imported visual preview is not yet the same thing as v1.1's measured rotor center/disk geometry. A screen-free model or successful GLB render is not evidence of electrical, physical, CG, simulator, flight or procurement safety.
- **No manufacturer trust anchor.** Hashing the original source file shows that GLB was created from those selected bytes, not whether the bytes were actually published by the manufacturer. Authenticated vendor-source retrieval and independent dimension checks are separate tasks.
- **No generalized CAD collisions yet.** Conservative XY rotor-disk and AABB screens remain in v1.1, but full mesh-vs-mesh intersections and certified placement require independently registered axis transforms and manufacturer-part identities.

## Acceptance criteria and testing

- Conversion must reject a STEP file whose hash does not match the explicit `--sha256` argument **before importing CadQuery**.
- Manifest must include source and GLB digest, file sizes, input scale assumption, origin, revision and license note; no approval/qualification flags can be true.
- Browser must reject tampered GLB, tampered STEP, size mismatch, malformed GLB headers, outside-resource URIs, missing expected GLB asset format, wrong axis contract and unreviewed GLTF extensions.
- Browser may preview a manifest+GLB alone but must mark the STEP source bytes **unchecked**. Passing all binary checks still cannot grant manufacturer authentication, body-FRD registration or physical fit.
- User can inspect the CAD visually using existing Three.js dependency, with a 2D textual evidence fallback if WebGL or Three CDN is unavailable.

## Suggested v1.4 prioritized continuation

Import and inspect actual Holybro STEP with source-specific permission and immutable hash. Map assembly solids to parts and record real transforms/motor centers with independent measured verification. Connect a canonical SKU+revision registry to exact physical dimensions, electrical mating/pinout restrictions, 3D scene selection, Assembly Copilot dependencies and BOM. Introduce Playwright end-to-end CI and visual regression for critical workflows.
