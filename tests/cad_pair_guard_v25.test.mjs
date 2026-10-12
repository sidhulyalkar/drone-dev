import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compileX500Record} from '../core/x500_record_v14.mjs';
import {scopeX500CadMating,cadMatingAppliesToRecord} from '../core/cad_mating_v24.mjs';
import {verifyCadPairViewerAssets} from '../core/cad_pair_view_guard_v25.mjs';

function tinyGlb(v=1){
 const json=JSON.stringify({asset:{version:'2.0'},
  scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],
  meshes:[{primitives:[{attributes:{POSITION:0},mode:4}]}],
  buffers:[{byteLength:36}],bufferViews:[{buffer:0,byteOffset:0,byteLength:36}],
  accessors:[{bufferView:0,componentType:5126,count:3,type:'VEC3'}]});
 const padded=json+' '.repeat((4-json.length%4)%4);
 const output=Buffer.alloc(12+8+padded.length+8+36);
 output.write('glTF',0);output.writeUInt32LE(2,4);output.writeUInt32LE(output.length,8);
 output.writeUInt32LE(padded.length,12);output.write('JSON',16);output.write(padded,20);
 const at=20+padded.length;
 output.writeUInt32LE(36,at);output.write('BIN\0',at+4);
 [0,0,0,v,0,0,0,v,0].forEach((x,i)=>output.writeFloatLE(x,at+8+i*4));
 return output;
}
const sha=x=>createHash('sha256').update(x).digest('hex');
const a=tinyGlb(1),b=tinyGlb(2);
function baseProposal(){
 return {schema:'aeroforge/x500-cad-mating-proposal/v2.4',
  sourceAuthority:'LOCAL_MATCHING_BYTES_MANUFACTURER_ORIGIN_UNAUTHENTICATED',
  frame:{sourceSha256:'a'.repeat(64),meshSha256:sha(a)},
  motor:{sourceSha256:'b'.repeat(64),meshSha256:sha(b)},
  registration:{provenance:'USER_SELECTED_NOT_INDEPENDENTLY_REGISTERED'},
  independentlyQualified:false,mechanicalFitApproved:false,
  procurementApproved:false,powerApproved:false,flightApproved:false};
}
test('source CAD proposal applies only to matching revision-scoped kit record',()=>{
 const r=compileX500Record({variant:'six_c',batteryCells:4});
 const scoped=scopeX500CadMating(baseProposal(),r);
 assert.equal(cadMatingAppliesToRecord(scoped,r),true);
 assert.equal(cadMatingAppliesToRecord(baseProposal(),r),false);
 assert.equal(cadMatingAppliesToRecord(scoped,compileX500Record({variant:'six_x',batteryCells:4})),false);
 assert.equal(cadMatingAppliesToRecord(scoped,compileX500Record({variant:'six_c',batteryCells:6})),false);
 assert.equal(scoped.flightApproved,false);
});
test('malformed aircraft record or elevated proposal never scopes',()=>{
 const r=compileX500Record();
 assert.throws(()=>scopeX500CadMating(baseProposal(),{...r,revisionIdentity:null}),/revision/);
 const forged={...baseProposal(),flightApproved:true};
 assert.throws(()=>scopeX500CadMating(forged,r),/Unqualified/);
 assert.equal(cadMatingAppliesToRecord(forged,r),false);
});
test('renderer accepts exact local GLB byte identities without claiming qualification',async()=>{
 const p=baseProposal();
 const result=await verifyCadPairViewerAssets(a,b,p);
 assert.equal(result.frameMeshCount,1);
 assert.equal(result.motorMeshCount,1);
 assert.equal(result.manufacturerAuthenticated,false);
 assert.equal(result.mechanicalFitApproved,false);
 assert.equal(result.flightApproved,false);
});
test('renderer rejects swapped, altered or unrelated GLB bytes',async()=>{
 const p=baseProposal();
 await assert.rejects(verifyCadPairViewerAssets(b,a,p),/GLB bytes changed/);
 const changed=Buffer.from(a);changed[changed.length-1]^=1;
 await assert.rejects(verifyCadPairViewerAssets(changed,b,p),/GLB bytes changed/);
 await assert.rejects(verifyCadPairViewerAssets(Buffer.from('bad GLB'),b,p),/GLB/);
});
test('renderer rejects forged or incomplete safety contract',async()=>{
 const p=baseProposal();p.mechanicalFitApproved=true;
 await assert.rejects(verifyCadPairViewerAssets(a,b,p),/Unqualified/);
});
