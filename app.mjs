import {catalog} from './core/catalog.mjs';
import {groundKits} from './core/ground.mjs';
import {presets,DEFAULT_ID} from './core/presets.mjs';
import {evaluate,getSensitivity,toPortableJSON} from './core/engine.mjs';
import {planCandidates} from './core/planner.mjs';
import {validateSettings,parseDesignJSON,bomCSV,designKey} from './core/portable.mjs';
import {stages,progress} from './core/checklist.mjs';
import {findEvidence} from './core/evidence.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const slots=[['frame','AIRFRAME','frames'],['motor','BRUSHLESS MOTORS · ×4','motors'],['prop','PROPELLERS · ×4','props'],['stack','FLIGHT CONTROLLER + ESC','stacks'],['battery','BATTERY PACK','batteries'],['video','CAMERA / VIDEO SYSTEM','video']];
const storagePrefix='aeroforge-v02-';
function loadLocal(key,fallback){try{const value=JSON.parse(localStorage.getItem(storagePrefix+key));return value??fallback;}catch{return fallback}}
function storeLocal(key,value){try{localStorage.setItem(storagePrefix+key,JSON.stringify(value))}catch{}}
function initialDesign(){try{return validateSettings(loadLocal('design',null))}catch{return {...presets.find(p=>p.id===DEFAULT_ID).settings,groundKit:'digital'}}}
let state=initialDesign(),current=evaluate(state),viewer=null,selectedPreset=null,plannerResult=null;
let saved=loadLocal('saved',[]);if(!Array.isArray(saved))saved=[];
saved=saved.map(s=>{try{return validateSettings(s)}catch{return null}}).filter(Boolean).slice(-3);
let notesTimer=null;
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('visible');clearTimeout(notesTimer);notesTimer=setTimeout(()=>el.classList.remove('visible'),4200)}
function selectDesign(settings,presetId=null){try{state=validateSettings(settings);selectedPreset=presetId;buildInputs();render()}catch(e){toast('Design could not load: '+e.message)}}
function defaultKit(video){return video==='research'?'research':video==='digital'?'digital':'analog'}
function initialize(){
 $('presets').innerHTML=presets.map(p=>`<button class="preset" type="button" data-preset="${p.id}"><span class="preset-icon">${p.icon}</span><strong>${esc(p.name)}</strong><span>${esc(p.tagline)}</span></button>`).join('');
 $('presets').addEventListener('click',e=>{const el=e.target.closest('[data-preset]');if(!el)return;const p=presets.find(x=>x.id===el.dataset.preset);selectDesign({...p.settings,groundKit:defaultKit(p.settings.video)},p.id)});
 $('ground-kit').innerHTML=groundKits.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('');
 $('ground-kit').addEventListener('change',e=>{state.groundKit=e.target.value;selectedPreset=null;render()});
 buildInputs();
 $('payload').addEventListener('input',e=>{state.payload=Number(e.target.value);selectedPreset=null;render()});
 $('mission').addEventListener('change',e=>{state.mission=e.target.value;selectedPreset=null;render()});
 for(const id of ['export-btn','export-header'])$(id).addEventListener('click',()=>download('json'));
 $('csv-btn').addEventListener('click',()=>download('csv'));
 $('import-btn').addEventListener('click',()=>$('import-file').click());
 $('import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>200000){toast('JSON file too large');return}try{const text=await file.text();selectDesign(parseDesignJSON(text));toast('Imported design, recalculated against the current catalog')}catch(error){toast('Import rejected: '+error.message)}});
 $('compare-btn').addEventListener('click',()=>{const key=designKey(state);saved=saved.filter(s=>designKey(s)!==key);saved.push({...state});saved=saved.slice(-3);storeLocal('saved',saved);renderComparison();toast('Saved this configuration for comparison')});
 $('clear-btn').addEventListener('click',()=>{saved=[];storeLocal('saved',saved);renderComparison();toast('Comparison cleared')});
 $('compare-output').addEventListener('click',e=>{const b=e.target.closest('[data-restore]');if(!b)return;const s=saved[Number(b.dataset.restore)];if(s)selectDesign(s)});
 $('plan-form').addEventListener('submit',e=>{e.preventDefault();updatePlan();$('plan-results').scrollIntoView({behavior:'smooth',block:'nearest'})});
 $('plan-results').addEventListener('click',e=>{const el=e.target.closest('[data-load-candidate]');if(!el||!plannerResult)return;const c=plannerResult.candidates[Number(el.dataset.loadCandidate)];if(c){selectDesign(c.settings);$('stage').scrollIntoView({behavior:'smooth',block:'center'})}});
 $('validation-checks').addEventListener('change',e=>{const el=e.target.closest('[data-check]');if(!el)return;const key=designKey(state);const done=loadLocal('checks:'+key,{});done[el.dataset.check]=el.checked;storeLocal('checks:'+key,done);renderProgress(done)});
 $('clear-checks').addEventListener('click',()=>{storeLocal('checks:'+designKey(state),{});renderChecklist();toast('Revision checklist cleared')});
 const btnIds=['orbit-btn','top-btn','explode-btn','spin-btn'];for(const id of btnIds)$(id).disabled=true;
 $('orbit-btn').onclick=()=>{if(viewer){viewer.setView('orbit');activeView('orbit-btn')}};
 $('top-btn').onclick=()=>{if(viewer){viewer.setView('top');activeView('top-btn')}};
 $('explode-btn').onclick=()=>{if(!viewer)return;const on=viewer.toggleExplosion();$('explode-btn').classList.toggle('active',on);$('explode-btn').setAttribute('aria-pressed',String(on))};
 $('spin-btn').onclick=()=>{if(!viewer)return;const on=viewer.toggleSpin();$('spin-btn').classList.toggle('active',on);$('spin-btn').setAttribute('aria-pressed',String(on))};
 $('plan-mission').value=state.mission;$('plan-payload').value=Math.min(400,state.payload);
 render();updatePlan();
 // Three.js is optional. The UI is fully usable with the local SVG fallback.
 import('./renderer.mjs').then(({makeDroneViewer})=>{
  try{viewer=makeDroneViewer($('model-viewport'));viewer.update(current);$('fallback').style.display='none';$('renderer-status').textContent='Drag to orbit · Scroll to zoom';for(const id of btnIds)$(id).disabled=false}
  catch(e){$('renderer-status').textContent='SVG plan view · WebGL unavailable';console.warn(e)}
 }).catch(()=>{$('renderer-status').textContent='SVG plan view · Three.js CDN unavailable'});
}
function buildInputs(){
 $('config-inputs').innerHTML=slots.map(([key,label,section])=>`<div class="input-block"><label for="sel-${key}">${label}<span class="design-note">↗ swap</span></label><select id="sel-${key}">${catalog[section].map(x=>`<option value="${x.id}" ${state[key]===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>`).join('');
 for(const [key] of slots)$('sel-'+key).onchange=e=>{state[key]=e.target.value;selectedPreset=null;render()};
 $('payload').value=Math.min(state.payload,400);$('mission').value=state.mission;$('ground-kit').value=state.groundKit||'none';
}
function updatePlan(){
 const brief={mission:$('plan-mission').value,budgetUSD:Number($('plan-budget').value),payloadG:Number($('plan-payload').value),priority:$('plan-priority').value};
 plannerResult=planCandidates(brief);
 $('plan-results').innerHTML=plannerResult.candidates.map((c,i)=>{
  const m=c.result.metrics;
  return `<article class="candidate-card"><div class="candidate-head"><span>OPTION ${String(i+1).padStart(2,'0')}</span><span class="candidate-score">FIT ${c.score}/100*</span></div><h3>${esc(c.name)}</h3><p>${esc(c.tagline)}</p><div class="candidate-stats"><div><b>${m.massG}g</b><small>TAKEOFF</small></div><div><b>${m.flightMin}min</b><small>MODELED</small></div><div><b>$${m.startupUSD}</b><small>STARTUP</small></div></div><div class="candidate-finding">${esc(c.strengths[0]||c.shortfalls[0])}</div><small class="candidate-risk">${esc(c.shortfalls[0])}</small><button type="button" data-load-candidate="${i}" class="quiet candidate-load">Customize in 3D ↗</button></article>`;
 }).join('');
}
function render(){
 current=evaluate(state);storeLocal('design',state);
 for(const el of document.querySelectorAll('[data-preset]'))el.classList.toggle('active',el.dataset.preset===selectedPreset);
 $('payload-label').textContent=state.payload+' g';$('ground-kit').value=state.groundKit||'none';
 const {metrics:m,parts:p,findings}=current;
 $('stage-title').textContent=p.frame.name.split(' · ')[0].toUpperCase();$('stage-subtitle').textContent=p.frame.class.toUpperCase()+' QUADCOPTER';
 $('model-detail').textContent=p.prop.size.toFixed(1)+'″ PROPS · '+p.frame.wheelbase+'mm MOTOR DIAGONAL · X4';
 $('mass').textContent=m.massG;$('time').textContent=m.flightMin;$('twr').textContent=m.thrustRatio;$('cost').textContent=m.budgetUSD;
 $('ground-cost').textContent='$'+m.groundUSD;$('startup-cost').textContent='$'+m.startupUSD;
 $('flight-range').textContent=`${m.flightLowMin}–${m.flightHighMin} min`;
 $('screening-status').textContent=current.status==='BLOCKED'?'INCOMPATIBLE':current.status==='REVIEW'?'REVIEW REQUIRED':'CONCEPT ONLY';
 $('status-dot').style.background=current.status==='BLOCKED'?'var(--red)':current.status==='REVIEW'?'var(--orange)':'var(--accent)';
 $('blocker-count').textContent=current.blockers.length+' blocker'+(current.blockers.length===1?'':'s');
 $('thrust-value').textContent=m.thrustRatio+'×';$('energy-value').textContent=m.batteryWh+' Wh';$('power-value').textContent=m.hoverW+' W';
 $('thrust-bar').style.width=Math.min(100,m.thrustRatio/6*100)+'%';$('energy-bar').style.width=Math.min(100,m.batteryWh/120*100)+'%';$('power-bar').style.width=Math.min(100,m.hoverW/400*100)+'%';
 $('finding-count').textContent=findings.length+' FINDINGS';
 const sorted=[...findings].sort((a,b)=>({blocked:0,warning:1,measure:2,regulatory:3}[a.level]-{blocked:0,warning:1,measure:2,regulatory:3}[b.level]));
 $('findings').innerHTML=sorted.map(f=>`<details class="finding ${f.level}"><summary><span class="finding-icon">${f.level==='blocked'?'⊗':f.level==='warning'?'⚠':'◈'}</span><strong>${esc(f.message)}</strong></summary><p>${esc(f.why)}</p><p><b>Next:</b> ${esc(f.action)}</p><small>${esc(f.category.toUpperCase())} · ${esc(f.code)}</small></details>`).join('');
 const airRows=current.items.map(x=>`<tr><td>${esc(x.slot)}</td><td>${esc(x.name)} <small class="unverified">unverified</small></td><td>${x.quantity}</td><td>${x.mass} g</td><td>$${(x.quantity*x.unitPrice).toFixed(0)}</td></tr>`);
 if(state.payload)airRows.push(`<tr><td>Added payload</td><td>Custom payload / mass only</td><td>1</td><td>${state.payload} g</td><td>UNPRICED</td></tr>`);
 airRows.push(`<tr class="bom-group"><td colspan="5">GROUND & BENCH EQUIPMENT · NOT ON THE AIRCRAFT</td></tr>`);
 airRows.push(...current.groundItems.map(x=>`<tr><td>Ground</td><td>${esc(x.name)}</td><td>1</td><td>0 g</td><td>$${x.price.toFixed(0)}</td></tr>`));
 $('bom-rows').innerHTML=airRows.join('');$('bom-total').textContent='$'+m.budgetUSD;
 renderAssembly();renderComparison();renderEvidence();renderSensitivity();renderArchitecture();renderChecklist();
 if(viewer)viewer.update(current);else renderFallback();
}
function renderFallback(){
 const {frame,prop}=current.parts;
 const motorRad=frame.wheelbase/2;const center=[250,210];const positions=[45,135,225,315].map(a=>{const v=a*Math.PI/180;return [motorRad*Math.cos(v),motorRad*Math.sin(v)]});
 const maxExtent=motorRad+prop.size*25.4/2+10,scale=Math.min(165/maxExtent,1.45);
 const rad=prop.size*25.4/2*scale;
 let markup='<svg viewBox="0 0 500 420" role="img" aria-label="Top-down parametric drone geometry illustration"><circle cx="250" cy="210" r="178" fill="none" stroke="#49636f" stroke-width="1" stroke-dasharray="5 7" opacity=".5"/>';
 for(const [xx,yy] of positions){const x=250+xx*scale,y=210+yy*scale;markup+=`<line x1="250" y1="210" x2="${x}" y2="${y}" stroke="#263840" stroke-width="21" stroke-linecap="round"/><line x1="250" y1="210" x2="${x}" y2="${y}" stroke="${frame.color}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${rad}" fill="${frame.color}" fill-opacity=".10" stroke="${frame.color}" stroke-opacity=".62" stroke-width="2"/><circle cx="${x}" cy="${y}" r="9" fill="#b8c7c9" stroke="#293e47" stroke-width="4"/>`}
 markup+=`<rect x="203" y="168" width="94" height="84" rx="11" fill="#24343e" stroke="${frame.color}" stroke-width="2"/><rect x="223" y="175" width="54" height="69" rx="5" fill="#47606b"/><rect x="233" y="182" width="34" height="5" fill="#d5ff90"/><rect x="233" y="127" width="34" height="43" rx="6" fill="#162630" stroke="#8eacb3"/><circle cx="250" cy="141" r="10" fill="#8ed8ee" stroke="#17303f" stroke-width="6"/><text x="250" y="399" fill="#9db9c4" text-anchor="middle" letter-spacing="2" font-size="11">CONCEPT GEOMETRY · NOT CAD-VERIFIED</text></svg>`;
 $('fallback').innerHTML=markup;
}
function renderAssembly(){
 const steps=[['01','Source by revision','Confirm vendor models, interfaces, geometry, thrust curves and complete costs.'],['02','Assemble the frame without power','Measure prop clearance, mounting, CG and mass with all intended payload.'],['03','Inspect electrical integration','Document power distribution, BEC loads, polarity, receiver and failsafe.'],['04','Bench-test with propellers removed','Verify firmware target, sensor alignment, motor order and radio loss modes.'],['05','Record tests & review airspace','Capture physical evidence and complete an independent inspection before flight.']];
 $('assembly').innerHTML=steps.map(([n,t,d])=>`<div class="step"><span class="step-index">${n}</span><div><strong>${t}</strong><p>${d}</p></div></div>`).join('');
}
function renderComparison(){
 if(!saved.length){$('compare-output').className='empty-compare';$('compare-output').textContent='No saved designs yet. Save up to three variations for side-by-side review.';$('clear-btn').disabled=true;return}
 $('clear-btn').disabled=false;$('compare-output').className='compare-data';
 const comparison=[{settings:state,label:'LIVE',current:true},...saved.map((s,i)=>({settings:s,label:'SAVED '+(i+1),index:i}))];
 $('compare-output').innerHTML=`<div class="compare-grid">${comparison.map(row=>{
  const r=evaluate(row.settings),m=r.metrics;
  return `<div class="compare-card ${row.current?'live':''}"><small>${row.label}</small><strong>${esc(r.parts.frame.name.split(' · ')[0])}</strong><dl><dt>Airframe</dt><dd>${m.massG} g</dd><dt>Startup</dt><dd>$${m.startupUSD}</dd><dt>Model time</dt><dd>${m.flightMin} min</dd><dt>Blockers</dt><dd>${r.blockers.length}</dd></dl>${row.current?'':`<button class="quiet" data-restore="${row.index}">Load this design ↗</button>`}</div>`;
 }).join('')}</div><p>All numbers are preliminary assumptions; saved records stay in this browser and are not sent to a server.</p>`;
}
function renderEvidence(){
 const queue=[['Airframe',current.parts.frame.name,'Frame geometry, hole centers, arm strength, actual weight','frame',state.frame],['Motors ×4',current.parts.motor.name,'KV, current limit, 3D dimensions, prop thrust tables','motor',state.motor],['ESC + flight controller',current.parts.stack.name,'Hardware revision, firmware target, voltage, per-channel current and regulators','stack',state.stack],['Battery',current.parts.battery.name,'Chemistry, mass, connector, discharge rating, charging instructions','battery',state.battery],['Props',current.parts.prop.name,'Blade size, pitch, hub/shaft fit and guard clearance','prop',state.prop],['Camera / downlink',current.parts.video.name,'Supply voltage, draw, mount dimensions, ground receiver compatibility','video',state.video]];
 $('evidence-queue').innerHTML=queue.map(([slot,name,needed,partSlot,partId])=>{const links=findEvidence(partSlot,partId);return `<div class="evidence-row"><span class="evidence-pill">NEEDS SOURCE</span><strong>${esc(slot)}</strong><small>${esc(name)}</small><p>${esc(needed)}</p>${links.map(link=>`<div class="evidence-link"><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">Research lead: ${esc(link.name)} ↗</a><em>${esc(link.status.replaceAll('-',' '))}</em><details><summary>Source claims and unresolved measurements</summary><p>Documented: ${esc(link.facts.join(' · '))}</p><p>Unresolved: ${esc(link.unknowns.join(' · '))}</p></details></div>`).join('')}</div>`;}).join('');
}
function renderArchitecture(){
 const {battery,stack,motor,video,frame}=current.parts;
 const errorCodes=new Set(current.blockers.map(x=>x.code));
 const showAlert=ids=>ids.some(id=>errorCodes.has(id))?'path-blocked':'';
 const node=(k,v,detail,flags='')=>`<div class="schematic-node ${flags}"><small>${esc(k)}</small><strong>${esc(v)}</strong><span>${esc(detail)}</span></div>`;
 $('system-architecture').innerHTML=`<div class="schematic-flow">
  <div class="schematic-path">${node('BATTERY / ENERGY',`${battery.cells}S · ${battery.capacity}mAh`,`${battery.connector} · ${current.metrics.batteryWh} Wh`)}<span class="arrow">→ POWER →</span>${node('FLIGHT CONTROLLER & 4-IN-1 ESC',stack.name,`ESC ${stack.escA}A/channel · FC mount ${stack.mount}mm`,showAlert(['STACK_CELLS','STACK_MOUNT','ESC_MARGIN']))}<span class="arrow">→ PHASES →</span>${node('FOUR MOTORS',`${motor.kv} KV ×4`,`${current.parts.prop.size}″ props · frame ${frame.wheelbase}mm`,showAlert(['MOTOR_CELLS','MOTOR_PROP','PROP_ENVELOPE','MOTOR_MOUNT']))}</div>
  <div class="schematic-branches"><div class="branch"><span>↳ RADIO / CONTROL</span>${node('RX INPUT','ExpressLRS class','Protocol, UART, antenna and failsafe not verified')}</div><div class="branch"><span>↳ REGULATED VIDEO</span>${node(`${video.voltage} V POWER`,video.name,`${video.watts} W illustrative draw`,showAlert(['VIDEO_BEC','CAMERA_FIT','GROUND_VIDEO']))}</div><div class="branch"><span>↳ GROUND STATION</span>${node('GROUND / BENCH',groundKits.find(x=>x.id===state.groundKit)?.name||'Unspecified',`Estimated ground subtotal $${current.metrics.groundUSD}`)}</div></div>
 </div><p class="schematic-disclaimer">Topology only. Never use this conceptual diagram as a wiring/pinout reference. Use the exact manufacturer schematic for your selected revisions; power distribution, BEC loading, current limits, capacitor placement, connector polarity and UART mapping remain unverified.</p>`;
}
function renderSensitivity(){
 const points=getSensitivity(current),width=430,height=158,left=38,right=12,top=15,bottom=25;
 const maxX=Math.max(...points.map(p=>p.extraG)),maxY=Math.max(...points.map(p=>p.minutes))*1.17;
 const x=v=>left+(width-left-right)*v/maxX,y=v=>height-bottom-(height-top-bottom)*v/maxY;
 const d=points.map((p,i)=>`${i?'L':'M'}${x(p.extraG).toFixed(1)} ${y(p.minutes).toFixed(1)}`).join(' ');
 const dots=points.map(p=>`<circle cx="${x(p.extraG)}" cy="${y(p.minutes)}" r="3" fill="#d5ff90"><title>+${p.extraG} g: ${p.minutes} min modeled</title></circle>`).join('');
 $('sensitivity').innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Illustrative flight duration decreases as payload mass increases"><line x1="${left}" x2="${width-right}" y1="${height-bottom}" y2="${height-bottom}" stroke="#415661"/><line x1="${left}" x2="${left}" y1="${top}" y2="${height-bottom}" stroke="#415661"/><path d="${d}" stroke="#d5ff90" stroke-width="2.5" fill="none"/>${dots}<text x="${left}" y="${height-5}" fill="#94abb6" font-size="10">+0 g</text><text x="${width-right}" y="${height-5}" text-anchor="end" fill="#94abb6" font-size="10">+${maxX} g</text><text x="${left-6}" y="${top+4}" text-anchor="end" fill="#94abb6" font-size="10">${maxY.toFixed(0)}</text><text x="${left-6}" y="${height-bottom}" text-anchor="end" fill="#94abb6" font-size="10">0</text></svg>`;
 $('sensitivity-caption').textContent=`${points[0].minutes} min at current mass → ${points.at(-1).minutes} min at +${maxX} g, holding all other assumptions fixed.`;
}
function renderProgress(done){const p=progress(done);$('check-progress').textContent=p.checked+' / '+p.total+' recorded';}
function renderChecklist(){
 const done=loadLocal('checks:'+designKey(state),{});
 $('validation-checks').innerHTML=stages.map(stage=>`<div class="gate-stage"><h4>${esc(stage.title)}</h4>${stage.items.map(([id,label])=>`<label class="gate-item"><input type="checkbox" data-check="${id}" ${done[id]?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div>`).join('');
 renderProgress(done);
}
function activeView(id){for(const b of ['orbit-btn','top-btn']){$(b).classList.toggle('active',b===id);$(b).setAttribute('aria-pressed',String(b===id))}}
function download(format){
 const content=format==='csv'?bomCSV(current):toPortableJSON(current),mime=format==='csv'?'text/csv;charset=utf-8':'application/json';
 const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
 a.download=`aeroforge-${state.frame}-${new Date().toISOString().slice(0,10)}.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
initialize();
