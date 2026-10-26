/** Enumerate exactly 24 source-native signed axis permutations with determinant +1.
 * These are viewing/registration hypotheses, not observed shaft or mounting axes.
 */
import {signedAxisMatrix} from './registration_v15.mjs';
const letters=['X','Y','Z'];
const perms=[['X','Y','Z'],['X','Z','Y'],['Y','X','Z'],['Y','Z','X'],['Z','X','Y'],['Z','Y','X']];
export function x500RightHandedAxisOptions(){
 const options=[];
 for(const p of perms)for(const sx of ['+','-'])for(const sy of ['+','-'])for(const sz of ['+','-']){
  const tokens=[sx+p[0],sy+p[1],sz+p[2]];
  try{signedAxisMatrix(tokens);options.push({
   value:tokens.join(','),tokens,
   label:'Frame X,Y,Z ← motor '+tokens.join(', '),
   source:'UNQUALIFIED_OPERATOR_ROTATION_OPTION'
  });}catch{/* proper reflections deliberately excluded */}
 }
 if(options.length!==24||new Set(options.map(x=>x.value)).size!==24)
  throw Error('Incorrect signed axis permutation set');
 return options;
}
