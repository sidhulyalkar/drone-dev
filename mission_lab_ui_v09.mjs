import {SCENARIOS,SCENARIO_BY_ID,MODULES,MODULE_BY_ID,MODULE_CATEGORIES,analyzeMission,compareMissions} from './core/mission_lab_v09.mjs';
const $=id=>document.getElementById(id);
const host=$('mission-v09');
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
if(host){
 let active=SCENARIOS[0].id,additions={},compareWith=SCENARIOS[1].id;
 const available=id=>additions[id]||[];
 const report=()=>analyzeMission(active,available(active));
 function diagram(data){
  const type=data.concept.topology,hex=type==='hex',wing=type==='vtol',guard=type==='guarded-quad';
  const motors=(hex?6:4),points=Array.from({length:motors},(_,i)=>{
   const theta=(i/motors)*Math.PI*2-Math.PI/4;
   return [360+Math.cos(theta)*(hex?144:132),195+Math.sin(theta)*(hex?115:103)];
  });
  const circles=points.map(([x,y],i)=>'<g><path d="M360 195 L'+x.toFixed(1)+' '+y.toFixed(1)+'" stroke="#82959c" stroke-width="9" stroke-linecap="round"/><circle cx="'+x+'" cy="'+y+'" r="'+(guard?49:38)+'" fill="'+(guard?'#1c4c4f':'#24343e')+'" stroke="'+(guard?'#84d5ce':'#addb9c')+'" stroke-width="'+(guard?6:1.8)+'"/><circle cx="'+x+'" cy="'+y+'" r="11" fill="#c4e9a0" stroke="#22352c" stroke-width="4"/><text x="'+x+'" y="'+(y-47)+'" text-anchor="middle" fill="#bad3d0" font-size="10">M'+(i+1)+'</text></g>').join('');
  const wings=wing?'<path d="M350 120 L235 260 L254 272 L360 245 L469 272 L487 260 L371 120 Z" fill="#365562" stroke="#99c5b2" stroke-width="2"/><path d="M355 112 L355 293 L365 293 L367 112 Z" fill="#b0d8ac" opacity=".45"/>':'';
  const hexTags=data.modules.filter(x=>['imaging','sensing','navigation','payload'].includes(x.category)).slice(0,4);
  const labels=hexTags.map((x,i)=>'<g><rect x="'+(i%2?377:25)+'" y="'+(298+Math.floor(i/2)*33)+'" width="315" height="26" fill="#20333d" stroke="#506b68" rx="4"/><text x="'+(i%2?387:37)+'" y="'+(315+Math.floor(i/2)*33)+'" fill="#dbedda" font-size="12">'+escapeHTML(x.name)+'</text></g>').join('');
  return '<svg viewBox="0 0 720 400" role="img" aria-label="Schematic, not-to-scale '+escapeHTML(type)+' with '+motors+' represented lift rotors. Module list is not dimensioned CAD." xmlns="http://www.w3.org/2000/svg"><defs><pattern id="mission-grid-v09" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#324952" stroke-width=".55"/></pattern></defs><rect width="720" height="400" fill="url(#mission-grid-v09)"/><text x="24" y="30" fill="#bcdda3" font-family="monospace" font-size="12">CONCEPT / '+escapeHTML(type.toUpperCase())+'</text><text x="690" y="30" text-anchor="end" fill="#9ab5b7" font-size="11">NOT TO SCALE · NO CAD</text>'+wings+circles+'<rect x="318" y="155" width="84" height="80" rx="10" fill="#314b50" stroke="#d5e9ba" stroke-width="3"/><rect x="334" y="174" width="52" height="41" rx="5" fill="#16262e" stroke="#6ba495"/><circle cx="360" cy="181" r="7" fill="#7ea7a4"/>'+labels+'</svg>';
 }
 function download(contents,name,type){
  const url=URL.createObjectURL(new Blob([contents],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
 }
 function card(sc){
  const selected=sc.id===active;
  return '<button type="button" class="mission-v09-card'+(selected?' selected':'')+'" data-mission-id="'+escapeHTML(sc.id)+'" aria-pressed="'+selected+'"><span class="mission-v09-kind">'+escapeHTML(sc.topology.toUpperCase())+'</span><strong>'+escapeHTML(sc.name)+'</strong><span>'+escapeHTML(sc.eyebrow)+'</span><span class="mission-v09-card-foot">'+escapeHTML(sc.environment.toUpperCase())+' · '+sc.modules.length+' core module classes <b>↗</b></span></button>';
 }
 function markdown(a){
  const out=['# AeroForge / '+a.concept.name,'','Concept-only scenario: '+a.concept.mission,'Topology: '+a.concept.topology,'Geometry: '+a.geometryAuthority,
  'Airworthiness: NOT ESTABLISHED','Budget/endurance/thrust: UNCALIBRATED / UNPRICED','','## Modules'];
  for(const m of a.modules)out.push('- '+m.category+' / '+m.name+' ('+m.id+'): '+m.designRole+'; hold: '+m.hold);
  out.push('','## Unresolved evidence');
  for(const f of a.findings)out.push('- ['+f.severity+'] '+f.summary+' → '+f.next);
  out.push('','No dimensions, wiring pinouts, validated endurance, regulatory eligibility or flight clearance are implied.');
  return out.join('\n')+'\n';
 }
 function rerender(){
  const a=report(),sc=a.concept;const c=compareMissions(active,compareWith,available(active),available(compareWith));
  $('mission-v09-cards').innerHTML=SCENARIOS.map(card).join('');
  $('mission-v09-title').textContent=sc.name;
  $('mission-v09-subtitle').textContent=sc.eyebrow;
  $('mission-v09-purpose').textContent=sc.mission;
  $('mission-v09-deliverable').textContent=sc.deliverable;
  $('mission-v09-topology').textContent=sc.topology.replaceAll('-',' ').toUpperCase();
  $('mission-v09-drawing').innerHTML=diagram(a);
  $('mission-v09-summary').textContent=a.counts.modules+' proposed module classes · '+a.counts.blocks+' conceptual conflicts · '+a.counts.holds+' explicit evidence holds';
  $('mission-v09-warning').textContent='CONCEPT / NOT VERIFIED · CAD, motor thrust, mass, electrical integration, runtime, pricing and operational approvals are unresolved.';
  const optional=sc.optional.map(id=>MODULE_BY_ID[id]);
  $('mission-v09-options').innerHTML=optional.map(m=>{
   const checked=available(active).includes(m.id);
   return '<label class="mission-v09-option"><input type="checkbox" data-module="'+escapeHTML(m.id)+'" '+(checked?'checked':'')+'/>'+
    '<span><strong>'+escapeHTML(m.name)+'</strong><small>'+escapeHTML(m.category)+' · '+escapeHTML(m.designRole)+'</small></span></label>';
  }).join('');
  $('mission-v09-components').innerHTML=MODULE_CATEGORIES.flatMap(category=>{
   const parts=a.modules.filter(m=>m.category===category);
   if(!parts.length)return[];
   return ['<div class="mission-v09-component-group"><h4>'+escapeHTML(category)+'</h4>'+parts.map(m=>'<div class="mission-v09-component"><strong>'+escapeHTML(m.name)+'</strong><span>'+escapeHTML(m.designRole)+'</span><small>HOLD · '+escapeHTML(m.interface)+'</small></div>').join('')+'</div>'];
  }).join('');
  $('mission-v09-holds').innerHTML=a.findings.filter(f=>f.severity==='BLOCK'||f.id.startsWith('mission:')||f.id==='airspace'||f.id==='safety').map(f=>'<details class="mission-v09-hold"><summary><b class="'+(f.severity==='BLOCK'?'mission-v09-bad':'')+'">'+escapeHTML(f.severity)+'</b> '+escapeHTML(f.summary)+'</summary><p>'+escapeHTML(f.next)+'</p></details>').join('');
  $('mission-v09-compare').value=compareWith;
  $('mission-v09-comparison').innerHTML='<div><b>'+escapeHTML(sc.name)+'</b><span>'+a.counts.modules+' module families · '+escapeHTML(sc.topology)+'</span></div><div><b>'+escapeHTML(SCENARIO_BY_ID[compareWith].name)+'</b><span>'+c.counts.right.modules+' module families · '+escapeHTML(SCENARIO_BY_ID[compareWith].topology)+'</span></div><p>Shared: '+c.shared.length+' · Only left: '+c.onlyLeft.length+' · Only right: '+c.onlyRight.length+'</p><small>Comparison is architectural only. More components is not inherently safer or better.</small>';
  $('mission-v09-baseline').disabled=!sc.baseline;
  $('mission-v09-baseline').textContent=sc.baseline?'Open nearest illustrative quad ('+sc.baseline+') ↗':'No legacy quad model for this topology';
 }
 $('mission-v09-cards').addEventListener('click',e=>{
  const b=e.target.closest('[data-mission-id]');if(!b)return;active=b.dataset.missionId;
  if(active===compareWith)compareWith=SCENARIOS.find(x=>x.id!==active).id;
  rerender();
 });
 $('mission-v09-options').addEventListener('change',e=>{
  if(!e.target.matches('[data-module]'))return;
  const m=e.target.dataset.module,list=new Set(available(active));
  if(e.target.checked)list.add(m);else list.delete(m);
  additions[active]=[...list];rerender();
 });
 $('mission-v09-compare').addEventListener('change',e=>{compareWith=e.target.value;rerender();});
 $('mission-v09-export').addEventListener('click',()=>download(JSON.stringify(report(),null,2)+'\n','aeroforge-'+active+'-mission-concept.json','application/json'));
 $('mission-v09-export-brief').addEventListener('click',()=>download(markdown(report()),'aeroforge-'+active+'-design-brief.md','text/markdown'));
 $('mission-v09-baseline').addEventListener('click',()=>{
  const sc=SCENARIO_BY_ID[active];
  if(!sc.baseline)return;
  const b=document.querySelector('[data-preset="'+sc.baseline+'"]');
  if(b){b.click();document.getElementById('presets')?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}
  $('mission-v09-action-status').textContent='Opened an ILLUSTRATIVE existing quad preset. The added mission modules were NOT installed or physically validated.';
 });
 $('mission-v09-library').innerHTML='<strong>'+MODULES.length+' component-class building blocks</strong> across '+MODULE_CATEGORIES.length+' subsystems. Future manufacturer catalogs will attach exact SKUs, interface schematics, mass properties, testing and source revisions.';
 rerender();
}
