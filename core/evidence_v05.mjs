/** Records source provenance without granting the evidence or its claims authority. */
const isHex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/i.test(s);
export function validateEvidenceRecord(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Evidence record must be object');
 for(const field of ['id','subject','claim','sourceUrl','sourceRevision','method','artifactName','license','sha256'])if(typeof value[field]!=='string'||!value[field].trim()||value[field].length>1200)throw Error(`Invalid evidence ${field}`);
 if(!isHex(value.sha256))throw Error('Evidence SHA-256 must be 64 hex digits');
 if(!/^https:\/\//.test(value.sourceUrl))throw Error('Source URL must be HTTPS');
 if(!['source-document','cad-drawing','bench-measurement','manual-inspection'].includes(value.kind))throw Error('Unknown evidence kind');
 if(value.verified===true)throw Error('Capture alone cannot mark a record verified');
 return {schema:'aeroforge/evidence-record/v0.5',...value,verified:false};
}
export function summarizeEvidence(records=[]){
 if(!Array.isArray(records))throw Error('Records must be an array');
 const result=[];const seen=new Set();
 for(const r of records){const v=validateEvidenceRecord(r);if(seen.has(v.id))throw Error(`Repeated evidence ID: ${v.id}`);seen.add(v.id);result.push(v);}
 return {schema:'aeroforge/evidence-ledger/v0.5',entries:result,acceptedFileHashes:result.map(x=>x.sha256),independentInspectionComplete:false};
}
