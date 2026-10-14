/**
 * v2.6 render-only dual-source CAD datum inspection.
 * Frame-to-motor placement is a human hypothesis; separation is display-only.
 */
import {CAD_PAIR_SCHEMA} from './cad_mating_v24.mjs';
import {signedAxisMatrix} from './registration_v15.mjs';
const finite=(v)=>typeof v==='number'&&Number.isFinite(v);
const point=(p,label)=>{
 if(!Array.isArray(p)||p.length!==3||p.some(v=>!finite(v)||Math.abs(v)>20000))
  throw Error('Invalid '+label);
 return p;
};
const vec=(m,p)=>m.map(row=>row.reduce((s,x,i)=>s+x*p[i],0));
const rounded=v=>Math.round(v*10000)/10000;
const eq=(a,b)=>Math.abs(a-b)<=0.0002;
export const MAX_CAD_PREVIEW_SEPARATION_MM=100;
/**
 * Transform source-native motor millimetres into frame-native coordinates.
 * The optional preview shift is aligned to an explicit *display-only*,
 * source-native signed motor axis. This never establishes a real shaft axis.
 */
export function deriveCadPairInspectionPose(proposal,separationMm=0){
 if(proposal?.schema!==CAD_PAIR_SCHEMA||proposal.mechanicalFitApproved!==false||
  proposal.independentlyQualified!==false||proposal.flightApproved!==false)
  throw Error('Unqualified two-part CAD proposal required');
 if(!finite(separationMm)||separationMm<0||separationMm>MAX_CAD_PREVIEW_SEPARATION_MM)
  throw Error('CAD preview separation must be between 0 and 100 mm');
 const a=proposal.registration;
 if(!a||!Array.isArray(a.motorToFrameAxisMap))
  throw Error('Missing user-declared motor axes');
 const R=signedAxisMatrix(a.motorToFrameAxisMap);
 if(!Array.isArray(a.axisMatrix)||a.axisMatrix.length!==3||
  R.some((row,i)=>!Array.isArray(a.axisMatrix[i])||
   row.some((x,j)=>a.axisMatrix[i][j]!==x)))
  throw Error('CAD pose axis matrix disagrees with its signed-axis declaration');
 const f=point(a.frameMountKernelMm,'frame mounting datum');
 const m=point(a.motorMountKernelMm,'motor mounting datum');
 const declared=point(a.motorToFrameTranslationMm,'motor-to-frame translation');
 const Rm=vec(R,m);
 const translation=f.map((x,i)=>rounded(x-Rm[i]));
 if(translation.some((x,i)=>!eq(x,declared[i])))
  throw Error('CAD pose translation disagrees with recorded mounting datums');
 const axisToken=a.displaySeparationAxisNative??'+Z';
 if(typeof axisToken!=='string'||!/^[-+][XYZ]$/.test(axisToken))
  throw Error('Invalid motor display-only native separation axis');
 const native=[0,0,0];native['XYZ'.indexOf(axisToken[1])]=axisToken[0]==='+'?1:-1;
 const axis=vec(R,native);
 const shift=axis.map(x=>rounded(x*separationMm));
 const motorTranslation=translation.map((x,i)=>rounded(x+shift[i]));
 const motorDatumPreview=f.map((x,i)=>rounded(x+shift[i]));
 const rotAndTranslation=[...R.map((row,i)=>[...row,motorTranslation[i]/1000]),[0,0,0,1]];
 return {
  frameDatumMm:[...f],motorDatumNativeMm:[...m],
  motorDatumPreviewFrameMm:motorDatumPreview,
  motorToFrameRotation:R,
  motorToFrameTranslationMm:translation,
  previewTranslationMm:motorTranslation,
  motorNativePositiveZInFrame:axisToken==='+Z'?axis:null,
  motorDisplaySeparationAxisNative:axisToken,
  motorSelectedDisplayAxisInFrame:axis,
  displaySeparationMm:separationMm,
  previewOnly:true,registrationChanged:false,
  mechanicalFitApproved:false,flightApproved:false,
  matrix4RowMajor:rotAndTranslation.flat(),
  warning:'Preview spacing follows user-selected motor-native '+axisToken+'. This display-only axis does not establish shaft orientation, physical installation or clearance.'
 };
}
