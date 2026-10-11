/**
 * AeroForge v1.2: revision-scoped, local-only assembly session archive.
 * Separate design plans retain independent notes. Not an audit authority.
 */
export const WORKSPACE_SCHEMA='aeroforge/assembly-workspace/v1.2';
const LIMIT=12;
const LIMIT_BYTES=1900000;
function requirePlan(plan){
 if(plan?.schema!=='aeroforge/assembly-plan/v0.8'||typeof plan.key!=='string'||
  !Array.isArray(plan.steps)||!plan.selection)throw Error('Invalid assembly plan');
}
export function planIdentity(plan){
 requirePlan(plan);
 // This is a full structural identity, not the legacy short FNV display key.
 return JSON.stringify([plan.track,plan.videoSystem,plan.variant,plan.selection,
  plan.steps.map(s=>[s.id,s.dependencyKey])]);
}
export function emptyWorkspace(){return{schema:WORKSPACE_SCHEMA,entries:[],updatedAt:null};}
export function readWorkspace(serialized){
 if(serialized==null||serialized==='')return emptyWorkspace();
 if(typeof serialized!=='string'||serialized.length>LIMIT_BYTES)throw Error('Assembly workspace exceeds storage limit');
 let d;try{d=JSON.parse(serialized);}catch{throw Error('Assembly workspace contains invalid JSON');}
 if(d?.schema!==WORKSPACE_SCHEMA||!Array.isArray(d.entries)||d.entries.length>LIMIT)throw Error('Invalid assembly workspace');
 for(const v of d.entries){
  if(!v||typeof v.identity!=='string'||v.identity.length>15000||
   !v.session||v.session.schema!=='aeroforge/assembly-session/v0.8'||
   typeof v.session.planKey!=='string')throw Error('Invalid stored revision entry');
 }
 if(new Set(d.entries.map(v=>v.identity)).size!==d.entries.length)throw Error('Duplicate stored revisions');
 return {schema:WORKSPACE_SCHEMA,entries:d.entries,updatedAt:d.updatedAt??null};
}
export function getStoredSession(workspace,plan){
 requirePlan(plan);
 if(workspace?.schema!==WORKSPACE_SCHEMA)throw Error('Invalid workspace');
 const id=planIdentity(plan),entry=workspace.entries.find(x=>x.identity===id);
 if(!entry)return null;
 if(entry.session.planKey!==plan.key)throw Error('Stored plan key mismatch');
 return structuredClone(entry.session);
}
export function storeSession(workspace,plan,session){
 requirePlan(plan);
 if(workspace?.schema!==WORKSPACE_SCHEMA||!Array.isArray(workspace.entries))throw Error('Invalid workspace');
 if(session?.schema!=='aeroforge/assembly-session/v0.8'||session.planKey!==plan.key)throw Error('Session does not belong to selected plan');
 const identity=planIdentity(plan);
 const prior=workspace.entries.filter(e=>e.identity!==identity);
 const entry={identity,session:structuredClone(session),updatedAt:new Date().toISOString()};
 const entries=[...prior,entry];
 if(entries.length>LIMIT)throw Error('Local archive reached its revision limit. Export all revisions, then clear the archive explicitly.');
 const next={schema:WORKSPACE_SCHEMA,entries,updatedAt:entry.updatedAt};
 if(JSON.stringify(next).length>LIMIT_BYTES)throw Error('Local assembly archive full. Export prior sessions before adding more notes.');
 return next;
}
export function migrateLegacySession(legacyJson,plan){
 requirePlan(plan);
 if(!legacyJson||typeof legacyJson!=='string')return null;
 let old;try{old=JSON.parse(legacyJson);}catch{return null;}
 if(old?.schema!=='aeroforge/assembly-session/v0.8'||old.planKey!==plan.key)return null;
 return old;
}
