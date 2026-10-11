import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CAD_VISUAL_SCHEMA,validateCadManifest,inspectGlbHeader,sha256Bytes,verifyCadPackage} from '../core/cad_package_v13.mjs';
function fixture(){
 const json=JSON.stringify({
  asset:{version:'2.0',generator:'v1.3 synthetic unit fixture'},
  scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:'fixture-triangle'}],
  meshes:[{primitives:[{attributes:{POSITION:0},mode:4}]}],
  buffers:[{byteLength:36}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3',
   min:[0,0,0],max:[1,1,0]}]
 });
 const padded=json+' '.repeat((4-json.length%4)%4);
 const buffer=Buffer.alloc(36);
 // 3 triangle points
 const vertices=[0,0,0,1,0,0,0,1,0];
 vertices.forEach((v,i)=>buffer.writeFloatLE(v,i*4));
 const glb=Buffer.alloc(12+8+padded.length+8+36);
 glb.write('glTF',0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);
 glb.writeUInt32LE(padded.length,12);glb.write('JSON',16);glb.write(padded,20);
 const at=20+padded.length;glb.writeUInt32LE(36,at);glb.write('BIN\0',at+4);buffer.copy(glb,at+8);
 const step=Buffer.from('ISO-10303-21;\n/*synthetic test STEP bytes, not CAD*/\nEND-ISO-10303-21;');
 const sha=b=>createHash('sha256').update(b).digest('hex');
 const manifest={
  schema:CAD_VISUAL_SCHEMA,source:{fileName:'fixture.step',sha256:sha(step),
   revision:'TEST_SYNTHETIC_ONLY',sizeBytes:step.length,documentationUrl:'https://example.org/reference',
   licenseNote:'Synthetic unit-test fixture, not manufacturer geometry.',manufacturerIdentityVerified:false},
  mesh:{fileName:'fixture.glb',sha256:sha(glb),sizeBytes:glb.length,format:'GLB_2',units:'m',assetGeometryIsCadDerived:true},
  conversion:{engine:'fixture-only',sourceUnitsDeclared:'mm',scaleFromKernelToGLTF:.001,
   coordinateFrame:'CAD_NATIVE_UNREGISTERED',solidCount:1,triangleCount:1,
   sourceAabbKernelMm:{min:[0,0,0],max:[1,1,0]}},
  scope:'VISUAL_GEOMETRY_ONLY_NOT_FIT_TESTED',
  qualification:{manufacturerAuthenticated:false,axesRegisteredToFRD:false,
   physicalFit:false,rotorCentersMeasured:false,flightReady:false}
 };
 return {manifest,step,glb};
}
test('embedded synthetic GLB header parses without external resources',()=>{
 const f=fixture(),out=inspectGlbHeader(f.glb);
 assert.equal(out.meshCount,1);assert.equal(out.nodeCount,1);assert.equal(out.offlineResourcesOnly,true);
});
test('GLB file digest and original STEP bytes both match the local visual package',async()=>{
 const f=fixture();const r=await verifyCadPackage(f.manifest,f.glb,f.step);
 assert.equal(r.schema,'aeroforge/cad-preview-evidence/v1.3');
 assert.equal(r.mode,'LOCAL_BYTES_MATCH_MANIFEST_ORIGIN_UNAUTHENTICATED');
 assert.equal(r.localStepHashMatchesManifest,true);
 assert.equal(r.sourceAuthenticated,false);
 assert.equal(r.manufacturerCadRegisteredToAircraft,false);
 assert.equal(r.flightApproval,false);
 assert.equal(await sha256Bytes(f.glb),f.manifest.mesh.sha256);
});
test('GLB only is allowed as visualization with unverified source bytes',async()=>{
 const f=fixture();const r=await verifyCadPackage(f.manifest,f.glb);
 assert.equal(r.mode,'VISUAL_GLB_ONLY_SOURCE_UNCHECKED');
 assert.equal(r.localStepHashMatchesManifest,false);
 assert.equal(r.manifest.conversion.coordinateFrame,'CAD_NATIVE_UNREGISTERED');
});
test('one-byte GLB modification fails closed rather than displaying unverified mesh',async()=>{
 const f=fixture(),tampered=Buffer.from(f.glb);tampered[tampered.length-1]^=1;
 await assert.rejects(verifyCadPackage(f.manifest,tampered,f.step),/SHA-256 mismatch/);
});
test('changed source STEP fails local identity even if mesh matches',async()=>{
 const f=fixture(),wrong=Buffer.from(f.step);wrong[20]^=1;
 await assert.rejects(verifyCadPackage(f.manifest,f.glb,wrong),/STEP SHA-256 mismatch/);
});
test('malformed, oversized, truncated, and unexpected GLB headers are blocked',()=>{
 const f=fixture(),b=Buffer.from(f.glb);
 const cases=[
  Buffer.from('not a real GLB'),
  (()=>{const q=Buffer.from(b);q.writeUInt32LE(1,4);return q;})(),
  (()=>{const q=Buffer.from(b);q.writeUInt32LE(15,8);return q;})(),
  (()=>{const q=Buffer.from(b);q.writeUInt32LE(0x12345678,16);return q;})(),
  (()=>{const q=Buffer.from(b);q.writeUInt32LE(0,20+b.readUInt32LE(12)+4);return q;})()
 ];
 for(const x of cases)assert.throws(()=>inspectGlbHeader(x));
});
test('external URI references cannot be used to fetch untrusted files',()=>{
 const f=fixture();
 // Modify the same fixture JSON with an image URI then rebuild its envelope.
 const originalJson=JSON.parse(f.glb.subarray(20,20+f.glb.readUInt32LE(12)).toString().trim());
 originalJson.images=[{uri:'https://untrusted.example/test.png'}];
 const json=JSON.stringify(originalJson);const padded=json+' '.repeat((4-json.length%4)%4);
 const b=Buffer.alloc(12+8+padded.length+8+36);
 b.write('glTF',0);b.writeUInt32LE(2,4);b.writeUInt32LE(b.length,8);
 b.writeUInt32LE(padded.length,12);b.write('JSON',16);b.write(padded,20);
 const at=20+padded.length;b.writeUInt32LE(36,at);b.write('BIN\0',at+4);
 f.glb.subarray(f.glb.length-36).copy(b,at+8);
 assert.throws(()=>inspectGlbHeader(b),/External/);
});
test('self-asserted qualification flags in a manifest cannot bypass guards',()=>{
 const f=fixture();
 for(const k of ['manufacturerAuthenticated','axesRegisteredToFRD','physicalFit','rotorCentersMeasured','flightReady']){
  const p=structuredClone(f.manifest);p.qualification[k]=true;
  assert.throws(()=>validateCadManifest(p),/falsely claims/);
 }
 const m=structuredClone(f.manifest);m.conversion.coordinateFrame='BODY_FRD_VERIFIED';
 assert.throws(()=>validateCadManifest(m),/unregistered coordinate/);
});
test('manifest requires valid source licensing, URL, scale and sha256',()=>{
 const f=fixture();
 const issues=[
  x=>x.source.licenseNote='',
  x=>x.source.documentationUrl='http://bad.test/',
  x=>x.conversion.scaleFromKernelToGLTF=1,
  x=>x.mesh.sha256='bad',
  x=>x.mesh.sizeBytes=91*1024*1024
 ];
 for(const mut of issues){const m=structuredClone(f.manifest);mut(m);assert.throws(()=>validateCadManifest(m));}
});
test('CDN-independent UI contracts have unique elements and guarded file paths',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../cad_package_ui_v13.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const match of ui.matchAll(/el\('([^']+)'\)/g))
  assert.ok(ids.includes(match[1]),'Missing DOM ID '+match[1]);
 assert.match(html,/cad_package_ui_v13\.mjs/);
 assert.match(html,/cad_v13\.css/);
 assert.ok(html.includes('id="cad-package-v13"'));
 assert.match(ui,/verifyCadPackage/);
});
