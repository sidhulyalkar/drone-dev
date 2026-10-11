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
