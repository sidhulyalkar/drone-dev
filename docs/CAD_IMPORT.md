# CadQuery STEP -> GLB import (optional)

The browser cannot directly parse proprietary STEP/B-REP files. The AeroForge v0.3 Reference Lab accepts *visual* GLB files; it reports raw bounding-box dimensions in GLB model units and does not certify geometry or motor positions.

The original Source Two v0.1 STEP exists in the independent GPL-3.0 repository <https://github.com/ps915/source_two>. Obtain the exact file **from upstream** and preserve the original source/license. Do not confuse this with the separate Source One or Source V models.

Install optional conversion dependencies in your own environment:

```sh
python -m pip install cadquery trimesh numpy
python tools/step_to_glb.py \
  '/path/to/Source Two v0.1.step' \
  '/path/to/source-two-v0.1.glb' \
  --revision 'TBS Source Two v0.1' \
  --url 'https://github.com/ps915/source_two'
```

This produces a `.glb` in meters and a `.provenance.json` documenting source SHA-256, imported bounds, mesh count, and all unresolved checks. Open the website, browse to the Reference Lab, choose **Open converted 3D CAD (GLB)**, and load your converted file. AeroForge does **not** package that third-party geometry.

The converter is tested on a synthetic STEP fixture. Import fidelity of the original upstream Source Two file remains untested because it was not accessible in this environment.

**Limitations:** Tessellation is lossy, upstream assembly positioning and materials might not survive STEP import, and a GLB collision check is insufficient for fit/safety. Use the original B-REP source and verified dimensional drawings for tolerance-sensitive mechanical engineering. The converter does not infer rotors, centers, CAD revisions or dynamic motor/prop motion.
