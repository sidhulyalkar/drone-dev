import test from 'node:test';
import assert from 'node:assert/strict';
import {compileX500Record} from '../core/x500_record_v14.mjs';
import {startInspectionJournal,appendInspectionObservation,reconcileInspectionJournal} from '../core/inspection_journal_v22.mjs';
import {startInterfaceEvidenceLinks,appendInterfaceEvidenceLink,reconcileInterfaceEvidenceLinks,interfaceEvidenceMatrix,validateInterfaceEvidenceLinks} from '../core/interface_evidence_v23.mjs';
const rec=(variant='six_c')=>compileX500Record({variant,batteryCells:4});
const entry=(partRef='x500-esc20')=>({kind:'connector_observation',partRef,
 receivedLabel:'20A ESC inspected',hardwareRevision:'observed batch mark A',
 observer:'Inspector A',observedOn:'2026-10-11',
 notes:'MR30 connector shape observed visually; no electrical verification completed.',
 fileDigest:null,data:{connectorFamily:'MR30',genderObserved:'visual only',inspectionMethod:'loupe'}});
test('matrix contains individual holds and never claims qualification',()=>{
 const r=rec(),m=interfaceEvidenceMatrix(startInterfaceEvidenceLinks(r),startInspectionJournal(r),r);
 assert.equal(m.totalChecks,18);
 assert.equal(m.checksWithReceipts,0);
 assert.equal(m.flightApproved,false);
 assert.ok(m.edges.some(e=>e.edgeId==='motor-esc'));
});
test('link exact observation to precise check, not arbitrary edge or part',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 const initial=startInterfaceEvidenceLinks(r);
 assert.throws(()=>appendInterfaceEvidenceLink(initial,j,r,{observationId:'evt-0001',edgeId:'frame-motor',checkIndex:0,rationale:'Unrelated ESC observation'}),/not on selected interface/);
 const args={observationId:'evt-0001',edgeId:'motor-esc',checkIndex:0,rationale:'Visible MR30 plug is relevant but polarity remains unknown.'};
 const linked=appendInterfaceEvidenceLink(initial,j,r,args);
 const m=interfaceEvidenceMatrix(linked,j,r);
 assert.equal(m.checksWithReceipts,1);
 assert.equal(m.unqualifiedChecks,m.totalChecks);
 assert.equal(m.edges.find(e=>e.edgeId==='motor-esc').checks[0].status,'EVIDENCE_RECORDED_NOT_VERIFIED');
 assert.throws(()=>appendInterfaceEvidenceLink(linked,j,r,args),/already linked/);
 assert.deepEqual(validateInterfaceEvidenceLinks(JSON.parse(JSON.stringify(linked))),linked);
});
test('changed controller variant stales links and never auto-requalifies',()=>{
 const old=rec(),fresh=rec('six_x');
 const j=appendInspectionObservation(startInspectionJournal(old),old,entry());
 const links=appendInterfaceEvidenceLink(startInterfaceEvidenceLinks(old),j,old,
  {observationId:'evt-0001',edgeId:'motor-esc',checkIndex:0,rationale:'Visual label and plug may inform this check.'});
 const m=interfaceEvidenceMatrix(reconcileInterfaceEvidenceLinks(links,fresh),reconcileInspectionJournal(j,fresh),fresh);
 assert.equal(m.checksWithReceipts,0);
 assert.equal(m.edges.find(e=>e.edgeId==='motor-esc').checks[0].links[0].status,'STALE_OR_INVALID_EVIDENCE');
 assert.equal(m.powerApproved,false);
});
test('import rejects false approval and malformed links',()=>{
 const r=rec(),l=startInterfaceEvidenceLinks(r);
 assert.throws(()=>validateInterfaceEvidenceLinks({...l,flightApproved:true}),/Invalid interface evidence ledger/);
 assert.throws(()=>validateInterfaceEvidenceLinks({...l,links:[{id:'evil'}]}),/Malformed/);
});

