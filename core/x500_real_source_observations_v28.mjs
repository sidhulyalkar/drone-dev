/** v2.8 local operator observations from two real user-uploaded STEP files.
 * NOT published Holybro checksums, certified OEM revision, CAD registration,
 * independently measured dimensions, distribution permission, or part fit.
 */
export const X500_SOURCE_OBSERVATIONS_V28=Object.freeze({
 frame:Object.freeze({
  fileName:'x500v2-frame.step',
  sha256:'e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360',
  sizeBytes:24624144,
  importedSolidCount:244,
  importedFaceCount:14178,
  sourceKernelAabbMm:{min:[-200.17539,-215.27643,-200.17539],
   max:[200.17539,107,200.17539]},
  headerTimestamp:'2022-07-19T23:53:04-07:00',
  observation:'Two inspected plate solids lie at native Y = 0–2 and Y = 30–32 mm; Y-up is a display hypothesis, not a calibrated aircraft coordinate frame.'
 }),
 motor:Object.freeze({
  fileName:'AIR2216II_Motor_3D.STEP',
  sha256:'ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15',
  sizeBytes:790229,
  importedSolidCount:4,
  importedFaceCount:304,
  sourceKernelAabbMm:{min:[1143.17548,718.23467,-13.85],
   max:[1186.17548,745.93467,13.85]},
  headerTimestamp:'2025-04-17T02:19:22',
  observation:'Native longest motor dimension is along X (43.0 mm); its shaft axis, mounting face and rotation sense are NOT yet independently qualified.'
 })
});
export const X500_REAL_SOURCE_OBSERVATION_AUTHORITY='USER_UPLOADED_CAD_LOCALLY_IMPORTED_NOT_OEM_AUTHENTICATED';
function good(p,role){
 const s=X500_SOURCE_OBSERVATIONS_V28[role],m=p?.manifest;
 return p?.schema==='aeroforge/cad-preview-evidence/v1.3'&&
  p.localStepHashMatchesManifest===true&&p.glbHashMatchesManifest===true&&
  p.sourceAuthenticated===false&&p.physicalFit===false&&
  m?.source?.fileName===s.fileName&&m?.source?.sha256===s.sha256&&
  m?.source?.sizeBytes===s.sizeBytes&&
  m?.qualification?.flightReady===false;
}
/** Hints are displayed only for byte-identical locally verified uploaded sources. */
export function getX500RealSourceObservations(framePreview,motorPreview){
 if(!good(framePreview,'frame')||!good(motorPreview,'motor'))return null;
 return {
  authority:X500_REAL_SOURCE_OBSERVATION_AUTHORITY,
  frame:X500_SOURCE_OBSERVATIONS_V28.frame,
  motor:X500_SOURCE_OBSERVATIONS_V28.motor,
  proposedFrameDisplayUpAxis:'+Y',
  suggestedMotorLongitudinalAxis:'+X',
  frameToMotorMatingQualified:false,
  shaftAxisQualified:false,
  independentMeasurement:false,
  physicalFitApproved:false,
  flightApproved:false,
  warning:'Source AABBs, model counts and timestamps are local observations, not signed OEM properties. The motor is offset >1 m in source-native CAD coordinates, so original geometry must not be silently recentered or treated as mated.'
 };
}
