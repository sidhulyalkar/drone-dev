/** v3.5 read-only source-XCAF assembly leaf browser.
 * Historical exact model intersections remain visible; CAD part names do
 * not authenticate physical manufacturer BOM or replacement compatibility.
 */
const make=(tag,content='')=>{const x=document.createElement(tag);x.textContent=content;return x;};
export function createX500AssemblyHierarchyPanel(){
 const panel=make('details');panel.id='cad-v35-xcaf-hierarchy';panel.hidden=true;
 const heading=make('summary','Inspect named X500 STEP assembly parts and motor replacement evidence');
 const overview=make('p','No source-verified STEP assembly hierarchy loaded.');
 overview.id='cad-v35-overview';
 const warning=make('small','Names and occurrence paths are imported from the STEP file, not an authenticated manufacturer BOM. AIR2216II is a separately supplied candidate motor model; the frame STEP already includes DJ-2216-KV880 motor geometry. Never remove or replace an actual component without OEM revision and hardware evidence.');
 const row=make('div');row.className='cad-v35-controls';
 const searchLabel=make('label','Find original source assembly components');
 const search=make('input');search.type='search';search.placeholder='Try motor, arm, platform, DJ-2216, GB70';
 search.id='cad-v35-search';searchLabel.append(search);
 const selectionLabel=make('label','Source STEP component occurrence');
 const select=make('select');select.id='cad-v35-leaf';selectionLabel.append(select);
 row.append(searchLabel,selectionLabel);
 const path=make('pre');path.className='cad-v35-component-readout';
 const collisionTitle=make('p','Source BREP intersection groups under review');
 const collisions=make('select');collisions.id='cad-v35-collision-choice';
 const collisionDetail=make('pre');collisionDetail.className='cad-v35-component-readout';
 const collisionWarning=make('small','The existing DJ-2216-KV880 source motor accounts for four geometry-distinct modeled collision groups. A replacement study may eventually exclude it from a specially constructed model, but the current report does NOT exclude any solids. Five further groups involving a bracket-like and four fastener-like STEP labels remain.');
 panel.append(heading,overview,warning,row,path,collisionTitle,collisions,collisionDetail,collisionWarning);
 let data=null,leaves=[];
 function renderLeaf(){
  const item=leaves.find(v=>String(v.flatSolidIndex)===select.value);
  path.textContent=item?[
   'Flat original STEP solid index: '+item.flatSolidIndex,
   'Source XCAF component: '+item.sourceComponentName,
   'Source definition: '+item.sourceDefinitionName,
   'Original assembly path:',
   ...item.assemblyPath.map((n,i)=>'  '+('  '.repeat(i))+n),
   'Definition label: '+item.sourceDefinitionLabel,
   'Physical installed-part identity: UNVERIFIED',
   'Motor/fastener replacement approval: NOT GRANTED'
  ].join('\n'):'Select a named original STEP occurrence';
 }
 function updateList(){
  if(!data)return;
  const query=search.value.trim().toLowerCase();
  const previous=select.value;
  select.replaceChildren();
  const found=leaves.filter(x=>!query||
   [x.sourceComponentName,x.sourceDefinitionName,...x.assemblyPath]
    .some(y=>y?.toLowerCase().includes(query)));
  for(const leaf of found.slice(0,244)){
   const option=make('option','#'+leaf.flatSolidIndex+' · '+leaf.assemblyPath.slice(1).join(' > '));
   option.value=String(leaf.flatSolidIndex);select.append(option);
  }
  if(found.some(x=>String(x.flatSolidIndex)===previous))select.value=previous;
  renderLeaf();
 }
 function renderCollision(){
  const entry=data?.namedCollisionGroups.find(x=>
   x.canonicalFrameSolidIndex+':'+x.motorSolidIndex===collisions.value);
  collisionDetail.textContent=entry?[
   'Original frame solid occurrence indexes: '+entry.originalFrameSolidIndices.join(', '),
   'Original STEP component names: '+entry.frameOccurrenceNames.join(' / '),
   'Assembly paths:',...entry.frameAssemblyPaths.map(x=>'  '+x.join(' > ')),
   'Separate candidate motor model solid: '+entry.motorSolidIndex,
   'Maximum modeled BREP overlap: '+entry.conservativeModelOverlapMm3.toFixed(5)+' mm³',
   'Model intersection: '+(entry.modeledCollisionPresent?'PRESENT':'no positive intersection observed'),
   'Physical component presence/BOM: UNVERIFIED',
   'Physical fit: NOT APPROVED'
  ].join('\n'):'Select original collision evidence';
 }
 function setEvidence(review,rawLeaves){
  if(review?.schema!=='aeroforge/x500-xcaf-assembly-browser-review/v3.5'||
   review.authority!=='SOURCE_STEP_COMPONENT_NAMES_NOT_MANUFACTURER_BOM'||
   review.sourceModelInterferenceStillPresent!==true||
   review.actualInstalledPartCountQualified!==false||
   review.physicalFitApproved!==false||
   !Array.isArray(rawLeaves)||rawLeaves.length!==244)
   throw Error('Refusing non-source or OEM-BOM-qualified XCAF assembly report');
  data=review;leaves=rawLeaves.map(x=>({
   flatSolidIndex:x.flatSolidIndex,sourceComponentName:x.sourceComponentName,
   sourceDefinitionName:x.sourceDefinitionName,
   sourceDefinitionLabel:x.sourceDefinitionLabel,assemblyPath:[...x.assemblyPath]
  }));
  panel.hidden=false;search.value='';overview.textContent=
   '111 named top-level STEP occurrences / 244 flattened source leaves. The frame CAD already references DJ-2216-KV880 motor geometry eight times across four coincident spatial pairs. The separate AIR2216II model is not an authenticated drop-in replacement. Thirteen original modeled collision comparisons represent nine distinct source-geometry groups, all still unresolved.';
  collisions.replaceChildren();
  for(const c of review.namedCollisionGroups){
   const option=make('option','#'+c.canonicalFrameSolidIndex+' / motor #'+
    c.motorSolidIndex+' · '+c.frameOccurrenceNames.join('/')+
    (c.modeledCollisionPresent?' · MODEL COLLISION':' · no positive volume'));
   option.value=c.canonicalFrameSolidIndex+':'+c.motorSolidIndex;
   collisions.append(option);
  }
  updateList();renderCollision();
 }
 function reset(){
  data=null;leaves=[];panel.hidden=true;search.value='';
  select.replaceChildren();collisions.replaceChildren();
  overview.textContent='No source-verified STEP assembly hierarchy loaded.';
  path.textContent='';collisionDetail.textContent='';
 }
 search.addEventListener('input',updateList);
 select.addEventListener('change',renderLeaf);
 collisions.addEventListener('change',renderCollision);
 return {panel,setEvidence,reset};
}
