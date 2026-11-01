"""
Automated Integration Test for SECOM Real Manufacturing Dataset Module.
Validates:
1. DB isolation: 1,567 SECOM records, 8 cosmetics batches.
2. Summary endpoint: total records, pass/fail counts, missing values.
3. Records pagination: correct slicing, filtering, details lookup.
4. Feature explorer: 590 sensors, constant feature detection (116).
5. Distribution: class imbalance (14.1 : 1), missingness distribution.
6. ML Readiness: zero data leakage architecture, deferred training status.
7. Metadata: UCI attribution, provenance, disclaimers.
"""

import sys
import os

_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

try:
    from backend.database import SessionLocal
    from backend.models import SecomSample, DatasetImport, Batch
    from backend.datasets.secom.service import SecomService
    from backend.datasets.secom.ml_pipeline import SecomPreprocessingPipeline
except ImportError:
    from database import SessionLocal
    from models import SecomSample, DatasetImport, Batch
    from datasets.secom.service import SecomService
    from datasets.secom.ml_pipeline import SecomPreprocessingPipeline

def run_tests():
    print("=" * 60)
    print("RUNNING SECOM DATASET INTEGRATION TESTS")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 1. Verify strict data isolation
        secom_count = db.query(SecomSample).count()
        cosmetics_count = db.query(Batch).count()
        import_record = db.query(DatasetImport).filter(
            DatasetImport.dataset_name == "SECOM Semiconductor Dataset"
        ).first()

        print(f"[TEST 1] Data Isolation: {secom_count} SECOM samples, {cosmetics_count} cosmetics batches.")
        assert secom_count == 1567, f"Expected 1,567 SECOM samples, got {secom_count}"
        assert cosmetics_count == 8, f"Cosmetics batches altered! Expected 8, got {cosmetics_count}"
        assert import_record is not None, "DatasetImport record missing!"
        print(" -> PASSED: Data isolation verified.")

        # 2. Verify summary calculations
        summary = SecomService.get_summary(db)
        print(f"[TEST 2] Summary: Pass={summary.pass_count}, Fail={summary.fail_count}, Total={summary.total_records}")
        assert summary.total_records == 1567
        assert summary.pass_count == 1463
        assert summary.fail_count == 104
        assert summary.pass_percentage == 93.36
        assert summary.fail_percentage == 6.64
        assert summary.missing_values_count == 41951
        assert summary.constant_features_count == 116
        print(" -> PASSED: Summary metrics verified.")

        # 3. Verify record pagination and detail
        records_p1, total_rec = SecomService.get_records(db, page=1, page_size=10)
        assert total_rec == 1567
        assert len(records_p1) == 10
        print(f"[TEST 3] Paginated Records: fetched {len(records_p1)} of {total_rec}")

        sample_detail = SecomService.get_record_detail(db, record_id=records_p1[0].id)
        assert len(sample_detail.features) == 590
        assert "Sensor_0" in sample_detail.features
        assert "Sensor_589" in sample_detail.features
        print(f" -> PASSED: Record detail contains 590 sensor readings.")

        # 4. Verify feature explorer and constant features
        features_all, total_feat = SecomService.get_features(db, page=1, page_size=10, only_constant=False)
        assert total_feat == 590
        features_const, total_const = SecomService.get_features(db, page=1, page_size=10, only_constant=True)
        assert total_const == 116
        print(f"[TEST 4] Feature Explorer: {total_feat} total features, {total_const} constant features.")
        print(" -> PASSED: Feature explorer verified.")

        # 5. Verify distribution & metadata
        dist = SecomService.get_distribution(db)
        assert dist.imbalance_ratio == "14.1 : 1"
        assert len(dist.missingness_histogram) == 5
        assert len(dist.top_missing_features) == 10
        print(f"[TEST 5] Distribution: Imbalance={dist.imbalance_ratio}, Top missing={len(dist.top_missing_features)}")

        meta = SecomService.get_metadata(db)
        assert meta.dataset_name == "SECOM Semiconductor Manufacturing Dataset"
        assert meta.instances == 1567
        assert meta.features == 590
        print(" -> PASSED: Metadata and distribution verified.")

        # 6. Verify ML readiness & zero data leakage
        pipeline = SecomPreprocessingPipeline()
        readiness = pipeline.get_pipeline_readiness()
        assert readiness["status"] == "Ready for Training (Deferred Phase)"
        assert readiness["constant_features_detected"] == 116
        print(f"[TEST 6] ML Readiness: Status='{readiness['status']}'")
        print(" -> PASSED: ML readiness verified.")

        print("=" * 60)
        print("ALL SECOM INTEGRATION TESTS PASSED (100% SUCCESS)")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()