test('legacy v2.3 associations remain importable but no longer count without a requirement snapshot',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 const args={observationId:'evt-0001',edgeId:'motor-esc',checkIndex:0,
  rationale:'Inspection photographs identify a phase connector family only.'};
 const current=appendInterfaceEvidenceLink(startInterfaceEvidenceLinks(r),j,r,args);
 const legacy=structuredClone(current);
 delete legacy.links[0].requirementSnapshot;
 delete legacy.links[0].edgeSignature;
 assert.doesNotThrow(()=>validateInterfaceEvidenceLinks(legacy));
 const stale=interfaceEvidenceMatrix(legacy,j,r);
 assert.equal(stale.checksWithReceipts,0);
 assert.equal(stale.edges.find(x=>x.edgeId==='motor-esc').checks[0].links[0].status,
  'LEGACY_CHECK_BINDING_REQUIRED');
 const rebound=appendInterfaceEvidenceLink(legacy,j,r,args);
 assert.equal(interfaceEvidenceMatrix(rebound,j,r).checksWithReceipts,1);
 assert.equal(rebound.links.length,2);
 assert.equal(rebound.links[1].requirementSnapshot,
  stale.edges.find(x=>x.edgeId==='motor-esc').checks[0].requirement);
});
test('changed check wording or edge endpoints invalidate old link without losing audit trail',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 const args={observationId:'evt-0001',edgeId:'motor-esc',checkIndex:0,
  rationale:'A visual connector comparison remains self-reported and untested.'};
 const original=appendInterfaceEvidenceLink(startInterfaceEvidenceLinks(r),j,r,args);
 assert.equal(interfaceEvidenceMatrix(original,j,r).checksWithReceipts,1);
 for(const change of [
  x=>x.links[0].requirementSnapshot='Hypothetical source requirement that is no longer used',
  x=>x.links[0].edgeSignature='motor-drive:x500-esc20|x500-frame'
 ]){
  const historical=structuredClone(original);change(historical);
  const m=interfaceEvidenceMatrix(historical,j,r);
  assert.equal(m.checksWithReceipts,0);
  assert.equal(m.edges.find(x=>x.edgeId==='motor-esc').checks[0].links[0].status,
   'CHECK_DEFINITION_CHANGED');
  const rebound=appendInterfaceEvidenceLink(historical,j,r,args);
  assert.equal(interfaceEvidenceMatrix(rebound,j,r).checksWithReceipts,1);
 }
});
test('malformed half-snapshot cannot be imported as linked evidence',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 const links=appendInterfaceEvidenceLink(startInterfaceEvidenceLinks(r),j,r,
  {observationId:'evt-0001',edgeId:'motor-esc',checkIndex:0,
   rationale:'The MR30 visual observation is only a family-level hypothesis.'});
 const forged=structuredClone(links);delete forged.links[0].edgeSignature;
 assert.throws(()=>validateInterfaceEvidenceLinks(forged),/definition snapshot/);
});

test('journal replacement with a different evt-0001 payload cannot inherit an old evidence link',()=>{
 const r=rec(),base=startInspectionJournal(r);
 const a=appendInspectionObservation(base,r,entry());
 const alternate=entry();alternate.notes='An entirely different connector observation in another journal export.';
 const b=appendInspectionObservation(base,r,alternate);
 assert.equal(a.events[0].id,b.events[0].id);
 assert.notEqual(a.events[0].integrityChecksum,b.events[0].integrityChecksum);
 const args={observationId:'evt-0001',edgeId:'motor-esc',checkIndex:0,
  rationale:'Visual connector observation was recorded on this specific inspection event.'};
 const linked=appendInterfaceEvidenceLink(startInterfaceEvidenceLinks(r),a,r,args);
 assert.equal(interfaceEvidenceMatrix(linked,a,r).checksWithReceipts,1);
 const replaced=interfaceEvidenceMatrix(linked,b,r);
 assert.equal(replaced.checksWithReceipts,0);
 assert.equal(replaced.edges.find(x=>x.edgeId==='motor-esc').checks[0].links[0].status,
  'RECEIPT_CHANGED_OR_REPLACED');
 const rebound=appendInterfaceEvidenceLink(linked,b,r,args);
 assert.equal(interfaceEvidenceMatrix(rebound,b,r).checksWithReceipts,1);
});
test('earlier definition-bound exports lacking a receipt checksum become historical only',()=>{
 const r=rec(),j=appendInspectionObservation(startInspectionJournal(r),r,entry());
 const args={observationId:'evt-0001',edgeId:'motor-esc',checkIndex:0,
  rationale:'This inspection is associated with one explicit connector observation.'};
 const links=appendInterfaceEvidenceLink(startInterfaceEvidenceLinks(r),j,r,args);
 assert.match(links.links[0].observationChecksum,/^[a-f0-9]{16}$/);
 const legacy=structuredClone(links);
 delete legacy.links[0].observationChecksum;
 assert.doesNotThrow(()=>validateInterfaceEvidenceLinks(legacy));
 const matrix=interfaceEvidenceMatrix(legacy,j,r);
 assert.equal(matrix.checksWithReceipts,0);
 assert.equal(matrix.edges.find(x=>x.edgeId==='motor-esc').checks[0].links[0].status,
  'LEGACY_RECEIPT_BINDING_REQUIRED');
 assert.equal(interfaceEvidenceMatrix(appendInterfaceEvidenceLink(legacy,j,r,args),j,r).checksWithReceipts,1);
});
