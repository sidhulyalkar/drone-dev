/** Optional v3.2 interactive planar CAD research study.
 * Never constructs a mechanical mating proposal. Visualizes source-native
 * projection and a *hypothetical* circular probe, not a fastener or clearance.
 */
import {solveX500NominalPlanarFit} from './core/x500_nominal_planar_fit_v32.mjs';
const SVG_NS='http://www.w3.org/2000/svg';
const el=(tag,text='')=>{const e=document.createElement(tag);e.textContent=text;return e;};
const svg=(tag,attributes={})=>{
 const e=document.createElementNS(SVG_NS,tag);
 for(const [key,value] of Object.entries(attributes))e.setAttribute(key,String(value));
 return e;
};
export function createX500NominalFitPanel(){
 const panel=el('details');panel.id='cad-v32-planar-fit';panel.hidden=true;
 const heading=el('summary','Inspect 16 mathematical motor-to-frame obround alignments (2D only)');
 const text=el('p','Compare the original four motor passage centers against four radial obround slots at each frame corner. All coordinates are projected from source BREP, NOT an assembled 3D mating pose.');
 const row=el('div');row.className='cad-v32-controls';
 const selectLabel=el('label','Candidate location and projected yaw ');
 const choices=el('select');choices.id='cad-v32-pose-choice';selectLabel.append(choices);
 const gaugeLabel=el('label','Hypothetical circular gauge diameter (NOT a bolt size) ');
 const gauge=el('input');gauge.type='range';gauge.id='cad-v32-probe-diameter';
 gauge.min='0';gauge.max='5.8';gauge.step='0.1';gauge.value='2.5';
 const value=el('output','2.5 mm');value.htmlFor=gauge.id;
 gaugeLabel.append(gauge,value);
 row.append(selectLabel,gaugeLabel);
 const statement=el('p','No source review loaded.');
 statement.id='cad-v32-nominal-summary';
 const diagram=svg('svg',{viewBox:'0 0 460 420',role:'img',
  'aria-label':'Unverified 2D source-plane obround and motor circle geometry, not a mechanical assembly'});
 diagram.id='cad-v32-planar-diagram';
 const legend=el('small','Blue outlines: BREP obround source contours. Coral circles: hypothetical 2D gauge at original motor passage centers. Dotted lines: projected center offsets. No actual fastener or contact plane is represented.');
 const warning=el('small','The source-normal axis is unresolved. Even a nonnegative nominal gauge margin does NOT prove fastener size, manufacturing tolerance, physical clearance, bolt engagement or source solid interference.');
 const exportBtn=el('button','Export unqualified planar hypotheses JSON');exportBtn.type='button';
 exportBtn.id='cad-v32-export';exportBtn.disabled=true;
 panel.append(heading,text,row,statement,diagram,legend,warning,exportBtn);
 let evidence=null,solution=null;
 function clearDiagram(){diagram.replaceChildren();}
 function reset(){
  evidence=null;solution=null;panel.hidden=true;choices.replaceChildren();
  statement.textContent='No exact-source v3.1 contour review loaded.';
  clearDiagram();exportBtn.disabled=true;
 }
 function render(){
  if(!solution)return;
  const chosen=solution.candidates.find(c=>c.id===choices.value)||solution.candidates[0];
  if(!chosen)return;
  const slack=chosen.minHypotheticalProbeContourMarginMm;
  statement.textContent=chosen.framePatternId+' | projected yaw '+
   chosen.motorToFrameProjectedYawDeg.toFixed(3)+'° | worst center-to-slot-spine mismatch '+
   chosen.worstCenterlineResidualMm.toFixed(4)+' mm | nominal '+solution.probeDiameterMm.toFixed(1)+
   ' mm gauge margin '+slack.toFixed(3)+' mm. Axial mounting position UNKNOWN. PHYSICAL FIT NOT APPROVED.';
  clearDiagram();
  const scale=12,origin=[230,210];
  const mapped=p=>[origin[0]+p[0]*scale,origin[1]-p[1]*scale];
  const center=chosen.frameSourcePatternCenterMm;
  const grid=svg('g',{'aria-hidden':'true',stroke:'#6b8292','stroke-width':'.7',opacity:'.4'});
  for(let n=-15;n<=15;n+=5){
   const x=origin[0]+n*scale,y=origin[1]-n*scale;
   grid.append(svg('line',{x1:x,y1:28,x2:x,y2:392}));
   grid.append(svg('line',{x1:48,y1:y,x2:412,y2:y}));
  }
  diagram.append(grid);
  const axes=svg('g',{stroke:'#899ba9','stroke-width':'1.5'});
  axes.append(svg('line',{x1:origin[0]-150,y1:origin[1],x2:origin[0]+150,y2:origin[1]}));
  axes.append(svg('line',{x1:origin[0],y1:origin[1]-150,x2:origin[0],y2:origin[1]+150}));
  diagram.append(axes);
  for(const match of chosen.fourIndividualSlotMatches){
   const relative=[match.slotCenterNativeMm[0]-center[0],match.slotCenterNativeMm[1]-center[1]];
   const unit=Math.hypot(...relative);
   const angle=Math.atan2(-relative[1],relative[0])*180/Math.PI;
   const [sx,sy]=mapped(relative);
   const rect=svg('rect',{x:-3.65*scale,y:-2.9*scale,width:7.3*scale,height:5.8*scale,
    rx:2.9*scale,fill:'#53a7ce26',stroke:'#53b8e1','stroke-width':2,
    transform:'translate('+sx+' '+sy+') rotate('+angle+')'});
   const [mx,my]=mapped([
    match.motorProjectedNativeFrameMm[0]-center[0],
    match.motorProjectedNativeFrameMm[1]-center[1]
   ]);
   const connector=svg('line',{x1:sx,y1:sy,x2:mx,y2:my,stroke:'#94a3b8',
    'stroke-dasharray':'4 4','stroke-width':2});
   const circle=svg('circle',{cx:mx,cy:my,r:Math.max(1.8,solution.probeDiameterMm/2*scale),
    fill:'#f28b7938',stroke:'#f28b79','stroke-width':2});
   const dot=svg('circle',{cx:mx,cy:my,r:2.2,fill:'#f8c4b9'});
   diagram.append(rect,connector,circle,dot);
  }
  diagram.append(svg('text',{x:16,y:24,fill:'#a9cbd5','font-size':12})).textContent=
   'Frame native X →  |  Z ↑  |  mm';
  diagram.append(svg('text',{x:16,y:407,fill:'#c2d3d9','font-size':12})).textContent=
   'SOURCE-NATIVE 2D STUDY • NO VERIFIED MOUNT';
 }
 function solve(){
  if(!evidence)return;
  const previous=choices.value;
  solution=solveX500NominalPlanarFit(evidence,{probeDiameterMm:Number(gauge.value)});
  choices.replaceChildren();
  for(const c of solution.candidates){
   const option=el('option',c.framePatternId+'  ·  yaw '+c.motorToFrameProjectedYawDeg.toFixed(2)+'°');
   option.value=c.id;choices.append(option);
  }
  if(solution.candidates.some(c=>c.id===previous))choices.value=previous;
  value.textContent=solution.probeDiameterMm.toFixed(1)+' mm (simulation only)';
  exportBtn.disabled=false;render();
 }
 function setEvidence(review){
  // Synchronous fail-closed acceptance of the already verified contour report.
  solveX500NominalPlanarFit(review,{probeDiameterMm:Number(gauge.value)});
  evidence=review;panel.hidden=false;solve();
 }
 choices.addEventListener('change',render);
 gauge.addEventListener('input',solve);
 exportBtn.addEventListener('click',()=>{
  if(!solution)return;
  const file=new Blob([JSON.stringify(solution,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(file),a=el('a');
  a.href=url;a.download='aeroforge-x500-unqualified-planar-fit-v32.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 return {panel,setEvidence,reset};
}
