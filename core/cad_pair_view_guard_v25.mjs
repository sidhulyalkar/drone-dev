/**
 * Second integrity check at the renderer boundary. Verified browser inputs
 * must still match the fingerprints of the specific proposed placement.
 * A digest proves only local byte identity, not vendor provenance or safe fit.
 */
import {inspectGlbHeader,sha256Bytes} from './cad_package_v13.mjs';
const SHA=/^[0-9a-f]{64}$/;
export async function verifyCadPairViewerAssets(frameBytes,motorBytes,proposal){
 if(proposal?.schema!=='aeroforge/x500-cad-mating-proposal/v2.4'||
  proposal?.independentlyQualified!==false||
  proposal?.mechanicalFitApproved!==false||
  proposal?.powerApproved!==false||proposal?.flightApproved!==false||
  !SHA.test(proposal?.frame?.meshSha256)||!SHA.test(proposal?.motor?.meshSha256))
  throw Error('Unqualified, source-bound CAD pairing required');
 const frameHeader=inspectGlbHeader(frameBytes);
 const motorHeader=inspectGlbHeader(motorBytes);
 const [frameSha,motorSha]=await Promise.all([sha256Bytes(frameBytes),sha256Bytes(motorBytes)]);
 if(frameSha!==proposal.frame.meshSha256)throw Error('Frame GLB bytes changed after local intake');
 if(motorSha!==proposal.motor.meshSha256)throw Error('Motor GLB bytes changed after local intake');
 return {sourceStatus:'BOTH_LOCAL_GLB_DIGESTS_MATCH_RESEARCH_RECEIPT',
  frameMeshCount:frameHeader.meshCount,motorMeshCount:motorHeader.meshCount,
  manufacturerAuthenticated:false,mechanicalFitApproved:false,flightApproved:false};
}
