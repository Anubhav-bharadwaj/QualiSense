import sys, os
sys.path.insert(0, os.path.abspath("."))
from backend.database import SessionLocal
from backend.models import Batch, QualityAlert
from backend.rules import RuleEngine
from backend.ml_service import ml_model_service
from backend.main import get_dashboard_summary, add_reading, ProductionReadingCreate

db = SessionLocal()
try:
    print("1. Testing Batches in DB...")
    batches = db.query(Batch).all()
    print(f"Found {len(batches)} batches.")
    assert len(batches) >= 5

    print("2. Testing Rule Engine evaluation...")
    b = batches[0]
    reading_payload = ProductionReadingCreate(
        batch_id=b.id,
        stage="Cooling",
        parameter="Temperature",
        value=43.1,
        unit="°C",
        operator_name="Elena Rossi",
        source="Inline Sensor Probe"
    )
    result = add_reading(b.id, reading_payload, db)
    print("Reading recorded successfully:", result["reading"].value, result["reading"].unit)
    if result["alert"]:
        print("Rule alert correctly triggered:", result["alert"].severity, result["alert"].rule_name)

    print("3. Testing ML Defect Risk prediction...")
    ml_res = ml_model_service.predict(42.8, 5.4, 880, 3180, 200)
    print("ML Risk probability:", ml_res["defect_risk_probability"], "Risk level:", ml_res["risk_level"])
    assert ml_res["is_model_available"] is True

    print("4. Testing Dashboard Aggregates...")
    summary = get_dashboard_summary(None, db)
    print("Batches monitored:", summary.batches_monitored, "First pass quality:", summary.first_pass_quality_rate)

    print("\n>>> ALL DIRECT BACKEND AND RULE ENGINE TESTS PASSED! <<<")
finally:
    db.close()

