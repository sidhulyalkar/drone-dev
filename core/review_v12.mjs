/**
 * AeroForge v1.2 / strict binding of dimensional results to exactly inspected inputs.
 * Neither a file digest nor a user-entered measurement is a safety/flight authority.
 */
import {normalizeDimensionalInput,evaluateDimensionalInput} from './dimensional_v11.mjs';
export const REVIEW_SCHEMA='aeroforge/dimensional-review/v1.2';
export const HASH_ORIGINS=Object.freeze({
 NONE:'NO_HASH',
 LOCAL:'LOCAL_BYTES_HASHED_UNAUTHENTICATED',
 CLAIM:'IMPORTED_HASH_CLAIM_UNVERIFIED'
});
export function newReviewState(){
 return {schema:'aeroforge/dimensional-review-state/v1.2',revision:0,phase:'NOT_INSPECTED',bound:null};
}
function requireState(state){
 if(state?.schema!=='aeroforge/dimensional-review-state/v1.2'||
 !Number.isSafeInteger(state.revision)||state.revision<0)throw Error('Invalid inspection review state');
}
export function invalidateReview(state,reason='INPUT_CHANGED'){
 requireState(state);
 if(typeof reason!=='string'||reason.length>120)throw Error('Invalid invalidation reason');
 return {schema:state.schema,revision:state.revision+1,phase:'STALE_REINSPECTION_REQUIRED',bound:null,reason};
}
function validateProof(proof,normalized){
 if(!Object.values(HASH_ORIGINS).includes(proof))throw Error('Unknown source hash origin');
 if(normalized.source.sha256==null&&proof!==HASH_ORIGINS.NONE)throw Error('Cannot claim a file hash without a SHA-256 value');
 if(normalized.source.sha256!==null&&proof===HASH_ORIGINS.NONE)throw Error('Cannot omit source-hash origin when a digest is present');
 return proof;
}
function canonical(input){
 // All inputs must pass the strict dimensional schema before they can be compared.
 return JSON.stringify(normalizeDimensionalInput(input));
}
export function bindInspection(state,input,proof=HASH_ORIGINS.NONE){
 requireState(state);
 const normalized=normalizeDimensionalInput(input);
 validateProof(proof,normalized);
 const evaluated=evaluateDimensionalInput(normalized);
 return {...state,phase:'CURRENT_UNVERIFIED_RESULT',reason:null,bound:{
  revision:state.revision,canonical:JSON.stringify(normalized),
  evaluation:evaluated,
  sourceHashOrigin:proof,
  sourceAuthenticated:false,
  independentMeasurementsVerified:false,
  physicalInspectionVerified:false,
  createdAt:new Date().toISOString()
 }};
}
export function getCurrentReview(state,formInput){
 requireState(state);
 if(state.phase!=='CURRENT_UNVERIFIED_RESULT'||!state.bound)throw Error('Inspection is stale or not yet run. Reinspect before exporting.');
 if(state.bound.revision!==state.revision)throw Error('Inspection revision mismatch; reinspection required.');
 if(canonical(formInput)!==state.bound.canonical)throw Error('Form differs from the last inspected snapshot; reinspection required.');
 return state.bound;
}
export function exportReviewPacket(state,formInput){
 const bound=getCurrentReview(state,formInput);
 return {
  schema:REVIEW_SCHEMA,
  inspectedAt:bound.createdAt,
  localReviewRevision:bound.revision,
  sourceHashOrigin:bound.sourceHashOrigin,
  sourceAuthenticated:false,
  manufacturerCadImported:false,
  independentMeasurementsVerified:false,
  physicalInspectionVerified:false,
  qualifiedForConstruction:false,
  qualifiedForFlight:false,
  inspection:bound.evaluation.design,
  evaluation:bound.evaluation,
  note:'The attached SHA-256, if any, identifies user-selected or user-claimed bytes only. It does not authenticate manufacturer source. Snapshot validity is checked against the local form before export.'
 };
}
export function importReviewMeasurements(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid geometry import');
 const candidate=value.schema===REVIEW_SCHEMA?value.inspection:
  value.schema==='aeroforge/dimensional-evaluation/v1.1'?value.design:value;
 const cleaned=normalizeDimensionalInput(candidate);
 // No import, regardless of signed/unsigned labels, can claim locally hashed or manufacturer-authenticated provenance.
 return {input:cleaned,sourceHashOrigin:cleaned.source.sha256===null?HASH_ORIGINS.NONE:HASH_ORIGINS.CLAIM,
  importedDocumentUntrusted:true};
}
