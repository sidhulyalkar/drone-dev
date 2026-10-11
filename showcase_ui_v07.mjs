import {getCurrentDesign} from './app.mjs';
import {buildShowcaseManifest,createTourController,SUBSYSTEMS} from './core/showcase_v07.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const host=$('showcase-v07');
if(host){
 let manifest=buildShowcaseManifest(getCurrentDesign()),controller,viewer=null,lastTime=0,frameId=0;
 let selectedId=null,filter='all',webgl=false;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 function download(){const file={...manifest,notice:'This is a geometry/storyboard manifest, not CAD, a physical BOM, or an assembly qualification.'};const url=URL.createObjectURL(new Blob([JSON.stringify(file,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='aeroforge-'+manifest.airframe.name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-exploded-showcase.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 function plainView(){
  const a=manifest.airframe,scale=110/Math.max(.6,a.radius),circles=manifest.parts.filter(p=>p.id.startsWith('motor-'));
  $('showcase-fallback').innerHTML=`<svg viewBox="0 0 500 440" role="img" aria-label="Illustrative top-down quadcopter and four motor locations; 3D tour is unavailable"><defs><pattern id="show-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0L0 0 0 25" fill="none" stroke="#2e4752" stroke-width=".5"/></pattern></defs><rect width="500" height="440" fill="url(#show-grid)"/><text x="24" y="36" fill="#cfeab2" font-size="12">ILLUSTRATIVE FALLBACK • ${esc(a.name)}</text><g stroke="#708a91" stroke-width="19" stroke-linecap="round">${circles.map(p=>`<line x1="250" y1="220" x2="${250+p.anchor[0]*scale}" y2="${220+p.anchor[2]*scale}"/>`).join('')}</g><rect x="215" y="183" width="70" height="75" fill="#263844" stroke="#a8c8ae" rx="7"/>${circles.map(p=>`<circle cx="${250+p.anchor[0]*scale}" cy="${220+p.anchor[2]*scale}" r="${a.propRadius*scale}" fill="#c6f59b13" stroke="#9bd09b" stroke-width="1.7"/>`).join('')}<text x="24" y="415" fill="#aac1c8" font-size="11">Selecting a part updates the evidence panel, even without WebGL.</text></svg>`;
 }
 function list(){const all=manifest.parts,shown=filter==='all'?all:all.filter(p=>p.subsystem===filter);
  $('showcase-parts').innerHTML=shown.map((p,i)=>`<button type="button" class="showcase-part ${p.id===selectedId?'is-selected':''}" data-showcase-id="${esc(p.id)}" aria-pressed="${p.id===selectedId}"><span class="sp-index">${String(i+1).padStart(2,'0')}</span><span><b>${esc(p.name)}</b><small>${esc(p.subsystem)}</small></span><span class="sp-arrow">↗</span></button>`).join('');
 }
 function setDetail(id){const p=manifest.parts.find(v=>v.id===id)||null;selectedId=p?.id||null;
  if(!p){$('showcase-part-title').textContent='Choose a component';$('showcase-part-desc').textContent='Select a part or press Play Tour to zoom through the full build.';$('showcase-part-specs').replaceChildren();$('showcase-part-evidence').textContent='PROCEDURAL · NOT VERIFIED CAD';}
  else{$('showcase-part-title').textContent=p.name;$('showcase-part-desc').textContent=p.description;
   $('showcase-part-evidence').textContent='PROCEDURAL · UNVERIFIED COMPONENT CLASS';
   $('showcase-part-specs').innerHTML=p.specs.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');}
  list();
 }
 function display(s){if(s.partId!==selectedId)setDetail(s.partId);
  $('showcase-progress').textContent=s.total?`${String(s.currentIndex+1).padStart(2,'0')} / ${String(s.total).padStart(2,'0')}`:'0 / 0';
  $('showcase-phase').textContent=s.playing?'TOUR / '+s.phase.toUpperCase():s.mode.toUpperCase();
  $('showcase-play').textContent=s.playing?'Ⅱ Pause tour':'▶ Play tour';
  $('showcase-play').setAttribute('aria-pressed',String(s.playing));
  $('showcase-explode').setAttribute('aria-pressed',String(s.exploded));
  $('showcase-explode').classList.toggle('active',s.exploded);
  $('showcase-assemble').classList.toggle('active',s.mode==='assembled');
  if(viewer)viewer.setState(s);
 }
 function buildController(){controller=createTourController(manifest.parts,display);filter='all';$('showcase-subsystem').value='all';setDetail(null);display(controller.getState());}
 function setManifest(r){if(!r)return;const next=buildShowcaseManifest(r);
  // Keep the view tied to the currently selected design and avoid stale part labels.
  const prev=manifest.airframe.name;manifest=next;buildController();plainView();
  $('showcase-airframe').textContent=manifest.airframe.name;
  $('showcase-geometry').textContent=manifest.parts.length+' SEPARATE OBJECTS · '+manifest.airframe.wheelbaseMm+' MM CLASS';
  if(viewer)viewer.setManifest(manifest);
 }
 const filters=$('showcase-subsystem');filters.innerHTML=SUBSYSTEMS.map(s=>`<option value="${s.id}">${esc(s.label)}</option>`).join('');
 $('showcase-play').addEventListener('click',()=>controller.toggle());
 $('showcase-explode').addEventListener('click',()=>controller.explode());
 $('showcase-assemble').addEventListener('click',()=>controller.assemble());
 $('showcase-prev').addEventListener('click',()=>controller.step(-1));
 $('showcase-next').addEventListener('click',()=>controller.step(1));
 $('showcase-speed').addEventListener('input',e=>{controller.setSpeed(Number(e.target.value));$('showcase-speed-label').textContent=Number(e.target.value).toFixed(2)+'×'});
 $('showcase-subsystem').addEventListener('change',e=>{filter=e.target.value;controller.setFilter(filter);list()});
 $('showcase-parts').addEventListener('click',e=>{const b=e.target.closest('[data-showcase-id]');if(b)controller.select(b.dataset.showcaseId)});
 $('showcase-export').addEventListener('click',download);
 host.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.key==='ArrowRight'){e.preventDefault();controller.step(1)}if(e.key==='ArrowLeft'){e.preventDefault();controller.step(-1)}});
 window.addEventListener('aeroforge:design-updated',e=>setManifest(e.detail.result));
 buildController();plainView();setManifest(getCurrentDesign());
 // The viewer is progressive enhancement. Part inspection and manifest export always work.
 import('./showcase_3d_v07.mjs').then(mod=>{
  try{viewer=mod.createShowcaseViewer($('showcase-viewport'),manifest,id=>controller.select(id));
    viewer.setState(controller.getState());webgl=true;$('showcase-fallback').hidden=true;
    $('showcase-renderer-status').textContent='3D active · Drag to orbit · Click parts to inspect';
  }catch(error){console.warn('Showcase WebGL fallback:',error);$('showcase-renderer-status').textContent='2D fallback · 3D unavailable';}
 }).catch(()=>{$('showcase-renderer-status').textContent='2D fallback · Three.js unavailable';});
 function loop(now){const dt=Math.min((now-lastTime)/1000||0,.05);lastTime=now;controller.tick(dt);frameId=requestAnimationFrame(loop)}frameId=requestAnimationFrame(loop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&controller.getState().playing)controller.pause()});
 if(reduced){$('showcase-motion-warning').textContent='Reduced-motion preference detected. Guided camera movement is disabled until you opt into the tour.';}
}
