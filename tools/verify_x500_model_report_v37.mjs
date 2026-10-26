#!/usr/bin/env node
/** Independently recheck a portable X500 model-only evidence report.
 *
 * Checks SHA-256 of exactly submitted plan/worker bytes and reconstructs the
 * source-redacted report. This does NOT attest STEP access, CAD execution,
 * manufacturer revision, a physical fit, or flight safety.
 */
import {createHash} from 'node:crypto';
import {readFile, lstat} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {buildX500VariantEvidenceReport} from '../core/x500_variant_evidence_report_v37.mjs';

const LIMITS=Object.freeze({plan:2_000_000,receipt:512*1024,report:512*1024});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const decoder=new TextDecoder('utf-8',{fatal:true});
const fail=message=>{throw Error('X500 report verification rejected: '+message);};
const parseBytes=(bytes,label)=>{
 if(!Buffer.isBuffer(bytes)||bytes.length<20||bytes.length>LIMITS[label])
  fail(label+' file must be a bounded byte buffer');
 try{
  const parsed=JSON.parse(decoder.decode(bytes));
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))
   fail(label+' must contain a JSON object');
  return parsed;
 }catch(err){
  fail(label+' must contain valid UTF-8 JSON: '+String(err.message));
 }
};

/** Reports exactly what three supplied files agree on, not what really ran. */
export function verifySubmittedX500ModelReport({planBytes,receiptBytes,reportBytes}){
 const plan=parseBytes(planBytes,'plan');
 const receipt=parseBytes(receiptBytes,'receipt');
 parseBytes(reportBytes,'report');
 const planSha=hash(planBytes),receiptSha=hash(receiptBytes);
 const expected=buildX500VariantEvidenceReport(plan,receipt,planSha,receiptSha);
 // Browser always exports this exact canonical representation. Byte equality
 // rejects trailing unseen fields, duplicated report keys and post-export edits.
 const canonical=JSON.stringify(expected,null,2)+'\n';
 if(!Buffer.from(canonical,'utf8').equals(reportBytes))
  fail('Report bytes differ from the deterministic result of rechecking the plan and worker receipt');
 return Object.freeze({
  status:'CONSISTENT_SUBMITTED_RECEIPT_NOT_SOURCE_ATTESTATION',
  planSha256:planSha,
  workerReceiptSha256:receiptSha,
  sourceExecutionIndependentlyAttested:false,
  independentlyReproduced:false,
  physicalFitApproved:false,
  procurementApproved:false,
  powerApproved:false,
  flightApproved:false,
  modeledStatus:expected.modelAssessment.result,
  plannedPairs:expected.coverage.plannedPairs,
  recordedPairs:expected.coverage.recordedPairs,
  unexecutedPairs:expected.coverage.unexecutedPairs,
  ambiguousOrContactPairs:expected.coverage.ambiguousOrContactPairs
 });
}

async function readBounded(path,label){
 const stat=await lstat(path);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<20||stat.size>LIMITS[label])
  fail(label+' input must be a non-symlink regular file within its size limit');
 return readFile(path);
}

async function main(args){
 if(args.length!==6||args[0]!=='--plan'||args[2]!=='--receipt'||args[4]!=='--report')
  fail('Usage: node tools/verify_x500_model_report_v37.mjs --plan PLAN.json --receipt WORKER.json --report REPORT.json');
 const [planBytes,receiptBytes,reportBytes]=await Promise.all([
  readBounded(args[1],'plan'),readBounded(args[3],'receipt'),readBounded(args[5],'report')
 ]);
 const summary=verifySubmittedX500ModelReport({planBytes,receiptBytes,reportBytes});
 process.stdout.write(JSON.stringify(summary,null,2)+'\n');
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 main(process.argv.slice(2)).catch(error=>{
  process.stderr.write(String(error.message||error)+'\n');
  process.exitCode=1;
 });
}
