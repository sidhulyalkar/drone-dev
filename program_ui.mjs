import {programPlan, programs} from './core/program_v05.mjs';
import {auditCalibration, syntheticHoverDemo} from './core/simulation_v05.mjs';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const choices={program:'px4_explorer',payloadG:200,budgetUSD:1200,prioritize:'sensing'};
let plan=null;
function download(data,filename,mime){const url=URL.createObjectURL(new Blob([data],{type:mime}));const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function verticalGraph(demo){
 const width=640,height=210,pad=28,points=demo.points,max=Math.max(1,...points.map(p=>p.z));
 const trace=points.map((p,i)=>`${i?'L':'M'} ${(pad+(p.t/8)*(width-pad*2)).toFixed(1)} ${(height-pad-(p.z/max)*(height-2*pad)).toFixed(1)}`).join(' ');
 return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Synthetic one-dimensional altitude trajectory, not a simulated PX4 flight"><rect width="640" height="210" fill="#0b1a24"/><path d="M28 16V182H616" fill="none" stroke="#587482"/><path d="${trace}" fill="none" stroke="#c8ed9a" stroke-width="3" stroke-linecap="round"/><text x="30" y="14" fill="#c0d0db" font-size="12">ALTITUDE ${max.toFixed(2)}m scale (synthetic)</text><text x="534" y="201" fill="#99aebd" font-size="11">8 seconds</text></svg>`;
}
function draw(){
 try{plan=programPlan(choices);const detail=programs[plan.program];
 $('v05-program-title').textContent=detail.name;
 $('v05-program-info').textContent=`${detail.class} · ${detail.frame}`;
 $('v05-goal').textContent=detail.goalMinutes===null?'Not established':`${detail.goalMinutes} min (unverified target)`;
 $('v05-parameter-warning').textContent=plan.warnings.join(' ')||'Targets are architecture-planning hypotheses. Aircraft hardware, performance and cost are not qualified.';
 $('v05-requirements').innerHTML=plan.requirements.map(x=>`<li>${escape(x)}</li>`).join('');
 $('v05-milestones').innerHTML=plan.milestones.map((m,i)=>`<div class="v05-gate"><strong>${String(i+1).padStart(2,'0')} · ${escape(m.title)}</strong><span class="q-rule-state q-hold">${escape(m.gate)}</span><p>${escape(m.why)}</p></div>`).join('');
 $('v05-holds').innerHTML=plan.holds.map(x=>`<li>${escape(x)}</li>`).join('');
 $('v05-sources').innerHTML=plan.sources.map(x=>`<a href="${escape(x)}" target="_blank" rel="noopener noreferrer">${escape(new URL(x).hostname)} ↗</a>`).join(' · ');
 }catch(e){$('v05-parameter-warning').textContent='Invalid planning input: '+e.message;}
}
function experiment(){
 try{const payloadG=Number($('v05-demo-payload').value),throttle=Number($('v05-demo-throttle').value)/100;
 const demo=syntheticHoverDemo({seconds:8,payloadG,throttle});
 $('v05-demo-chart').innerHTML=verticalGraph(demo);
 $('v05-demo-result').textContent=`Synthetic final altitude: ${demo.finalAltitudeM.toFixed(2)}m · implied ideal hover throttle ${Math.round(demo.hoverThrottle*100)}%. No attitude dynamics, actuator identification, wind or ground effects.`;
 }catch(e){$('v05-demo-result').textContent='Invalid synthetic experiment: '+e.message;}
}
function init(){if(!$('v05-program'))return;
 const fields={program:'v05-program',payloadG:'v05-payload',budgetUSD:'v05-budget',prioritize:'v05-priority'};
 for(const [key,id] of Object.entries(fields)){$(id).value=choices[key];$(id).addEventListener('change',e=>{choices[key]=['payloadG','budgetUSD'].includes(key)?Number(e.target.value):e.target.value;draw();});}
 const audit=auditCalibration({});$('v05-audit-state').textContent=`${audit.status} · ${audit.issues.length} missing fields`;
 $('v05-audit-list').innerHTML=audit.issues.map(x=>`<li><b>${escape(x.field)}</b>: ${escape(x.reason)}</li>`).join('');
 for(const id of ['v05-demo-payload','v05-demo-throttle'])$(id).addEventListener('input',experiment);
 $('v05-export-plan').onclick=()=>{if(plan)download(JSON.stringify(plan,null,2)+'\n','aeroforge-v05-'+plan.program+'-architecture-plan.json','application/json')};
 $('v05-export-audit').onclick=()=>download(JSON.stringify(audit,null,2)+'\n','aeroforge-v05-calibration-holds.json','application/json');
 $('v05-export-demo').onclick=()=>{try{const d=syntheticHoverDemo({seconds:8,payloadG:Number($('v05-demo-payload').value),throttle:Number($('v05-demo-throttle').value)/100});download(JSON.stringify(d,null,2)+'\n','aeroforge-v05-SYNTHETIC-vertical-motion.json','application/json')}catch(e){$('v05-demo-result').textContent=e.message}};
 draw();experiment();
}
init();
