import {parts,evidenceRegistry,qualify,qualificationDefaults,normalizeQualification,mainPlateMounts,canonicalSnapshot,snapshotSha256,inspectionPacket} from './core/qualification_v04.mjs';

const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[k]));
const store='aeroforge-qualification-v04';let input={...qualificationDefaults};try{input=normalizeQualification(JSON.parse(localStorage.getItem(store))||{})}catch{}
let renderId=0;
const download=(value,name,mime)=>{const b=new Blob([value],{type:mime}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)};
function set(field,value){try{input=normalizeQualification({...input,[field]:value});try{localStorage.setItem(store,JSON.stringify(input))}catch{}render()}catch(e){$('q-note').textContent='Rejected input: '+e.message;}}
function mountSvg(){
 const to=p=>({x:170+p[0]*2,y:154-p[1]*2});
 const holes=mainPlateMounts.pattern30_5.map(p=>{const q=to(p);return `<circle cx="${q.x}" cy="${q.y}" r="3.1" fill="#c8e6a2"/>`}).join('');
 const holes20=mainPlateMounts.pattern20.map(p=>{const q=to(p);return `<circle cx="${q.x}" cy="${q.y}" r="2.6" fill="#7eb4da"/>`}).join('');
 return `<svg viewBox="0 0 340 215" role="img" aria-label="Exact manufacturer DXF hole centers for 20 and 30.5 mm stack patterns; NOT assembled frame geometry"><rect width="340" height="215" fill="#10212b"/><path d="M170 30 V185 M35 154 H305" stroke="#617680" stroke-width="1" stroke-dasharray="3 4"/><rect x="139.5" y="102.5" width="61" height="61" fill="#c8e6a214" stroke="#c8e6a2" stroke-dasharray="4 3"/><rect x="150" y="114" width="40" height="40" fill="#7eb4da12" stroke="#7eb4da" stroke-dasharray="4 3"/>${holes}${holes20}<text x="15" y="23" fill="#e4f0e9" font-size="11">TBS SOURCE TWO v0.1 · MAIN PLATE DXF</text><text x="15" y="41" fill="#c8e6a2" font-size="10">● 30.5 mm pattern</text><text x="175" y="41" fill="#7eb4da" font-size="10">● 20 mm pattern</text><text x="15" y="199" fill="#98aeb8" font-size="10">2D drawing datum only · assembly Z / motor XYZ unresolved</text></svg>`;
}
const statusClass=s=>s.startsWith('PASS')?'q-pass':s.startsWith('FAIL')?'q-fail':'q-hold';
function sourceItem(id){const e=evidenceRegistry[id];return e?`<a href="${escape(e.url)}" target="_blank" rel="noopener noreferrer" title="${escape(e.kind+' / '+e.revision)}">${escape(id)} ↗</a>`:`<span>${escape(id)}</span>`}
function reportGraph(r){
 const groups={};for(const rule of r.rules)(groups[rule.kind]??=[]).push(rule);
 return Object.entries(groups).map(([group,rules])=>`<section class="q-rule-cluster"><h4>${escape(group)} <small>${rules.length} checks</small></h4>${rules.map(x=>`<details class="q-rule"><summary><span class="q-rule-state ${statusClass(x.status)}">${escape(x.status)}</span><span class="q-rule-name">${escape(x.from)} → ${escape(x.to)}</span><b>${escape(x.id)}</b></summary><p>${escape(x.why)}</p><p><strong>Evidence:</strong> ${x.evidence.length?x.evidence.map(sourceItem).join(' · '):'Not supplied'}</p><p><strong>Next verification:</strong> ${escape(x.action)}</p></details>`).join('')}</section>`).join('');
}
async function render(){const stamp=++renderId,r=qualify(input);$('q-status').textContent=r.status.replaceAll('_',' ');$('q-status').className='q-main-status '+statusClass(r.status);$('q-rules-count').textContent=r.ruleCount;$('q-fails').textContent=r.failed;$('q-holds').textContent=r.holds;$('q-passes').textContent=r.documented;
 $('q-rule-list').innerHTML=reportGraph(r);
 $('q-availability').textContent=`${r.stack.sku} · ${r.stack.availability}`;
 $('q-availability').className='q-availability '+(r.stack.availability==='UNKNOWN'?'q-hold':'q-fail');
 $('q-mount-svg').innerHTML=mountSvg();
 $('q-provenance').innerHTML=Object.entries(evidenceRegistry).map(([id,s])=>`<li><b>${escape(id)}</b><span>${escape(s.kind)} · ${escape(s.status)} · ${escape(s.revision)}</span>${sourceItem(id)}</li>`).join('');
 $('q-rotor-outcome').textContent=r.rotor?(r.rotor.status==='FAIL_ENVELOPE'?`FAIL: rotor disk overlap / insufficient gap (${r.rotor.nearestGapMm} mm)`: `XY envelope passes planning threshold: nearest ${r.rotor.nearestGapMm} mm; frame/mesh clearance still unknown`):'No actual measured motor XY/Z coordinates and prop sweep. Rotor clearance is unqualified.';
 $('q-cg-outcome').textContent=r.cg?`Payload shifts baseline CG by X ${r.cg.x}, Y ${r.cg.y}, Z ${r.cg.z} mm, under entered mass assumptions. Inertias unverified.`:'Measured baseline mass needed to calculate payload CG shift.';
 $('q-note').textContent='User measurements are assertions until tied to a source file, instrument record and independent inspection. Flight readiness is never granted by these controls.';
 for(const el of document.querySelectorAll('#qualification-console [data-q-field]')){
  const v=input[el.dataset.qField];if(document.activeElement!==el)el.value=v===null?'':String(v);
 }
 // Keep in-progress rotor text while changing prop diameter or another field.
 try{const sha=await snapshotSha256(input);if(stamp===renderId){$('q-sha').textContent=sha;$('q-sha').title='SHA-256 snapshot digest; identity only, not truth or flight readiness';}}catch(e){if(stamp===renderId)$('q-sha').textContent='SHA-256 unavailable: '+e.message}
}
function init(){if(!$('qualification-console'))return;
 $('q-rotors').value=input.rotors?JSON.stringify(input.rotors,null,2):'';
 $('q-prop-diameter').value=input.measuredPropDiameterMm??'';
 $('q-payload-x').value=input.payloadOffsetMm.x;
 $('q-payload-y').value=input.payloadOffsetMm.y;
 $('q-payload-z').value=input.payloadOffsetMm.z;
 $('qualification-console').addEventListener('change',event=>{const el=event.target.closest('[data-q-field]');if(!el)return;const k=el.dataset.qField;set(k,el.type==='number'?(el.value===''?null:Number(el.value)):el.value)});
 $('q-prop-diameter').addEventListener('change',e=>set('measuredPropDiameterMm',e.target.value===''?null:Number(e.target.value)));
 $('q-payload-x').addEventListener('change',e=>set('payloadOffsetMm',{...input.payloadOffsetMm,x:Number(e.target.value)}));
 $('q-payload-y').addEventListener('change',e=>set('payloadOffsetMm',{...input.payloadOffsetMm,y:Number(e.target.value)}));
 $('q-payload-z').addEventListener('change',e=>set('payloadOffsetMm',{...input.payloadOffsetMm,z:Number(e.target.value)}));
 $('q-load-rotors').onclick=()=>{try{const raw=$('q-rotors').value.trim();set('rotors',raw?JSON.parse(raw):null)}catch(e){$('q-note').textContent='Cannot import rotor geometry: '+e.message}};
 $('q-example-rotors').onclick=()=>{$('q-rotors').value=JSON.stringify([{x:-77.78,y:-77.78,z:0},{x:77.78,y:-77.78,z:0},{x:-77.78,y:77.78,z:0},{x:77.78,y:77.78,z:0}],null,2);$('q-note').textContent='Example symmetrical coordinates inserted in the editor ONLY, not imported, not measured and not claimed to match the actual Source Two. Click Apply geometry to run a hypothetical clearance check.'};
 $('q-reset').onclick=()=>{input={...qualificationDefaults};try{localStorage.removeItem(store)}catch{}$('q-rotors').value='';$('q-payload-x').value=0;$('q-payload-y').value=0;$('q-payload-z').value=0;$('q-prop-diameter').value='';render()};
 $('q-export-snapshot').onclick=async()=>{const snapshot=canonicalSnapshot(input);const sha=await snapshotSha256(input);download(JSON.stringify({...snapshot,sha256:sha},null,2)+'\n',`aeroforge-v04-${sha.slice(0,12)}-locked-design.json`,'application/json')};
 $('q-export-packet').onclick=async()=>{const sha=await snapshotSha256(input);download(inspectionPacket(input)+`\nSnapshot SHA-256: ${sha}\n`,`aeroforge-v04-${sha.slice(0,12)}-inspection.md`,'text/markdown')};
 $('q-export-sitl').onclick=async()=>{const snap=canonicalSnapshot(input),sha=await snapshotSha256(input);download(JSON.stringify({...snap.simulation,designSnapshotSha256:sha},null,2)+'\n',`aeroforge-v04-${sha.slice(0,12)}-px4-hold.json`,'application/json')};
 render();
}
init();
