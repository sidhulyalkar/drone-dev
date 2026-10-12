"""Synthetic-only BREP pattern tests; no original Holybro CAD required in CI."""
import json
import sys
from pathlib import Path
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
import x500_mount_feature_candidates_v29 as patterns

def face(solid,idx,radius,axis,coord):
    # Cylinder Axis.Location's longitudinal component is arbitrary!
    point=[coord[0],15.5,coord[1]] if axis==1 else [1184.675,coord[0],coord[1]]
    direction=[0,1,0] if axis==1 else [1,0,0]
    return {"solidIndex":solid,"faceIndex":idx,"radiusKernelMm":radius,
            "axisDirectionKernel":direction,"axisLocationKernelMm":point,
            "featureType":"UNLABELED_BREP_CYLINDRICAL_SURFACE"}

def fixture(role):
    items=[]
    if role=="frame":
        for solid,x,z in [(35,-176.876,-176.876),(62,-176.876,176.876),
                          (89,176.876,176.876),(116,176.876,-176.876)]:
            for i,(dx,dz) in enumerate([(9.5,0),(-9.5,0),(0,9.5),(0,-9.5)]):
                items.append(face(solid,i+solid,2.9,1,(x+dx,z+dz)))
        solid_count=244
    else:
        for i,yz in enumerate([(726.427812,5.656854),(737.741521,-5.656854),
                               (725.367152,-6.717514),(738.802181,6.717514)]):
            for j in range(3):
                items.append(face(0,i*3+j,1.25,0,yz))
        solid_count=4
    return {
        "schema":patterns.BREP_SCHEMA,
        "source":{"fileName":patterns.NAMES[role],
                  "sha256":patterns.HASHES[role],
                  "manufacturerSignatureVerified":False},
        "solidCount":solid_count,
        "cylindricalSurfaceFaceCount":len(items),
        "candidateCylinders":items,
        "holeOrBossClassificationApproved":False,
        "flightApproved":False,
    }

class TestCandidateBuilder(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path=Path(self.temp.name)
        self.frame=self.path/"frame.json"
        self.motor=self.path/"motor.json"
        self.write()

    def write(self,frame=None,motor=None):
        self.frame.write_text(json.dumps(frame if frame is not None else fixture("frame")))
        self.motor.write_text(json.dumps(motor if motor is not None else fixture("motor")))

    def test_source_native_quadrants_and_motor_opposite_pairs(self):
        result=patterns.build(self.frame,self.motor)
        self.assertEqual(result["candidateCount"],5)
        self.assertEqual({x["role"] for x in result["candidates"]},{"frame","motor"})
        self.assertEqual([x["squareDiagonalMm"] for x in result["candidates"][:4]],[19]*4)
        self.assertEqual([x["centerDistanceMm"] for x in result["candidates"][4]["supportingPairs"]],[16,19])
        self.assertEqual(result["candidates"][0]["axialCoordinateMm"],None)
        self.assertEqual(result["candidates"][4]["displayPointNativeMm"][0],None)
        self.assertFalse(result["flightApproved"])
        self.assertFalse(result["mountingHoleIdentityApproved"])
        self.assertEqual(result["source"]["frameSha256"],patterns.HASHES["frame"])

    def test_wrong_source_fingerprint_or_approval_claim_rejected(self):
        bad=fixture("motor");bad["source"]["sha256"]="a"*64
        self.write(motor=bad)
        with self.assertRaisesRegex(ValueError,"exact user-uploaded source"):
            patterns.build(self.frame,self.motor)
        bad=fixture("motor");bad["flightApproved"]=True
        self.write(motor=bad)
        with self.assertRaisesRegex(ValueError,"Upgraded"):
            patterns.build(self.frame,self.motor)

    def test_incomplete_frame_and_altered_motor_pairs_rejected(self):
        f=fixture("frame")
        f["candidateCylinders"]=[x for x in f["candidateCylinders"] if x["solidIndex"]!=35]
        f["cylindricalSurfaceFaceCount"]=len(f["candidateCylinders"])
        self.write(frame=f)
        with self.assertRaisesRegex(ValueError,"four distinct outer frame"):
            patterns.build(self.frame,self.motor)
        m=fixture("motor")
        for item in m["candidateCylinders"]:
            if item["faceIndex"] in (9,10,11):
                item["axisLocationKernelMm"][2]+=0.8
        self.write(frame=fixture("frame"),motor=m)
        with self.assertRaisesRegex(ValueError,"exactly one motor"):
            patterns.build(self.frame,self.motor)

if __name__=="__main__":
    unittest.main()
