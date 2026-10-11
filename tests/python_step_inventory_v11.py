import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE = Path(__file__).resolve().parents[1] / "tools" / "step_cad_inventory_v11.py"
spec = importlib.util.spec_from_file_location("step_cad_inventory_v11", MODULE)
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)


class FakeBoundingBox:
    xmin, ymin, zmin = -10.0, -20.0, 1.0
    xmax, ymax, zmax = 10.0, 40.0, 9.0


class StepInventoryTests(unittest.TestCase):
    def test_bounding_boxes_are_dimensioned_but_not_registered(self):
        box = inventory.dimensions_for_box(FakeBoundingBox())
        self.assertEqual(box["dimensionsKernelUnits"], [20.0, 60.0, 8.0])
        self.assertEqual(box["centerKernelUnits"], [0.0, 10.0, 5.0])

    def test_bad_numeric_and_inverted_box_rejected(self):
        class Bad:
            xmin, ymin, zmin = 20.0, 0.0, 0.0
            xmax, ymax, zmax = 10.0, 2.0, 2.0
        with self.assertRaises(ValueError):
            inventory.dimensions_for_box(Bad())
        self.assertRaises(ValueError, inventory.number, float("nan"), "nan")
        self.assertRaises(ValueError, inventory.number, float("inf"), "inf")

    def test_chunked_sha256_matches_standard_digest(self):
        import hashlib
        payload = b"STEP-representation-example-test-only" * 2000
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / "test.step"
            p.write_bytes(payload)
            self.assertEqual(inventory.sha256_file(p), hashlib.sha256(payload).hexdigest())


if __name__ == "__main__":
    unittest.main()
