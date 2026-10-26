#!/usr/bin/env python3
"""v3.4: source-bound original X500 frame duplicate-BREP occurrence audit.

Two source occurrences can have identical BREP geometry but not establish one
physical purchased component. Keep EVERY original Boolean result immutable.
CadQuery, OCP, scipy are required for the real-source audit, not general CI.
"""
import argparse
from collections import defaultdict
import hashlib
import json
import math
from pathlib import Path

SCHEMA='aeroforge/x500-source-occurrence-reconciliation/v3.4'
FRAME_SHA='e7ccd422cf7825b61ad8270a98d8fbbbc12aced102cc6a20ed17ee66b816c360'
MOTOR_SHA='ba0e6e416a249a3e320ecef0370d401d854ea23bd7efd6719711de8c81e22e15'
SURVEY_SCHEMA='aeroforge/x500-source-contact-hypotheses/v3.3'
BOOLEAN_SCHEMA='aeroforge/x500-bounded-boolean-probe/v3.3'
TOLERANCE_MM=1e-6

def need(valid,message):
    if not valid:raise ValueError(message)
def sha(path):
    with Path(path).open('rb') as source:
        return hashlib.file_digest(source,'sha256').hexdigest()
def document(path,limit=3_000_000):
    p=Path(path)
    need(p.is_file() and not p.is_symlink() and p.stat().st_size<=limit,
         'Missing or oversized original source report')
    return json.loads(p.read_bytes())
def require_original_frame(path):
    p=Path(path)
    need(p.is_file() and not p.is_symlink() and p.name=='x500v2-frame.step'
         and p.stat().st_size<=120_000_000 and sha(p)==FRAME_SHA,
         'Exact original operator-acquired frame STEP bytes required')
def placed_transform(sh):
    t=sh.wrapped.Location().Transformation()
    return tuple(t.Value(i,j) for i in range(1,4) for j in range(1,5))
def placed_vertices(sh):
    return [v.toTuple() for v in sh.Vertices()]
def max_symmetric_nearest_vertex_distance(a,b):
    # Spatial nearest neighbors avoid false mismatches caused by the
    # lexicographic reordering of symmetric vertices after a 1e-11mm shift.
    from scipy.spatial import cKDTree
    va,vb=placed_vertices(a),placed_vertices(b)
    if not va or len(va)!=len(vb):return None
    return max(max(cKDTree(vb).query(va,k=1)[0]),
               max(cKDTree(va).query(vb,k=1)[0])),len(va)
def same_placed_geometry(a,b,eps=TOLERANCE_MM):
    if not a.wrapped.IsPartner(b.wrapped) or a.wrapped.Orientation()!=b.wrapped.Orientation():
        return None
    transform_delta=max(abs(x-y) for x,y in zip(placed_transform(a),placed_transform(b)))
    if transform_delta>eps:return None
    nearest=max_symmetric_nearest_vertex_distance(a,b)
    if nearest is None or nearest[0]>eps:return None
    bounds=[]
    for shape in (a,b):
        bb=shape.BoundingBox()
        bounds.append((bb.xmin,bb.ymin,bb.zmin,bb.xmax,bb.ymax,bb.zmax))
    box_delta=max(abs(x-y) for x,y in zip(*bounds))
    if box_delta>eps:return None
    return {'maxLocationMatrixDelta':round(transform_delta,12),
            'maxVertexCoordinateDeltaMm':round(nearest[0],12),
            'maxAabbCoordinateDeltaMm':round(box_delta,12),
            'vertexCount':nearest[1]}
def import_original_frame(path):
    require_original_frame(path)
    import cadquery as cq
    imported=cq.importers.importStep(str(path))
    solids=[]
    for obj in imported.objects:
        children=list(obj.Solids());solids.extend(children if children else [obj])
    need(len(solids)==244,'Original 244-frame-solid source structure changed')
    return solids
def classify_frame_source_occurrences(solids):
    need(len(solids)==244,'Full original frame-solid inventory required')
    parent=list(range(244));witness=[]
    def find(i):
        while parent[i]!=i:
            parent[i]=parent[parent[i]];i=parent[i]
        return i
    for i in range(244):
        for j in range(i+1,244):
            proof=same_placed_geometry(solids[i],solids[j])
            if proof is not None:
                parent[find(j)]=find(i)
                witness.append({'firstSolidIndex':i,'secondSolidIndex':j,**proof})
    groups=defaultdict(list)
    for i in range(244):groups[find(i)].append(i)
    dupl=[{'canonicalSourceSolidIndex':min(g),
           'coincidentSourceSolidIndices':sorted(g),
           'samePhysicalPartConfirmed':False,'sourceOnlyDuplicateGeometry':True}
          for g in groups.values() if len(g)>1]
    dupl.sort(key=lambda x:x['canonicalSourceSolidIndex'])
    return groups,dupl,witness,{i:min(groups[find(i)]) for i in range(244)}
