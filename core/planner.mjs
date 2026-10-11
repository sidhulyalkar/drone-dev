import {presets} from './presets.mjs';
import {evaluate} from './engine.mjs';
const missionSuitability={
 freestyle:{pocket:.70,cine:.32,micro:.76,freestyle:1,endurance:.52,research:.20},
 cinematic:{pocket:.55,cine:1,micro:.71,freestyle:.62,endurance:.82,research:.65},
 explore:{pocket:.52,cine:.50,micro:.82,freestyle:.56,endurance:1,research:.88},
 research:{pocket:.25,cine:.48,micro:.58,freestyle:.20,endurance:.78,research:1}
};
export function normalizeBrief(brief={}){
 const mission=Object.hasOwn(missionSuitability,brief.mission)?brief.mission:'explore';
 const budgetUSD=Number(brief.budgetUSD);
 const payloadG=Number(brief.payloadG);
 const priority=['balanced','cost','endurance','agility'].includes(brief.priority)?brief.priority:'balanced';
 return {mission,budgetUSD:Number.isFinite(budgetUSD)?Math.max(0,Math.min(5000,budgetUSD)):800,
  payloadG:Number.isFinite(payloadG)?Math.max(0,Math.min(400,payloadG)):0,priority};
}
export function planCandidates(brief){
 const p=normalizeBrief(brief);
 const all=presets.map(preset=>{
  const settings={...preset.settings,mission:p.mission,payload:p.payloadG,
   groundKit:preset.settings.video==='research'?'research':preset.settings.video==='digital'?'digital':'analog'};
  const result=evaluate(settings),m=result.metrics;
  const base=missionSuitability[p.mission][preset.id];
  const budgetGap=Math.max(0,m.startupUSD-p.budgetUSD);
  const budgetScore=p.budgetUSD>0?Math.min(1,p.budgetUSD/Math.max(1,m.startupUSD)):0;
  const flightScore=Math.min(1,m.flightMin/20);
  const agilityScore=Math.min(1,m.thrustRatio/5.3)*Math.min(1,650/Math.max(m.massG,1));
  const goalScore=p.priority==='endurance'?flightScore:p.priority==='agility'?agilityScore:p.priority==='cost'?budgetScore:(.4*flightScore+.3*agilityScore+.3*budgetScore);
  const blockerPenalty=result.blockers.length?50:0;
  const score=Math.round(100*(.63*base+.37*goalScore)-Math.min(28,28*budgetGap/Math.max(1,p.budgetUSD))-blockerPenalty);
  const shortfalls=[];
  if(result.blockers.length)shortfalls.push(`${result.blockers.length} airframe compatibility blocker(s)`);
  if(budgetGap>0)shortfalls.push(`$${Math.round(budgetGap)} over stated startup budget`);
  if(p.payloadG>0)shortfalls.push('Custom payload mounting and CG not verified');
  if(!shortfalls.length)shortfalls.push('No modeled budget/compatibility shortfall; hardware evidence still missing');
  const strengths=[];
  if(base>=.8)strengths.push('Strong mission architecture match');
  if(m.startupUSD<=p.budgetUSD)strengths.push('Within illustrative startup budget');
  if(m.flightMin>=13)strengths.push('Higher illustrative endurance');
  if(m.thrustRatio>=5)strengths.push('High nominal maneuvering thrust reserve');
  return {presetId:preset.id,name:preset.name,tagline:preset.tagline,settings,score:Math.max(0,Math.min(100,score)),result,strengths,shortfalls};
 }).sort((a,b)=>b.score-a.score||a.result.metrics.startupUSD-b.result.metrics.startupUSD);
 // Favor distinct vehicle classes and ensure the 3 candidate results can be compared fairly.
 return {brief:p,candidates:all.slice(0,3),all,engine:'deterministic planning heuristic v0.2',note:'Scores compare illustrative mission fit and budget; not airworthiness or tested flight performance.'};
}
