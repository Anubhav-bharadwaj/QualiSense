"""
Automated Verification Suite for QualiSense AI UI/UX Refinement & Product Enhancements:
1. Reconciled Quality & Sustainability Metrics (83.3% Completed vs 75.0% Total FPQ, 27kg logged vs 225kg avoidable).
2. Dynamic Recommended Actions Today endpoint.
3. Investigation Dossier & 6-Stage Effectiveness Verification.
4. UCI SECOM Feature Correlation Explorer.
5. UCI SECOM Pass vs Fail Comparison.
6. UCI SECOM Genuine Scikit-Learn Benchmark Evaluation.
"""

import unittest
from backend.database import SessionLocal
from backend.metrics_service import QualityMetricsService
from backend.main import get_dashboard_summary, get_investigation_dossier
from backend.datasets.secom.routes import (
    get_secom_feature_correlation,
    get_secom_pass_fail_comparison,
    get_ml_evaluation,
    trigger_ml_evaluation
)

class TestQualiSenseEnhancements(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_metrics_service_reconciliation(self):
        """Verify unified calculations for FPQ and sustainability without double-counting."""
        fpq = QualityMetricsService.get_first_pass_metrics(self.db)
        sust = QualityMetricsService.get_sustainability_reconciliation(self.db)
        
        # Check FPQ reconciliation
        self.assertEqual(fpq["primary_fpq_rate"], 83.3)
        self.assertEqual(fpq["total_fpq_rate"], 75.0)
        self.assertIn("Primary FPQ (83.3%)", fpq["denominator_documentation"])
        
        # Check Sustainability reconciliation (decoupled logged from avoidable)
        self.assertEqual(sust["logged_rework"]["material_kg"], 27.0)
        self.assertEqual(sust["potential_avoidable"]["material_kg"], 225.0)
        self.assertIn("prevent double counting", sust["reconciliation_note"])

    def test_02_dashboard_summary_endpoint(self):
        """Verify get_dashboard_summary returns recommended actions and reconciled metrics."""
        data = get_dashboard_summary(line_id=None, db=self.db)

        self.assertEqual(data.first_pass_quality_rate, 83.3)
        self.assertEqual(data.logged_material_waste_kg, 27.0)
        self.assertEqual(data.potential_avoidable_waste_kg, 225.0)
        self.assertIn("Finished Lot FPY: 83.3%", data.fpq_basis_note)

        # Check recommended actions today
        self.assertIsNotNone(data.recommended_actions_today)
        actions = data.recommended_actions_today
        self.assertIsInstance(actions, list)
        self.assertGreater(len(actions), 0)
        for act in actions:
            self.assertTrue(len(act.title) > 0)
            self.assertTrue(len(act.priority) > 0)
            self.assertTrue(len(act.target_url) > 0)
            self.assertTrue(len(act.source_badge) > 0)

    def test_03_investigation_dossier_and_effectiveness(self):
        """Verify investigation dossier returns effectiveness verification stage and clean layout."""
        dossier = get_investigation_dossier(investigation_id=1, db=self.db)

        self.assertEqual(dossier.investigation_id, 1)
        self.assertTrue(len(dossier.deviation_title) > 0)
        self.assertIsNotNone(dossier.five_whys)
        self.assertIsNotNone(dossier.fishbone)
        self.assertIsNotNone(dossier.corrective_actions)
        self.assertIsNotNone(dossier.sustainability_impact)
        self.assertIsNotNone(dossier.effectiveness_verification)

        eff = dossier.effectiveness_verification
        self.assertIn(eff["effectiveness_status"], ["Pending Verification", "Effective", "Partially Effective", "Ineffective"])
        self.assertEqual(eff["deviation_recurred"], False)
        self.assertIn("post_intervention_readings", eff)

    def test_04_secom_feature_correlation(self):
        """Verify SECOM pairwise correlation calculation and non-causation caveat."""
        data = get_secom_feature_correlation(feat_x="Sensor_59", feat_y="Sensor_103", db=self.db)

        self.assertEqual(data["feature_x"], "Sensor_59")
        self.assertEqual(data["feature_y"], "Sensor_103")
        self.assertIsInstance(data["correlation_r"], float)
        self.assertGreater(data["valid_sample_count"], 1500)
        self.assertIn("causation_caveat", data)
        self.assertIn("does NOT establish causal defect mechanisms", data["causation_caveat"])
        self.assertGreater(len(data["points"]), 0)

    def test_05_secom_pass_fail_comparison(self):
        """Verify SECOM pass vs fail statistical comparison and binned distributions."""
        data = get_secom_pass_fail_comparison(feature="Sensor_59", db=self.db)

        self.assertEqual(data["feature_name"], "Sensor_59")
        self.assertIn("pass_stats", data)
        self.assertIn("fail_stats", data)
        self.assertEqual(data["pass_stats"]["count"] + data["fail_stats"]["count"], data["total_valid_samples"])
        self.assertIsNotNone(data["pass_stats"]["mean"])
        self.assertIsNotNone(data["fail_stats"]["mean"])
        self.assertIsNotNone(data["difference_of_means"])
        self.assertGreater(len(data["binned_distribution"]), 0)
        self.assertIn("disclaimer", data)

    def test_06_secom_ml_benchmark_evaluation(self):
        """Verify genuine scikit-learn evaluation on SECOM without fabricated metrics."""
        # Check initial evaluation status
        initial_status = get_ml_evaluation()
        self.assertIn("algorithm", initial_status)
        self.assertIn("disclaimer", initial_status)

        # Trigger genuine scikit-learn train and evaluate
        eval_data = trigger_ml_evaluation()

        self.assertTrue(eval_data["is_trained"])
        self.assertEqual(eval_data["total_samples"], 1567)
        self.assertEqual(eval_data["train_samples"], 1253)
        self.assertEqual(eval_data["test_samples"], 314)
        self.assertGreater(eval_data["recall"], 0.40)
        self.assertGreater(eval_data["precision"], 0.10)
        self.assertGreater(eval_data["f1_score"], 0.15)
        self.assertIn("confusion_matrix", eval_data)
        self.assertEqual(
            eval_data["confusion_matrix"]["true_negative"] +
            eval_data["confusion_matrix"]["false_positive"] +
            eval_data["confusion_matrix"]["false_negative"] +
            eval_data["confusion_matrix"]["true_positive"],
            314
        )
        self.assertEqual(len(eval_data["top_feature_importance"]), 10)
        self.assertIn("NOT represent or apply to cosmetics", eval_data["disclaimer"])

if __name__ == "__main__":
    unittest.main()
