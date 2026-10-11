import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileX500Record} from '../core/x500_record_v14.mjs';
import {INSPECTION_SCHEMA,OBSERVATION_KINDS,INSPECTION_STAGES,startInspectionJournal,
 validateInspectionJournal,reconcileInspectionJournal,appendInspectionObservation,
 appendInspectionReview,inspectionSummary,attachInspectionEvidenceSummary,
 researchInspectionPacket} from '../core/inspection_journal_v22.mjs';

const rec=(variant='six_c',cells=4)=>compileX500Record({variant,batteryCells:cells});
const entry=(kind='received_identity')=>({
 kind,partRef:'x500-esc20',receivedLabel:'ESC case label 20A',hardwareRevision:'board mark v1',
 observer:'Engineer A',observedOn:'2026-10-10',
 notes:'Observed part markings under magnification; source identity has not been authenticated.',
 fileDigest:null,data:kind==='dimensional_measurement'?
  {dimensionName:'Board mount width',valueMm:30.5,instrument:'caliper no calibration certificate'}:
  kind==='connector_observation'?
  {connectorFamily:'XT30',genderObserved:'plug geometry seen',inspectionMethod:'visual loupe'}:
  kind==='cad_mating_hypothesis'?
  {referenceFileSha256:'a'.repeat(64),datumDescription:'Source motor XY mounting plane',
   fitMethod:'Manual alignment of source normals without physical dimensions'}:{}
});
test('journal starts at source-only and never infers electrical, fit or flight qualification',()=>{
 const r=rec(),j=startInspectionJournal(r),s=inspectionSummary(j,r);
 assert.equal(j.schema,INSPECTION_SCHEMA);
 assert.equal(s.stage,'DOCUMENTATION_ONLY');
 assert.equal(s.currentObservations,0);
 assert.equal(s.independentPhysicalQualification,false);
 assert.equal(s.procurementApproved,false);
 assert.equal(s.powerApproved,false);
 assert.equal(s.flightApproved,false);
 assert.ok(INSPECTION_STAGES.includes(s.stage));
});
test('all four observation kinds retain a source-revision-specific unverified receipt',()=>{
 let j=startInspectionJournal(rec());
 for(const kind of OBSERVATION_KINDS)j=appendInspectionObservation(j,rec(),entry(kind));
 assert.equal(j.events.length,4);
 assert.deepEqual(j.events.map(e=>e.id),['evt-0001','evt-0002','evt-0003','evt-0004']);
 assert.ok(j.events.every(e=>e.authority==='SELF_REPORTED_NOT_INDEPENDENTLY_VERIFIED'));
 const out=inspectionSummary(j,rec());
 assert.equal(out.currentObservations,4);
 assert.equal(out.recordedReviews,0);
 assert.equal(out.stage,'RECEIPT_SELF_REPORTED');
 assert.equal(out.flightApproved,false);
 assert.deepEqual(validateInspectionJournal(JSON.parse(JSON.stringify(j))),j);
});
test('unbounded, incomplete or fabricated measurements and hashes are rejected',()=>{
 let j=startInspectionJournal(rec());
 for(const change of [
  x=>x.partRef='not-known',x=>x.observer=' ',x=>x.notes='short',
  x=>x.receivedLabel='',x=>x.hardwareRevision='',x=>x.observedOn='2026-02-30',
  x=>x.fileDigest={fileName:'photo.png',sizeBytes:90,sha256:'not-sha'},
  x=>x.kind='tested-and-certified'
 ]){
  const x=entry();change(x);assert.throws(()=>appendInspectionObservation(j,rec(),x));
 }
 for(const change of [
  x=>x.data.valueMm=Infinity,x=>x.data.valueMm=0,
  x=>x.data.instrument='',x=>x.data.extra='made-up'
 ]){
  const x=entry('dimensional_measurement');change(x);assert.throws(()=>appendInspectionObservation(j,rec(),x));
 }
 const cad=entry('cad_mating_hypothesis');cad.data.referenceFileSha256='invalid';
 assert.throws(()=>appendInspectionObservation(j,rec(),cad),/digest/);
});
test('SHA-256 local file receipt is byte identity, never vendor authentication',()=>{
 const j=appendInspectionObservation(startInspectionJournal(rec()),rec(),{
  ...entry(),fileDigest:{fileName:'housing-photo.jpg',sha256:'f'.repeat(64),sizeBytes:1234}
 });
 assert.equal(j.events[0].payload.fileDigest.sourceAuthenticated,false);
 assert.equal(j.events[0].payload.fileDigest.identityOnly,true);
 assert.equal(j.events[0].payload.fileDigest.sha256,'f'.repeat(64));
});
test('review requires different person and explicit notes; it never authorizes flight',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 assert.throws(()=>appendInspectionReview(j,{observationId:'evt-0001',reviewer:'Engineer A',reviewedOn:'2026-10-11',notes:'Reviewed independent source drawing and noted unknowns.'}),/different named reviewer/);
 assert.throws(()=>appendInspectionReview(j,{observationId:'evt-0001',reviewer:'Engineer B',reviewedOn:'2026-10-09',notes:'Reviewed independent source drawing and noted unknowns.'}),/predate/);
 const reviewed=appendInspectionReview(j,{observationId:'evt-0001',reviewer:'Engineer B',
  reviewedOn:'2026-10-11',notes:'Independently read markings, but wiring and fit remain unverified.'});
 assert.equal(inspectionSummary(reviewed,r).stage,'INDEPENDENT_REVIEW_RECORDED');
 assert.equal(inspectionSummary(reviewed,r).recordedReviews,1);
 assert.equal(inspectionSummary(reviewed,r).flightApproved,false);
 assert.throws(()=>appendInspectionReview(reviewed,{observationId:'evt-0001',reviewer:'C',reviewedOn:'2026-10-11',notes:'I also inspected the item independently.'}),/already/);
 assert.equal(validateInspectionJournal(reviewed).events.length,2);
});
test('a changed aircraft variant invalidates prior observations but retains append-only history and prior reviews',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 const review=appendInspectionReview(j,{observationId:'evt-0001',reviewer:'Engineer B',
  reviewedOn:'2026-10-11',notes:'Checked the case markings separately and recorded unresolved connector verification.'});
 const next=rec('six_x');
 const switched=reconcileInspectionJournal(review,next);
 assert.equal(inspectionSummary(switched,next).stage,'DOCUMENTATION_ONLY');
 assert.equal(inspectionSummary(switched,next).staleObservations,1);
 assert.equal(switched.events.length,2);
 assert.throws(()=>appendInspectionReview(switched,{
  observationId:'evt-0001',reviewer:'Engineer C',reviewedOn:'2026-10-11',
  notes:'Trying to review stale item'}),/stale/);
 const newRevision=appendInspectionObservation(switched,next,{...entry(),partRef:'x500-pm02d'});
 const sum=inspectionSummary(newRevision,next);
 assert.equal(sum.currentObservations,1);
 assert.equal(sum.staleObservations,1);
 assert.equal(sum.recordedReviews,0);
 assert.equal(validateInspectionJournal(JSON.parse(JSON.stringify(newRevision))).events.length,3);
});
test('changing battery series also stales all revision-bound observations',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 const diff=rec('six_c',6),switched=reconcileInspectionJournal(j,diff),s=inspectionSummary(switched,diff);
 assert.equal(s.currentObservations,0);
 assert.equal(s.staleObservations,1);
 assert.equal(s.flightApproved,false);
});
test('import validation rejects rewritten approvals and altered or reordered event payloads',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 const forged=structuredClone(j);forged.events[0].payload.notes='tampered';
 assert.throws(()=>validateInspectionJournal(forged),/checksum mismatch/);
 const reordered=structuredClone(j);reordered.events[0].id='evt-0025';
 assert.throws(()=>validateInspectionJournal(reordered),/IDs/);
 const imported=structuredClone(j);imported.events.push({...j.events[0],id:'evt-0002'});
 assert.throws(()=>validateInspectionJournal(imported),/checksum mismatch/);
 assert.throws(()=>validateInspectionJournal({schema:'not-a-journal'}));
});
test('canonical X500 export can include the journal summary without becoming a qualified machine',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 const combined=attachInspectionEvidenceSummary(r,j);
 assert.equal(combined.inspectionSummary.currentObservations,1);
 assert.equal(combined.procurementApproved,false);
 assert.equal(combined.powerApproved,false);
 assert.equal(combined.flightApproved,false);
 const packet=researchInspectionPacket(j,r);
 assert.equal(packet.journal.schema,INSPECTION_SCHEMA);
 assert.equal(packet.interfaceAuditStatus,'FAMILY_DOCUMENTED_WITH_OPEN_HOLDS');
 assert.equal(packet.purchasingReady,false);
 assert.equal(packet.benchPowerReady,false);
 assert.equal(packet.flightReady,false);
});
test('browser controls, revision request bridge and journal event contract stay wired',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../inspection_ui_v22.mjs',import.meta.url),'utf8');
 const kit=readFileSync(new URL('../kit_ui_v06.mjs',import.meta.url),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const id of ['v22-inspection','v22-form','v22-review-form','v22-summary','v22-export',
  'v22-save','v22-restore','v22-delete-save','v22-import','v22-events','v22-review-id'])
  assert.ok(ids.includes(id),'Missing '+id);
 assert.ok(html.includes('inspection_ui_v22.mjs')&&html.includes('inspection_v22.css'));
 assert.match(ui,/aeroforge:x500-record-requested/);
 assert.match(ui,/aeroforge:inspection-journal-updated/);
 assert.match(ui,/crypto.subtle.digest/);
 assert.match(kit,/attachInspectionEvidenceSummary/);
 assert.match(kit,/aeroforge:inspection-journal-updated/);
});
