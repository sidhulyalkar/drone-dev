/**
 * v1.1 Dimensional CAD-source audit and XY inspection.
 * Files stay on device; a digest of user-chosen bytes does NOT establish manufacturer authenticity.
 */
import {GEOMETRY_SCHEMA,FRAME,SOURCE_CATALOG,normalizeDimensionalInput,evaluateDimensionalInput,
 px4GeometryHandoff,inspectionPacket,syntheticExample} from './core/dimensional_v11.mjs';
const $=id=>document.getElementById(id);
const root=$('dimensional-v11');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(root){
 let sourceHash=null,mode='USER_MEASURED_UNREVIEWED',evaluation=null;
 const defUrl=SOURCE_CATALOG[0].sourceUrl;
 $('dim-source-url').value=defUrl;
 function notify(message){$('dim-alert').textContent=message;}
 function num(s,label){
  if(typeof s!=='string'||!s.trim()||!Number.isFinite(Number(s)))throw Error(label+' needs a finite number');
  return Number(s);
 }
 function csvLine(line,expected){
  const fields=line.split(',').map(x=>x.trim());
  if(fields.length!==expected)throw Error('Expected '+expected+' comma-separated fields, got '+fields.length+': '+line.slice(0,100));
  return fields;
 }
 function readRotors(txt){
  if(!txt.trim())throw Error('Enter actual rotor centers or load the SYNTHETIC example');
  const rows=txt.trim().split(/\r?\n/).filter(x=>x.trim()&&!x.trim().startsWith('#'));
  return rows.map((line,i)=>{const [id,x,y,z,d]=csvLine(line,5);
   return {id,centerMm:[num(x,'rotor X'),num(y,'rotor Y'),num(z,'rotor Z')],propDiameterMm:num(d,'prop diameter')};
  });
 }
 function readParts(txt){
  if(!txt.trim())return[];
  return txt.trim().split(/\r?\n/).filter(x=>x.trim()&&!x.trim().startsWith('#')).map((line,i)=>{
   const [id,label,x,y,z,dx,dy,dz,mass]=csvLine(line,9);
   return {id,label,centerMm:[num(x,'component X'),num(y,'component Y'),num(z,'component Z')],
    dimensionsMm:[num(dx,'component DX'),num(dy,'component DY'),num(dz,'component DZ')],
    massG:mass===''?null:num(mass,'component mass')};
  });
 }
 function encodeRows(d){
  $('dim-rotors').value=d.rotors.map(r=>[r.id,...r.centerMm,r.propDiameterMm].join(', ')).join('\n');
  $('dim-parts').value=d.components.map(c=>[c.id,c.label,...c.centerMm,...c.dimensionsMm,c.massG??''].join(', ')).join('\n');
 }
 function snapshot(){
  return normalizeDimensionalInput({
   schema:GEOMETRY_SCHEMA,mode,frame:FRAME,frameReference:$('dim-datum').value.trim()||null,
   source:{label:$('dim-source-label').value.trim()||'User identified drawing',
    fileName:$('dim-file-name').value.trim()||'NOT_SELECTED',
    sha256:sourceHash,sourceUrl:$('dim-source-url').value.trim()||null},
   minimumGapMm:num($('dim-gap').value,'clearance requirement'),
   rotors:readRotors($('dim-rotors').value),components:readParts($('dim-parts').value),
   notes:$('dim-notes').value
  });
 }
 function renderPlot(e){
  const d=e.design;
  const extent=[];
  for(const r of d.rotors){extent.push(Math.abs(r.centerMm[0])+r.propDiameterMm/2,Math.abs(r.centerMm[1])+r.propDiameterMm/2);}
  for(const c of d.components){extent.push(Math.abs(c.centerMm[0])+c.dimensionsMm[0]/2,Math.abs(c.centerMm[1])+c.dimensionsMm[1]/2);}
  const half=Math.max(150,...extent)*1.17,scale=174/half,cx=245,cy=215;
  const pX=y=>cx+y*scale,pY=x=>cy-x*scale;
  const red=new Set(e.checks.filter(x=>x.status==='CONFLICT').flatMap(x=>x.metrics?.pair||[]));
  const grid=[-2,-1,0,1,2].map(i=>{
   const z=i*half/2;
   return '<path d="M '+pX(z)+' 18 V 413 M 20 '+pY(z)+' H 470" stroke="#36535d" stroke-width=".8"/>';
  }).join('');
  let svg='<svg role="img" aria-label="Measured-input orthographic rotor disk projection in millimetres, not validated CAD" viewBox="0 0 490 440" xmlns="http://www.w3.org/2000/svg">'+
   '<rect width="490" height="440" fill="#101f2a"/>'+grid+
   '<path d="M245 18V413 M20 215H470" stroke="#879f93" stroke-width="1.3"/>'+
   '<text x="246" y="16" fill="#c9e4c7" font-size="10">FORWARD +X</text>'+
   '<text x="376" y="208" fill="#c9e4c7" font-size="10">RIGHT +Y</text>'+
   '<text x="16" y="430" fill="#dfc49d" font-size="10">XY projection · mm · FRD datum, NOT CG</text>';
  for(const c of d.components){
   const w=c.dimensionsMm[1]*scale,h=c.dimensionsMm[0]*scale,x=pX(c.centerMm[1])-w/2,y=pY(c.centerMm[0])-h/2;
   svg+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="3" fill="#85c2cc48" stroke="'+(red.has(c.id)?'#ff9682':'#8ccdd2')+'" stroke-width="2"/>'+
    '<text x="'+(x+w/2)+'" y="'+(y+h/2)+'" text-anchor="middle" fill="#eff9f2" font-size="10">'+esc(c.id)+'</text>';
  }
  for(const r of d.rotors){
   const x=pX(r.centerMm[1]),y=pY(r.centerMm[0]),rad=r.propDiameterMm/2*scale;
   svg+='<circle cx="'+x+'" cy="'+y+'" r="'+rad+'" fill="'+(red.has(r.id)?'#c43f3836':'#c0ea9b17')+
    '" stroke="'+(red.has(r.id)?'#ff9682':'#b6dc9d')+'" stroke-width="2"/>'+
    '<circle cx="'+x+'" cy="'+y+'" r="4" fill="#e5f7d7"/>'+
    '<text x="'+x+'" y="'+(y-9)+'" fill="#eaf6e1" text-anchor="middle" font-size="11">'+esc(r.id)+'</text>';
  }
  svg+='<rect x="12" y="34" width="260" height="24" fill="#3d3025"/>'+
   '<text x="21" y="51" fill="#f0c88c" font-size="10">'+(d.mode==='SYNTHETIC_DEMO'?'SYNTHETIC CLASSROOM GEOMETRY':'USER-ENTERED / NOT CAD VERIFIED')+'</text></svg>';
  $('dim-plot').innerHTML=svg;
 }
 function render(e){
  evaluation=e;
  $('dim-result').textContent=e.status.replaceAll('_',' ');
  $('dim-numbers').textContent=e.counts.conflicts+' projected conflicts · '+e.counts.interferenceCandidates+
   ' AABB overlap candidates · '+e.counts.holds+' holds';
  $('dim-source-status').textContent=e.design.source.sha256?
   'Local file SHA-256 registered · NOT authenticity verified':'No source-file SHA-256 registered';
  $('dim-mass').textContent=e.knownComponentMass.subtotalG+' g known component subtotal · '+
   e.knownComponentMass.measuredCount+'/'+e.knownComponentMass.componentCount+' masses entered · NOT AUW or qualified CG';
  $('dim-checks').innerHTML=e.checks.map(c=>
   '<details class="dim-check"><summary><b class="'+(c.status==='CONFLICT'?'dim-conflict':c.status==='SCREEN_CLEAR'?'dim-plan-clear':'dim-hold')+'">'+esc(c.status)+'</b>'+
   ' '+esc(c.id)+'</summary><p>'+esc(c.detail)+'</p></details>').join('');
  renderPlot(e);
  notify('Screen completed, but source inspection, physical fit, wiring and flight authority remain unresolved.');
 }
 function save(contents,name,type){
  const url=URL.createObjectURL(new Blob([contents],{type})),a=document.createElement('a');
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1800);
 }
 function inspect(){
  try{render(evaluateDimensionalInput(snapshot()));}
  catch(e){evaluation=null;$('dim-result').textContent='INPUT INCOMPLETE';
   $('dim-numbers').textContent=e.message;notify('No geometry evaluation was created: '+e.message);}
 }
 $('dim-inspect').addEventListener('click',inspect);
 $('dim-example').addEventListener('click',()=>{
  const d=syntheticExample();mode='SYNTHETIC_DEMO';sourceHash=null;
  $('dim-source-label').value=d.source.label;$('dim-file-name').value=d.source.fileName;
  $('dim-source-url').value='';$('dim-datum').value=d.frameReference;
  $('dim-gap').value=String(d.minimumGapMm);$('dim-notes').value=d.notes;
  $('dim-file').value='';encodeRows(d);inspect();
  notify('SYNTHETIC example only. This is not downloaded or measured Holybro geometry.');
 });
 $('dim-clear').addEventListener('click',()=>{
  mode='USER_MEASURED_UNREVIEWED';evaluation=null;sourceHash=null;
  for(const id of ['dim-datum','dim-rotors','dim-parts','dim-notes','dim-file-name'])$(id).value='';
  $('dim-file').value='';$('dim-source-label').value='Holybro X500 V2 CAD, not verified';
  $('dim-source-url').value=defUrl;$('dim-gap').value='5';
  $('dim-plot').textContent='Enter actual rotor/part geometry, then inspect. Nothing is prefilled with guessed manufacturer coordinates.';
  $('dim-result').textContent='MEASUREMENTS NEEDED';$('dim-numbers').textContent='No geometry screened';
  $('dim-source-status').textContent='No file source registered';$('dim-mass').textContent='No component masses measured';
  $('dim-checks').replaceChildren();notify('Blank measurement project. Exact coordinates and the assembly datum are required.');
 });
 $('dim-file').addEventListener('change',async e=>{
  const f=e.target.files?.[0];
  if(!f)return;
  // Large CAD may exceed browser memory. No upload or parsing is attempted.
  if(f.size>90*1024*1024){notify('File exceeds 90 MiB hash limit; use the local CLI to hash it.');return;}
  if(!globalThis.crypto?.subtle){notify('Secure-context Web Crypto unavailable; use shasum -a 256 locally.');return;}
  try{
   $('dim-source-status').textContent='Computing SHA-256 locally…';
   const digest=await crypto.subtle.digest('SHA-256',await f.arrayBuffer());
   sourceHash=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
   $('dim-file-name').value=f.name;
   $('dim-source-status').textContent='Local SHA-256: '+sourceHash+' · FILE CONTENT NOT PARSED';
   notify('File hashed locally. Bytes were NOT imported into CAD. Authenticity and coordinate transforms remain unverified.');
  }catch(error){sourceHash=null;notify('Could not hash source file: '+error.message);}
 });
 $('dim-import').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  if(f.size>256*1024){notify('Measurement JSON too large (>256 KiB).');return;}
  try{
   const d=normalizeDimensionalInput(JSON.parse(await f.text()));
   mode=d.mode;sourceHash=d.source.sha256;
   $('dim-source-label').value=d.source.label;$('dim-file-name').value=d.source.fileName;
   $('dim-source-url').value=d.source.sourceUrl||'';$('dim-datum').value=d.frameReference||'';
   $('dim-gap').value=String(d.minimumGapMm);$('dim-notes').value=d.notes;
   encodeRows(d);inspect();
   notify('Imported user measurement JSON; existing SHA digest remains a CLAIM until file bytes are independently matched.');
  }catch(error){notify('Import rejected: '+error.message);}
 });
 $('dim-export').addEventListener('click',()=>{
  if(!evaluation)return notify('Run the dimensional inspection before exporting.');
  save(JSON.stringify(evaluation,null,2)+'\n','aeroforge-dimensional-inspection-v11.json','application/json');
 });
 $('dim-px4').addEventListener('click',()=>{
  if(!evaluation)return notify('Run inspection before exporting.');
  save(JSON.stringify(px4GeometryHandoff(evaluation),null,2)+'\n','aeroforge-px4-geometry-blocked-v11.json','application/json');
 });
 $('dim-report').addEventListener('click',()=>{
  if(!evaluation)return notify('Run inspection before exporting.');
  save(inspectionPacket(evaluation),'aeroforge-dimensional-report-v11.md','text/markdown');
 });
 notify('No source CAD imported. Enter real manufacturer-derived dimensions or select the explicitly synthetic demo.');
}
