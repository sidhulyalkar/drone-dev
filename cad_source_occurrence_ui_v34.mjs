/** v3.4: compact independent source CAD occurrence-reconciliation review.
 * Does not remove original solid nodes, change mating poses or approve fit.
 */
const el=(tag,label='')=>{const x=document.createElement(tag);x.textContent=label;return x;};
export function createX500OccurrenceReviewPanel(){
 const panel=el('details');panel.id='cad-v34-occurrence-review';panel.hidden=true;
 const heading=el('summary','Inspect four coincident CAD occurrence groups and unchanged model collisions');
 const summary=el('p','No original-source occurrence audit verified.');
 summary.id='cad-v34-summary';
 const explanation=el('small','Coincident BREP occurrences can represent repeated CAD instances, exported duplicates or alternate product assembly structures. They are NOT proof of duplicate physical purchased parts. Never remove colliding parts from the real BOM based only on this report.');
 const selector=el('select');selector.id='cad-v34-group-choice';
 const details=el('pre');details.className='cad-v34-report';
 const collision=el('p','All positive original model collisions remain unresolved.');
 const note=el('small','The raw 30 Boolean source-solid comparisons remain unchanged. The nine geometry-distinct collision groups are a supplementary view, not a physical pass or source-assembly reconciliation.');
 panel.append(heading,summary,explanation,selector,details,collision,note);
 let data=null;
 function render(){
  const item=data?.collisionPairs?.find(x=>
   x.canonicalFrameSolidIndex+':'+x.motorSolidIndex===selector.value);
  if(!item){details.textContent='Select an original modeled collision group.';return;}
  details.textContent='Canonical frame geometry #'+item.canonicalFrameSolidIndex+
   '\nMotor solid #'+item.motorSolidIndex+
   '\nOriginal coincident frame occurrences: '+item.originalFrameSolidIndices.join(', ')+
   '\nOriginal Boolean source occurrence comparisons: '+item.originalSourcePairCount+
   '\nConservative maximum modeled intersection: '+item.conservativeModelOverlapMm3.toFixed(6)+' mm³'+
   '\nModeled interference: '+(item.modeledCollisionPresent?'PRESENT':'not positive for this group')+
   '\nActual physical part identity: UNRESOLVED'+
   '\nManufacturing/flight approval: NOT GRANTED';
 }
 function reset(){
  data=null;panel.hidden=true;selector.replaceChildren();
  summary.textContent='No original-source occurrence audit verified.';
  details.textContent='';collision.textContent='All positive original model collisions remain unresolved.';
 }
 function setEvidence(review){
  if(review?.schema!=='aeroforge/x500-source-occurrence-browser-review/v3.4'||
   review.authority!=='REPEATED_CAD_GEOMETRY_NOT_OEM_BOM'||
   review.sourceModelInterferenceRemains!==true||
   review.physicalFitApproved!==false||
   review.actualManufacturerPartMultiplicityVerified!==false||
   review.geometryDistinctPositiveCount!==9)
   throw Error('Source CAD duplicate occurrence audit is not qualified for display');
  data=review;panel.hidden=false;selector.replaceChildren();
  summary.textContent='Source CAD: 244 original solids, 240 distinct geometry groups. '+
   'Thirty raw exact BREP pair tests produced 13 positives; 26 geometry-distinct pair groups retain nine positive modeled collision groups.';
  for(const x of review.collisionPairs){
   const opt=el('option','frame '+x.originalFrameSolidIndices.join('/')+
    ' ↔ motor '+x.motorSolidIndex+(x.modeledCollisionPresent?' · MODEL COLLISION':' · no positive overlap'));
   opt.value=x.canonicalFrameSolidIndex+':'+x.motorSolidIndex;
   selector.append(opt);
  }
  collision.textContent='Nine geometry-distinct positive CAD intersection groups remain. NO physical clearance.';
  render();
 }
 selector.addEventListener('change',render);
 return {panel,reset,setEvidence};
}
