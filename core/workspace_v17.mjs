/** AeroForge v1.7 / stable workspace classification and URL resolution. */
export const WORKSPACES=Object.freeze(['explore','build','engineering']);
const EXPLORE_IDS=new Set(['mission-planner','mission-v09','mission-v10']);
const BUILD_IDS=new Set(['showcase-v07','assembly-v08']);
const EXPLORE_CLASSES=new Set(['intro','planner-section','preset-section','workspace']);
export function workspaceForRoot(id='',classes=[]){
 if(EXPLORE_IDS.has(id)||classes.some(c=>EXPLORE_CLASSES.has(c)))return 'explore';
 if(BUILD_IDS.has(id))return 'build';
 return 'engineering';
}
export function selectWorkspaceFromLocation({hash='',view=''}={}){
 const normalizedHash=hash.replace(/^#/,'');
 if(normalizedHash.startsWith('af-workspace-')){
  const chosen=normalizedHash.slice('af-workspace-'.length);
  if(WORKSPACES.includes(chosen))return chosen;
 }
 if(WORKSPACES.includes(view))return view;
 return 'explore';
}
/** Never infer a qualified engineering state from current workspace. */
export const NAVIGATION_AUTHORITY='PRESENTATION_ONLY_DOES_NOT_CHANGE_EVIDENCE';