def validate_original_collision(survey_path,boolean_path):
    survey=document(survey_path);batch=document(boolean_path)
    need(survey.get('schema')==SURVEY_SCHEMA and batch.get('schema')==BOOLEAN_SCHEMA and
         survey.get('source',{}).get('frameStepSha256')==FRAME_SHA and
         survey.get('source',{}).get('motorStepSha256')==MOTOR_SHA and
         batch.get('frameStepSha256')==FRAME_SHA and
         batch.get('motorStepSha256')==MOTOR_SHA and
         batch.get('surveySha256')==sha(survey_path),
         'Original source survey and exact Boolean file-byte provenance failed')
    for flag in ('physicalFitApproved','procurementApproved','powerApproved','flightApproved'):
        need(survey.get(flag) is False,'Survey physical authority was elevated')
    for flag in ('mechanicalFitApproved','procurementApproved','powerApproved','flightApproved'):
        need(batch.get(flag) is False,'Bounded Boolean batch physical authority was elevated')
    result=batch.get('result',{});worker=result.get('workerResult',{})
    need(result.get('status')=='MODEL_ONLY_BREP_BOOLEAN_REPORTED' and
         result.get('physicalFitApproved') is False and
         worker.get('status')=='MODEL_ONLY_ALL_AABB_CANDIDATE_PAIRS_EVALUATED' and
         worker.get('manufactureOrPhysicalFitApproved') is False and
         worker.get('fullAircraftAssemblyQualified') is False,
         'Incomplete, timed out or falsely approved original BREP batch')
    pose=next((h for h in survey.get('hypotheses',[])
               if h['id']==batch.get('hypothesisId')),None)
    need(pose is not None and pose.get('exactBrepBooleanStatus')=='NOT_RUN',
         'Unrecognized original source pose')
    candidates={(x['frameSolidIndex'],x['motorSolidIndex'])
                for x in pose['broadPhaseAabbPairs']}
    pairs=worker.get('pairs',[])
    need(len(candidates)==len(pairs)==worker.get('pairCount')==worker.get('evaluatedCount'),
         'All original source AABB-positive pairs must be present')
    seen=set()
    for p in pairs:
        key=(p['frameSolidIndex'],p['motorSolidIndex'])
        value=p.get('modelIntersectionVolumeMm3')
        need(key in candidates and key not in seen and
             isinstance(value,(int,float)) and math.isfinite(value) and value>=0 and
             p.get('sourceModelPositiveOverlap')==(value>.0001),
             'Duplicate, incomplete or contradictory source collision evidence')
        seen.add(key)
    need(sum(p['sourceModelPositiveOverlap'] for p in pairs)==
         worker.get('sourceModelPositiveOverlapPairCount') and
         abs(max(p['modelIntersectionVolumeMm3'] for p in pairs)-
             worker.get('maxPositiveOverlapMm3'))<.00001,
         'Source collision summary does not agree with all raw pairs')
    return survey,batch,pairs
def reconcile(frame_step,survey_path,boolean_path):
    solids=import_original_frame(frame_step)
    survey,batch,pairs=validate_original_collision(survey_path,boolean_path)
    groups,dupl,witness,canonical=classify_frame_source_occurrences(solids)
    by_key=defaultdict(list)
    for pair in pairs:
        by_key[(canonical[pair['frameSolidIndex']],pair['motorSolidIndex'])].append(pair)
    rows=[]
    for (frame,motor),subset in sorted(by_key.items()):
        values=[p['modelIntersectionVolumeMm3'] for p in subset]
        rows.append({
            'canonicalFrameSolidIndex':frame,'motorSolidIndex':motor,
            'originalFrameSolidIndices':sorted(p['frameSolidIndex'] for p in subset),
            'sourceOccurrenceCount':len(subset),
            'minReportedModelIntersectionMm3':round(min(values),8),
            'maxReportedModelIntersectionMm3':round(max(values),8),
            'modelVolumeSpreadMm3':round(max(values)-min(values),8),
            'possibleModelCollision':any(p['sourceModelPositiveOverlap'] for p in subset),
            'physicalPartMultiplicityKnown':False
        })
    return {'schema':SCHEMA,
      'source':{'frameStepSha256':FRAME_SHA,'motorStepSha256':MOTOR_SHA,
         'v33SurveyByteSha256':sha(survey_path),
         'v33BooleanByteSha256':sha(boolean_path),
         'frameImportedSolidCount':244,'motorImportedSolidCount':4},
      'duplicateOccurrenceMethod':'BREP_SHARED_TSHAPE_AND_SAME_ORIENTATION_AND_1E-6MM_LOCATION_NEAREST_VERTEX_AABB',
      'coincidenceToleranceMm':TOLERANCE_MM,
      'duplicateGroups':dupl,'sourceInstanceCoincidenceWitnesses':witness,
      'geometryDistinctOriginalSolidCount':len(groups),'originalFrameSolidCount':244,
      'unresolvedOEMPhysicalPartMultiplicity':True,
      'sourceModelRawPairCount':len(pairs),
      'sourceModelRawPositiveOverlapCount':sum(p['sourceModelPositiveOverlap'] for p in pairs),
      'geometryCanonicalPairCount':len(rows),
      'geometryCanonicalPositiveOverlapCount':sum(row['possibleModelCollision'] for row in rows),
      'geometryCanonicalCollisionPairs':rows,'hypothesisId':batch['hypothesisId'],
      'allModelCollisionsResolved':False,'bomHierarchyVerified':False,
      'physicalFitApproved':False,'procurementApproved':False,
      'powerApproved':False,'flightApproved':False,
      'warning':'Identical CAD occurrence geometry does not determine physical part count. Original collision rows remain authoritative evidence; positive distinct geometry collisions still block model pose approval.'}
def main():
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('--frame-step','--survey','--boolean','--out'):
        p.add_argument(name,required=True,type=Path)
    a=p.parse_args()
    need(not a.out.exists(),'Refuse to overwrite an earlier source occurrence audit')
    report=reconcile(a.frame_step,a.survey,a.boolean)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(report,indent=2,sort_keys=True)+'\n')
    print('Frame original source occurrences:',report['originalFrameSolidCount'],
      '; geometry distinct:',report['geometryDistinctOriginalSolidCount'],
      '; original BREP collision positive:',report['sourceModelRawPositiveOverlapCount'],
      '; geometry-group collision positive:',report['geometryCanonicalPositiveOverlapCount'],
      '; PHYSICAL FIT NOT APPROVED')
if __name__=='__main__':main()
