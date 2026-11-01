import sys, os
sys.path.insert(0, os.path.abspath("."))
import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.seed_data import seed_database
from backend.models import Batch, QualityAlert, ProductionReading

client = TestClient(app)

class TestQualiSenseAI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Reset and seed clean demo scenario
        db = SessionLocal()
        seed_database(db)
        db.close()

    def test_01_dashboard_summary(self):
        res = client.get("/api/dashboard/summary")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("batches_monitored", data)
        self.assertIn("active_deviations", data)
        self.assertGreaterEqual(data["batches_monitored"], 5)
        self.assertIn("DEMO — SYNTHETIC DATA", data["disclaimer"])

    def test_02_batches_list_and_detail(self):
        # List batches
        res = client.get("/api/batches")
        self.assertEqual(res.status_code, 200)
        batches = res.json()
        self.assertGreater(len(batches), 0)

        # Find Demo batch LOT-2026-HYD-041
        demo_b = next((b for b in batches if b["batch_code"] == "LOT-2026-HYD-041"), None)
        self.assertIsNotNone(demo_b)

        # Get detail
        res_detail = client.get(f"/api/batches/{demo_b['id']}")
        self.assertEqual(res_detail.status_code, 200)
        detail = res_detail.json()
        self.assertIn("readings", detail)
        self.assertIn("alerts", detail)
        self.assertIn("parameter_limits", detail)

    def test_03_rule_engine_in_range_reading(self):
        # Record normal temperature reading (37.2 °C) -> Should NOT create an alert
        payload = {
            "batch_id": 1,
            "stage": "Mixing & Heating",
            "parameter": "Temperature",
            "value": 37.2,
            "unit": "°C",
            "operator_name": "Elena Rossi",
            "source": "Inline Sensor Probe"
        }
        res = client.post("/api/batches/1/readings", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsNone(data["alert"])

    def test_04_rule_engine_out_of_range_reading(self):
        # Record out-of-range critical temperature spike (43.5 °C) on batch 2 -> Must create Critical alert
        payload = {
            "batch_id": 2,
            "stage": "Cooling",
            "parameter": "Temperature",
            "value": 43.5,
            "unit": "°C",
            "operator_name": "Elena Rossi",
            "source": "Inline Sensor Probe"
        }
        res = client.post("/api/batches/2/readings", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        alert = data["alert"]
        self.assertIsNotNone(alert)
        self.assertEqual(alert["severity"], "Critical")
        self.assertEqual(alert["observed_value"], 43.5)
        self.assertIn("CRITICAL HIGH DEVIATION", alert["explanation"])

    def test_05_alert_acknowledgement_and_resolution(self):
        res = client.get("/api/alerts")
        self.assertEqual(res.status_code, 200)
        alerts = res.json()
        self.assertGreater(len(alerts), 0)
        target_alert = alerts[0]

        # Acknowledge
        res_ack = client.patch(f"/api/alerts/{target_alert['id']}", json={"status": "Acknowledged"})
        self.assertEqual(res_ack.status_code, 200)
        self.assertEqual(res_ack.json()["status"], "Acknowledged")

        # Resolve
        res_res = client.patch(
            f"/api/alerts/{target_alert['id']}",
            json={"status": "Resolved", "resolved_by": "Dr. Sarah Chen"}
        )
        self.assertEqual(res_res.status_code, 200)
        self.assertEqual(res_res.json()["status"], "Resolved")

    def test_06_investigation_and_5_whys_persistence(self):
        # Get investigation for demo alert 1
        res = client.get("/api/investigations/1")
        self.assertEqual(res.status_code, 200)
        inv = res.json()
        self.assertIn("five_whys", inv)
        self.assertIn("fishbone", inv)

        # Update notes and cause status
        updated_payload = {
            "alert_id": inv["alert_id"],
            "batch_id": inv["batch_id"],
            "notes": "Verified pneumatic actuator diaphragm seal intact; pilot valve replaced.",
            "cause_status": "Engineer-Confirmed",
            "five_whys": inv["five_whys"],
            "fishbone": inv["fishbone"]
        }
        res_save = client.post("/api/investigations", json=updated_payload)
        self.assertEqual(res_save.status_code, 200)
        self.assertEqual(res_save.json()["cause_status"], "Engineer-Confirmed")

    def test_07_corrective_action_workflow(self):
        payload = {
            "batch_id": 1,
            "title": "Recalibrate Chiller Line 01 Thermocouple Probes",
            "description": "Perform NIST traceable two-point ice bath and boiling point probe calibration.",
            "owner_name": "Marc Dupont",
            "owner_role": "Plant Manager",
            "priority": "High",
            "due_date": "2026-11-05"
        }
        res = client.post("/api/actions", json=payload)
        self.assertEqual(res.status_code, 200)
        act = res.json()
        self.assertEqual(act["status"], "Open")

        # Update to In Progress
        res_up1 = client.patch(f"/api/actions/{act['id']}", json={"status": "In Progress"})
        self.assertEqual(res_up1.status_code, 200)
        self.assertEqual(res_up1.json()["status"], "In Progress")

        # Complete
        res_up2 = client.patch(
            f"/api/actions/{act['id']}",
            json={"status": "Completed", "completion_note": "Calibration certified ±0.1°C."}
        )
        self.assertEqual(res_up2.status_code, 200)
        self.assertEqual(res_up2.json()["status"], "Completed")

    def test_08_sustainability_summary(self):
        res = client.get("/api/sustainability/summary")
        self.assertEqual(res.status_code, 200)
        s = res.json()
        self.assertIn("total_material_waste_kg", s)
        self.assertIn("avoided_material_kg", s)
        self.assertIn("assumptions", s)
        self.assertIn("ILLUSTRATIVE DEMO ESTIMATES", s["disclaimer"])

    def test_09_ml_prediction_endpoint(self):
        payload = {
            "temperature": 42.8,
            "ph": 5.4,
            "mixing_speed": 880.0,
            "viscosity": 3180.0,
            "filling_quantity": 200.0
        }
        res = client.post("/api/ml/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        pred = res.json()
        self.assertTrue(pred["is_model_available"])
        self.assertIn("defect_risk_probability", pred)
        self.assertIn("top_contributing_features", pred)
        self.assertIn("EXPERIMENTAL ML SIGNAL", pred["disclaimer"])

if __name__ == "__main__":
    unittest.main()
