/** v3.3 source-only face-contact 3D hypothesis inventory.
 * No actions ever modify the 3D mating proposal or report collision clearance.
 */
const make=(tag,label='')=>{const node=document.createElement(tag);node.textContent=label;return node;};
export function createX500ContactSurveyPanel(){
 const panel=make('details');
 panel.id='cad-v33-contact-survey';panel.hidden=true;
 const head=make('summary','Inspect 64 source-derived 3D contact-plane hypotheses (unapproved)');
 const intro=make('p',
  'Two motor candidate planes × two frame plate planes × sixteen source-plane rotations. Only 32 cases have opposing source-face normals; these are not physically qualified seats.');
 const control=make('div');control.className='cad-v33-controls';
 const label=make('label','Candidate 3D source geometry and contact-face pairing ');
 const picker=make('select');picker.id='cad-v33-source-pose';label.append(picker);
 const toggleLabel=make('label','Include same-facing normal alternatives (research only) ');
 const toggle=make('input');toggle.id='cad-v33-show-same-facing';toggle.type='checkbox';
 toggleLabel.append(toggle);
 control.append(label,toggleLabel);
 const status=make('p','No verified source-bound 3D survey selected.');
 status.id='cad-v33-source-status';
 const readout=make('pre');readout.className='cad-v33-source-readout';
 readout.textContent='Original CAD plane observations not yet available.';
 const note=make('small','AABB possible overlaps require exact BREP review. A timed-out or missing Boolean is INDETERMINATE, never “no collision.” The source-native motor seat, bolt engagement, manufacturing tolerances and rotor clearance are not qualified.');
 const download=make('button','Export unqualified 3D pose research JSON');
 download.type='button';download.id='cad-v33-export';download.disabled=true;
 panel.append(head,intro,control,status,readout,note,download);
 let data=null;
 function redraw(){
  const value=picker.value;
  const item=data?.candidates.find(c=>c.id===value);
  if(!item){readout.textContent='Select one source-geometry hypothesis.';return;}
  status.textContent=(item.opposingSourceNormals?'Opposing face normals':'SAME-FACING normals, not a seating hypothesis')+
   ' · '+item.modelAabbPotentialPairs+' AABB-possible solid pairs · exact BREP collision NOT RUN.';
  readout.textContent=[
   'Original frame location: '+item.framePatternId+' | source solid '+item.frameSolidIndex,
   'Motor candidate plane: face '+item.motorPlaneFaceIndex,
   'Frame candidate plate plane: face '+item.framePlaneFaceIndex,
   'Projected native-plane yaw: '+item.nativeYawDeg.toFixed(3)+'°',
   'Right-handed source-native rotation (rows):',
   ...item.rotation3x3.map(row=>'  '+row.map(v=>Number(v).toFixed(6)).join(', ')),
   'Source-native translation (mm): '+item.nativeTranslationMm.map(x=>Number(x).toFixed(3)).join(', '),
   'Broadphase AABB potential pairs: '+item.modelAabbPotentialPairs,
   'Exactly checked BREP volume: NOT RUN',
   'Independently identified motor seating face: NO',
   'Approved mechanical / electrical / flight fit: NO / NO / NO'
  ].join('\n');
 }
 function rebuild(){
  if(!data)return;
  const before=picker.value;picker.replaceChildren();
  for(const candidate of data.candidates){
   if(!toggle.checked&&!candidate.opposingSourceNormals)continue;
   const option=make('option',
    candidate.framePatternId+' · yaw '+candidate.nativeYawDeg.toFixed(1)+'° · motor plane '+
    candidate.motorPlaneFaceIndex+' / frame plane '+candidate.framePlaneFaceIndex+
    ' · '+candidate.modelAabbPotentialPairs+' AABB pairs');
   option.value=candidate.id;picker.append(option);
  }
  if(data.candidates.some(x=>x.id===before&&
    (toggle.checked||x.opposingSourceNormals)))picker.value=before;
  redraw();
 }
 function reset(){
  data=null;panel.hidden=true;picker.replaceChildren();download.disabled=true;
  status.textContent='No verified source-bound 3D contact study selected.';
  readout.textContent='Original CAD plane observations not yet available.';
  toggle.checked=false;
 }
 function setEvidence(review){
  if(review?.schema!=='aeroforge/x500-source-contact-browser-review/v3.3'||
   review.authority!=='SOURCE_GEOMETRY_BROADPHASE_ONLY'||
   review.hypothesisCount!==64||review.opposingNormalCount!==32||
   review.physicalFitApproved!==false||review.exactCollisionVerified!==false)
   throw Error('Cannot display an unverified or physically approved 3D source-contact report');
  data=review;panel.hidden=false;toggle.checked=false;
  download.disabled=false;rebuild();
 }
 picker.addEventListener('change',redraw);
 toggle.addEventListener('change',rebuild);
 download.addEventListener('click',()=>{
  if(!data)return;
  const raw=JSON.stringify(data,null,2)+'\n';
  const blob=new Blob([raw],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=make('a');
  link.href=url;link.download='aeroforge-X500-source-contact-UNQUALIFIED-v33.json';
  link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 return {panel,reset,setEvidence};
}
