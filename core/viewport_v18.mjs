/** AeroForge v1.8: presentation-only unified Build viewport modes. */
export const VIEW_MODES=Object.freeze(['aircraft','exploded','cad']);
export const VIEW_AUTHORITY='VISUALIZATION_ONLY_NOT_MECHANICAL_APPROVAL';
const DIGEST=/^[a-f0-9]{64}$/;
export function isCadPreviewLinked(preview){
 return !!(preview?.schema==='aeroforge/cad-preview-evidence/v1.3'&&
  preview.glbHashMatchesManifest===true&&
  DIGEST.test(preview.manifest?.mesh?.sha256||'')&&
  typeof preview.manifest?.source?.fileName==='string'&&
  preview.manifest?.conversion?.coordinateFrame==='CAD_NATIVE_UNREGISTERED');
}
export function transitionViewMode(mode,options={}){
 if(!VIEW_MODES.includes(mode))throw Error('Unknown 3D viewing mode');
 if(mode==='cad'&&!options.hasCad)throw Error('Load and verify a local CAD package first');
 return {mode,sourceAuthority:mode==='cad'?
  'LOCAL_HASH_CHECKED_CAD_UNREGISTERED':'PROCEDURAL_ILLUSTRATION',
  fitQualified:false,flightQualified:false};
}
export function viewportNotice(mode,source){
 if(mode==='cad')return 'Local CAD preview · '+(source?.fileName||'unregistered solids')+
  ' · SOURCE UNAUTHENTICATED · AXES / FIT UNVERIFIED';
 return 'PROCEDURAL AIRCRAFT · ILLUSTRATIVE ONLY · NOT MANUFACTURER CAD';
}
