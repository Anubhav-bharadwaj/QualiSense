import sys, os
sys.path.insert(0, os.path.abspath("."))
from fastapi.testclient import TestClient
from backend.main import app

with TestClient(app) as client:
    print("Testing GET /api/dashboard/summary...")
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200, f"Dashboard failed: {res.status_code}"
    print("Dashboard OK:", res.json()["batches_monitored"], "batches")

    print("Testing GET /api/batches...")
    res = client.get("/api/batches")
    assert res.status_code == 200
    print("Batches OK:", len(res.json()), "batches")

    print("Testing Rule Engine POST /api/batches/1/readings with 43.2 C spike...")
    res = client.post("/api/batches/1/readings", json={
        "batch_id": 1,
        "stage": "Cooling",
        "parameter": "Temperature",
        "value": 43.2,
        "unit": "°C",
        "operator_name": "Test Op",
        "source": "Inline Probe"
    })
    assert res.status_code == 200
    print("Rule Alert Generated:", res.json()["alert"]["severity"])

    print("Testing POST /api/ml/predict...")
    res = client.post("/api/ml/predict", json={
        "temperature": 43.2,
        "ph": 5.4,
        "mixing_speed": 850,
        "viscosity": 3100,
        "filling_quantity": 200
    })
    assert res.status_code == 200
    print("ML Pred OK:", res.json()["risk_level"], res.json()["defect_risk_probability"])

print("ALL TEST CHECKS PASSED PERFECTLY!")
