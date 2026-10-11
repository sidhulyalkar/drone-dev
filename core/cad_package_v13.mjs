/** Source-fingerprint checking for LOCAL GLB preview, not trusted CAD authentication. */
export const CAD_VISUAL_SCHEMA='aeroforge/cad-visual-package/v1.3';
const reHash=/^[a-f0-9]{64}$/;
const num=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
function assert(cond,message){if(!cond)throw new Error(message);}
function bytesOf(v){
 if(v instanceof ArrayBuffer)return new Uint8Array(v);
 if(ArrayBuffer.isView(v))return new Uint8Array(v.buffer,v.byteOffset,v.byteLength);
 throw new Error('Expected binary CAD bytes');
}
export function validateCadManifest(m){
 assert(m&&typeof m==='object'&&!Array.isArray(m),'Invalid visual package manifest');
 assert(m.schema===CAD_VISUAL_SCHEMA,'Unrecognized CAD package schema');
 const s=m.source,g=m.mesh,c=m.conversion,q=m.qualification;
 assert(s&&g&&c&&q,'Missing CAD evidence fields');
 assert(typeof s.fileName==='string'&&s.fileName.length>0&&s.fileName.length<260,'Source filename missing');
 assert(typeof s.revision==='string'&&s.revision.trim().length>0&&s.revision.length<260,'Source revision missing');
 assert(typeof s.licenseNote==='string'&&s.licenseNote.length>0,'Source licensing note missing');
 assert(typeof s.documentationUrl==='string'&&s.documentationUrl.startsWith('https://'),'Source documentation URL must use HTTPS');
 assert(reHash.test(s.sha256)&&reHash.test(g.sha256),'Source and GLB hashes must be SHA-256 lowercase hexadecimal');
 assert(g.format==='GLB_2'&&g.units==='m','GLB units/format not supported');
 assert(typeof g.fileName==='string'&&/\.glb$/i.test(g.fileName),'GLB filename missing');
 assert(num(s.sizeBytes,1,120*1024*1024)&&num(g.sizeBytes,20,90*1024*1024),'CAD file size outside bounds');
 assert(c.coordinateFrame==='CAD_NATIVE_UNREGISTERED','Only native, unregistered coordinate frames can be previewed');
 assert(c.scaleFromKernelToGLTF===0.001,'Unexpected CAD-to-GLTF scale');
 assert(num(c.solidCount,1,500)&&num(c.triangleCount,1,1200000),'CAD tessellation inventory outside bounds');
 assert(q.manufacturerAuthenticated===false&&q.axesRegisteredToFRD===false&&q.physicalFit===false&&q.rotorCentersMeasured===false&&q.flightReady===false,'Unqualified source falsely claims engineering release');
 assert(m.scope==='VISUAL_GEOMETRY_ONLY_NOT_FIT_TESTED','Missing explicit visualization authority');
 return {
  schema:m.schema,source:{fileName:s.fileName,sha256:s.sha256,revision:s.revision,
   documentationUrl:s.documentationUrl,licenseNote:s.licenseNote,sizeBytes:s.sizeBytes},
  mesh:{fileName:g.fileName,sha256:g.sha256,sizeBytes:g.sizeBytes,format:g.format,units:g.units},
  conversion:{coordinateFrame:c.coordinateFrame,scaleFromKernelToGLTF:c.scaleFromKernelToGLTF,
   solidCount:c.solidCount,triangleCount:c.triangleCount,
   sourceAabbKernelMm:c.sourceAabbKernelMm??null},
  qualification:{...q},scope:m.scope};
}
/** Read the embedded GLB JSON header without constructing a mesh or fetching resources. */
export function inspectGlbHeader(value){
 const u=bytesOf(value);
 assert(u.byteLength>=20&&u.byteLength<=90*1024*1024,'GLB is missing, truncated or too large');
 const dv=new DataView(u.buffer,u.byteOffset,u.byteLength);
 assert(dv.getUint32(0,true)===0x46546c67,'Missing glTF magic');
 assert(dv.getUint32(4,true)===2,'Only GLB version 2 is supported');
 assert(dv.getUint32(8,true)===u.byteLength,'GLB length does not match bytes');
 const length=dv.getUint32(12,true),type=dv.getUint32(16,true);
 assert(type===0x4e4f534a&&length>0&&length<=2*1024*1024,'Invalid/missing GLB JSON chunk');
 assert(20+length<=u.byteLength,'Incomplete GLB JSON chunk');
 let header;try{header=JSON.parse(new TextDecoder().decode(u.subarray(20,20+length)).trim());}
 catch{throw new Error('Malformed embedded GLB JSON');}
 assert(header?.asset?.version==='2.0','Missing glTF 2.0 asset header');
 // The only permitted resources are within the GLB. No network or filesystem fetching.
 for(const kind of ['buffers','images','shaders']){
  for(const ref of header[kind]??[])assert(!('uri' in ref),'External or data-URI '+kind+' resources are not supported');
 }
 assert(Array.isArray(header.buffers)&&header.buffers.length===1,'GLB must contain exactly one embedded buffer');
 assert(num(header.buffers[0].byteLength,1,90*1024*1024),'Embedded binary buffer missing or oversized');
 const binStart=20+length;
 assert(binStart+8<=u.byteLength,'GLB binary chunk missing');
 const binLen=dv.getUint32(binStart,true),binType=dv.getUint32(binStart+4,true);
 assert(binType===0x004e4942&&binLen>=header.buffers[0].byteLength&&binStart+8+binLen===u.byteLength,'Invalid GLB binary chunk');
 assert(Array.isArray(header.accessors)&&Array.isArray(header.bufferViews),'GLB must define embedded accessors and buffer views');
  assert(!header.extensionsRequired?.length,'Required GLTF extensions are not audited for offline safety');
 assert(Array.isArray(header.meshes)&&header.meshes.length>0&&header.meshes.length<=500,'Too many/missing scene meshes');
 assert(Array.isArray(header.nodes)&&header.nodes.length<=4000,'Too many scene nodes');
 let totalFaces=0;
 for(const mesh of header.meshes)for(const prim of mesh.primitives??[]){
  assert(prim.mode==null||prim.mode===4,'Only triangle-list geometry is allowed');
  assert(Number.isInteger(prim.attributes?.POSITION)&&header.accessors[prim.attributes.POSITION], 'Mesh POSITION accessor missing');
  totalFaces++;
 }
 return {meshCount:header.meshes.length,nodeCount:header.nodes.length,
  primitiveCount:totalFaces,offlineResourcesOnly:true,parsedFromLocalGlb:true};
}
export async function sha256Bytes(raw){
 const u=bytesOf(raw);
 assert(u.byteLength<=120*1024*1024,'File too large to digest in browser');
 if(!globalThis.crypto?.subtle)throw new Error('Web Crypto not available in this browser context');
 const result=await globalThis.crypto.subtle.digest('SHA-256',u);
 return [...new Uint8Array(result)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export async function verifyCadPackage(rawManifest,rawGlb,rawStep=null){
 const m=validateCadManifest(rawManifest);
 const glb=bytesOf(rawGlb);
 assert(glb.byteLength===m.mesh.sizeBytes,'GLB byte size does not match manifest');
 const header=inspectGlbHeader(glb);
 const glbSha=await sha256Bytes(glb);
 assert(glbSha===m.mesh.sha256,'GLB SHA-256 mismatch; preview refused');
 const sourceInfo=rawStep==null?null:bytesOf(rawStep);
 if(sourceInfo!==null){
  assert(sourceInfo.byteLength===m.source.sizeBytes,'STEP byte size does not match manifest');
  const digest=await sha256Bytes(sourceInfo);
  assert(digest===m.source.sha256,'STEP SHA-256 mismatch; source identity refused');
 }
 return {schema:'aeroforge/cad-preview-evidence/v1.3',manifest:m,glbHeader:header,
  glbHashMatchesManifest:true,localStepHashMatchesManifest:sourceInfo!==null,
  sourceAuthenticated:false,manufacturerCadRegisteredToAircraft:false,physicalFit:false,
  powerApproval:false,flightApproval:false,
  mode:sourceInfo?'LOCAL_BYTES_MATCH_MANIFEST_ORIGIN_UNAUTHENTICATED':'VISUAL_GLB_ONLY_SOURCE_UNCHECKED',
  notice:'Local binary identity only. Neither STEP SHA-256 nor GLB mesh provenance authenticates manufacturer origin, axes or real-world fit.'};
}
