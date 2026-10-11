/**
 * v1.6 guided CAD surface-pick circle candidate lab.
 * A fitted geometric circle is not an identified motor shaft datum.
 */
import {fitCadCircle,annotateRotorWithCircle} from './core/landmark_v16.mjs';
const $=id=>document.getElementById(id);
if($('cad-feature-v16')){
 let active=false,source=null,points=[],lastFit=null;
 const target=()=>String($('cad-v16-motor').value);
 const say=message=>$('cad-v16-status').textContent=message;
 const setButtons=()=>{
  $('cad-v16-pick').disabled=!source;
  $('cad-v16-add-points').disabled=!source;
  $('cad-v16-fit').disabled=!source||points.length<4;
  $('cad-v16-use').disabled=!lastFit||lastFit.diagnostics.highResidual;
  $('cad-v16-clear').disabled=!points.length&&!lastFit;
 };
 function stop(){
  if(active){active=false;window.dispatchEvent(new CustomEvent('aeroforge:cad-surface-pick-mode',{detail:{enabled:false}}));}
  $('cad-v16-pick').textContent='Begin surface-point picking';
 }
 function reset(message,clearSource=true){
  stop();if(clearSource)source=null;points=[];lastFit=null;
  $('cad-v16-output').textContent='No fitted feature.';
  $('cad-v16-points').replaceChildren();
  setButtons();say(message);
 }
 function render(){
  $('cad-v16-points').textContent=points.length?
   points.map((p,i)=>String(i+1)+'. '+p.pointKernelMm.join(', ')+' mm · mesh '+p.meshIndex).join('\n'):
   'No source-surface picks yet.';
  setButtons();
 }
 window.addEventListener('aeroforge:cad-visual-package-cleared',()=>reset('CAD selection changed. Source-bound surface picks invalidated.'));
 window.addEventListener('aeroforge:cad-surface-pick-cleared',()=>reset('Geometry preview cleared. Source-bound picks invalidated.'));
 window.addEventListener('aeroforge:cad-visual-package-verified',e=>{
  const p=e.detail?.preview;
  reset('New source loaded. Pick visible circular feature points; no motor identity will be inferred.');
  if(p?.localStepHashMatchesManifest===true&&p.manifest?.source?.fileName?.toLowerCase()==='x500v2-frame.step'){
   source={stepSha256:p.manifest.source.sha256,glbSha256:p.manifest.mesh.sha256,
    revision:p.manifest.source.revision};
   say('Source bytes match local manifest. Select a motor label and capture 4+ points on ONE visible circular feature.');
  }else say('Original matching X500 V2 STEP bytes are required for feature capture.');
  setButtons();
 });
 window.addEventListener('aeroforge:cad-surface-pick-unavailable',()=>{
  stop();say('3D surface picking unavailable until a verified local GLB is rendered with matching original STEP bytes.');
 });
 $('cad-v16-motor').addEventListener('change',()=>reset('Motor target changed; the previous geometric fit was discarded.',false));
 $('cad-v16-pick').addEventListener('click',()=>{
  if(!source)return;
  active=!active;
  window.dispatchEvent(new CustomEvent('aeroforge:cad-surface-pick-mode',{detail:{enabled:active}}));
  $('cad-v16-pick').textContent=active?'Stop picking':'Begin surface-point picking';
  say(active?'Click at least four locations around the same round feature. Each click records a surface point, NOT its center.':
   'Picking paused. Calculate a candidate circle from the selected surface points.');
 });
 window.addEventListener('aeroforge:cad-surface-point-picked',e=>{
  if(!active||!source)return;
  const p=e.detail?.point,s=e.detail?.source;
  if(!p||s?.stepSha256!==source.stepSha256||s?.glbSha256!==source.glbSha256||s?.revision!==source.revision){
   reset('CAD source identity changed; picks discarded.');return;
  }
  if(points.length>=64){stop();say('Maximum of 64 picked points. Clear or fit the existing set.');return;}
  points.push(p);lastFit=null;
  $('cad-v16-output').textContent='Unfitted raw surface observations · no motor center';
  render();say(points.length+' visual surface points collected for '+target()+'.');
 });
 $('cad-v16-add-points').addEventListener('click',()=>{
  if(!source)return;
  try{
   const raw=$('cad-v16-point-input').value;
   const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));
   if(lines.length<4||lines.length>64)throw Error('Enter 4..64 surface points, one CSV row per location');
   const parsed=lines.map((line,i)=>{
    const columns=line.split(',').map(x=>x.trim());
    if(columns.length!==5||columns.slice(0,4).some(x=>!x||!Number.isFinite(Number(x))))
     throw Error('Row '+(i+1)+' must contain X,Y,Z,meshIndex,meshName');
    if(!Number.isInteger(Number(columns[3])))throw Error('Mesh index must be an integer');
    return {pointKernelMm:columns.slice(0,3).map(Number),meshIndex:Number(columns[3]),
     meshName:columns[4],origin:'USER_TYPED_SURFACE_COORDINATES_NOT_VERIFIED'};
   });
   // Run the strict numerical model before replacing the current picks.
   fitCadCircle(parsed,source);
   stop();points=parsed;lastFit=null;render();
   $('cad-v16-output').textContent='User-typed CAD surface points · not raycast-confirmed · fit required';
   say('Entered point set recorded as an unverified coordinate claim. Inspect its circle numerically, then check the feature independently.');
  }catch(e){say('Surface-point import rejected: '+e.message);}
 });
  $('cad-v16-fit').addEventListener('click',()=>{
  try{
   lastFit=fitCadCircle(points,source);
   const d=lastFit.diagnostics;
   $('cad-v16-output').textContent='Circular-feature center candidate '+lastFit.centerKernelMm.join(', ')+
    ' mm · feature radius '+lastFit.radiusKernelMm+' mm · radial RMS '+d.radialRmsMm+
    ' mm · plane RMS '+d.planarRmsMm+' mm · '+d.status;
   say(d.highResidual?'Large residuals: repick a consistent circular feature. No center transfer allowed.':
    'Numerically plausible circle. It may NOT be a motor shaft center. Independently confirm feature identity.');
  }catch(err){lastFit=null;$('cad-v16-output').textContent='No valid circle fit';say('Fit rejected: '+err.message);}
  setButtons();
 });
 $('cad-v16-use').addEventListener('click',()=>{
  if(!lastFit||!source)return;
  try{
   const observation=annotateRotorWithCircle({id:target(),propDiameterMm:null},lastFit,source);
   window.dispatchEvent(new CustomEvent('aeroforge:cad-circle-fit-to-rotor',
    {detail:{observation,source,fit:lastFit}}));
   say('Candidate copied into '+target()+' source-CAD coordinates. Confirm actual motor feature and propeller diameter, then explicitly reinspect in Section 18.');
  }catch(err){say('Cannot transfer fit: '+err.message);}
 });
 $('cad-v16-clear').addEventListener('click',()=>reset('Surface observations cleared. Previous fitted feature invalidated.',false));
 setButtons();say('Load the original X500 frame STEP, a matching GLB, and their exact hash manifest first.');
}
