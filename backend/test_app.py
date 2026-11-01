import sys
import os

_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

import unittest
from backend.database import SessionLocal
from backend.seed_data import seed_database
from backend.schemas import (
    ProductionReadingCreate, QualityAlertUpdate,
    InvestigationCreate, CorrectiveActionCreate, CorrectiveActionUpdate,
    MLPredictRequest
)
from backend.main import (
    get_dashboard_summary, list_batches, get_batch_detail,
    add_reading, list_alerts, update_alert,
    get_investigation_by_alert, save_investigation,
    create_action, update_action,
    get_sustainability_summary, predict_ml_risk
)

class TestQualiSenseAI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Reset and seed clean demo scenario
        db = SessionLocal()
        seed_database(db)
        db.close()

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_01_dashboard_summary(self):
        summary = get_dashboard_summary(db=self.db)
        self.assertGreaterEqual(summary.batches_monitored, 5)
        self.assertGreaterEqual(summary.active_deviations, 1)
        self.assertIn("DEMO — SYNTHETIC DATA", summary.disclaimer)

    def test_02_batches_list_and_detail(self):
        # List batches
        batches = list_batches(db=self.db)
        self.assertGreater(len(batches), 0)

        # Find Demo batch LOT-2026-HYD-041
        demo_b = next((b for b in batches if b.batch_code == "LOT-2026-HYD-041"), None)
        self.assertIsNotNone(demo_b)

        # Get detail
        detail = get_batch_detail(demo_b.id, db=self.db)
        self.assertTrue(hasattr(detail, "readings"))
        self.assertTrue(hasattr(detail, "alerts"))
        self.assertTrue(hasattr(detail, "parameter_limits"))

    def test_03_rule_engine_in_range_reading(self):
        # Record normal temperature reading (37.2 °C) -> Should NOT create an alert
        reading = ProductionReadingCreate(
            batch_id=1,
            stage="Mixing & Heating",
            parameter="Temperature",
            value=37.2,
            unit="°C",
            operator_name="Elena Rossi",
            source="Inline Sensor Probe"
        )
        res = add_reading(batch_id=1, reading_in=reading, db=self.db, current_user=None)
        self.assertIsNone(res["alert"])

    def test_04_rule_engine_out_of_range_reading(self):
        # Record out-of-range critical temperature spike (43.5 °C) on batch 2 -> Must create Critical alert
        reading = ProductionReadingCreate(
            batch_id=2,
            stage="Cooling",
            parameter="Temperature",
            value=43.5,
            unit="°C",
            operator_name="Elena Rossi",
            source="Inline Sensor Probe"
        )
        res = add_reading(batch_id=2, reading_in=reading, db=self.db, current_user=None)
        alert = res["alert"]
        self.assertIsNotNone(alert)
        self.assertEqual(alert.severity, "Critical")
        self.assertEqual(alert.observed_value, 43.5)
        self.assertIn("CRITICAL HIGH DEVIATION", alert.explanation)

    def test_05_alert_acknowledgement_and_resolution(self):
        alerts = list_alerts(db=self.db)
        self.assertGreater(len(alerts), 0)
        target_alert = alerts[0]

        # Acknowledge
        ack_res = update_alert(
            alert_id=target_alert.id,
            alert_update=QualityAlertUpdate(status="Acknowledged"),
            db=self.db,
            current_user=None
        )
        self.assertEqual(ack_res.status, "Acknowledged")

        # Resolve
        resolve_res = update_alert(
            alert_id=target_alert.id,
            alert_update=QualityAlertUpdate(status="Resolved", resolved_by="Dr. Sarah Chen"),
            db=self.db,
            current_user=None
        )
        self.assertEqual(resolve_res.status, "Resolved")

    def test_06_investigation_and_5_whys_persistence(self):
        # Get investigation for demo alert 1
        inv = get_investigation_by_alert(alert_id=1, db=self.db)
        self.assertIsNotNone(inv)
        self.assertTrue(hasattr(inv, "five_whys"))
        self.assertTrue(hasattr(inv, "fishbone"))

        # Update notes and cause status
        updated_payload = InvestigationCreate(
            alert_id=inv.alert_id,
            batch_id=inv.batch_id,
            notes="Verified pneumatic actuator diaphragm seal intact; pilot valve replaced.",
            cause_status="Engineer-Confirmed",
            five_whys=inv.five_whys,
            fishbone=inv.fishbone
        )
        saved = save_investigation(inv_in=updated_payload, db=self.db, current_user=None)
        self.assertEqual(saved.cause_status, "Engineer-Confirmed")

    def test_07_corrective_action_workflow(self):
        action_in = CorrectiveActionCreate(
            batch_id=1,
            title="Recalibrate Chiller Line 01 Thermocouple Probes",
            description="Perform NIST traceable two-point ice bath and boiling point probe calibration.",
            owner_name="Marc Dupont",
            owner_role="Plant Manager",
            priority="High",
            due_date="2026-11-05"
        )
        act = create_action(act_in=action_in, db=self.db, current_user=None)
        self.assertEqual(act.status, "Open")

        # Update to In Progress
        up1 = update_action(
            action_id=act.id,
            act_update=CorrectiveActionUpdate(status="In Progress"),
            db=self.db,
            current_user=None
        )
        self.assertEqual(up1.status, "In Progress")

        # Complete
        up2 = update_action(
            action_id=act.id,
            act_update=CorrectiveActionUpdate(status="Completed", completion_note="Calibration certified ±0.1°C."),
            db=self.db,
            current_user=None
        )
        self.assertEqual(up2.status, "Completed")

    def test_08_sustainability_summary(self):
        s = get_sustainability_summary(db=self.db)
        self.assertTrue(hasattr(s, "total_material_waste_kg"))
        self.assertTrue(hasattr(s, "avoided_material_kg"))
        self.assertTrue(hasattr(s, "assumptions"))
        self.assertIn("ILLUSTRATIVE DEMO ESTIMATES", s.disclaimer)

    def test_09_ml_prediction_endpoint(self):
        req = MLPredictRequest(
            temperature=42.8,
            ph=5.4,
            mixing_speed=880.0,
            viscosity=3180.0,
            filling_quantity=200.0
        )
        pred = predict_ml_risk(payload=req)
        self.assertTrue(pred.is_model_available)
        self.assertTrue(hasattr(pred, "defect_risk_probability"))
        self.assertTrue(hasattr(pred, "top_contributing_features"))
        self.assertIn("EXPERIMENTAL ML SIGNAL", pred.disclaimer)

if __name__ == "__main__":
    unittest.main()
