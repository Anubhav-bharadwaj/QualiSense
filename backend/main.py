import sys
import os

# Prevent Windows OpenBLAS memory allocation failure when importing numpy / scikit-learn
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")

import datetime
from typing import List, Optional, Dict, Any

# Ensure project root and backend directory are in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

try:
    from .database import engine, Base, get_db
    from .models import (
        User, ProductProfile, ProductionLine, Batch, ProductionReading,
        QualityAlert, Investigation, CorrectiveAction, SustainabilityRecord
    )
    from .schemas import (
        UserOut, ProductProfileOut, ProductionLineOut,
        ProductionReadingCreate, ProductionReadingOut,
        QualityAlertOut, QualityAlertUpdate,
        InvestigationCreate, InvestigationUpdate, InvestigationOut, InvestigationDossierOut,
        CorrectiveActionCreate, CorrectiveActionUpdate, CorrectiveActionOut,
        BatchCreate, BatchOut, BatchDetailOut, BatchDispositionUpdate,
        DashboardSummary, RecommendedAction, SustainabilitySummary, SustainabilityRecordOut,
        MLPredictRequest, MLPredictionOut
    )
    from .rules import RuleEngine, DEFAULT_ILLUSTRATIVE_LIMITS
    from .seed_data import seed_database
    from .ml_service import ml_model_service
except (ImportError, ValueError):
    from database import engine, Base, get_db
    from models import (
        User, ProductProfile, ProductionLine, Batch, ProductionReading,
        QualityAlert, Investigation, CorrectiveAction, SustainabilityRecord
    )
    from schemas import (
        UserOut, ProductProfileOut, ProductionLineOut,
        ProductionReadingCreate, ProductionReadingOut,
        QualityAlertOut, QualityAlertUpdate,
        InvestigationCreate, InvestigationUpdate, InvestigationOut, InvestigationDossierOut,
        CorrectiveActionCreate, CorrectiveActionUpdate, CorrectiveActionOut,
        BatchCreate, BatchOut, BatchDetailOut, BatchDispositionUpdate,
        DashboardSummary, RecommendedAction, SustainabilitySummary, SustainabilityRecordOut,
        MLPredictRequest, MLPredictionOut
    )
    from rules import RuleEngine, DEFAULT_ILLUSTRATIVE_LIMITS
    from seed_data import seed_database
    from ml_service import ml_model_service

try:
    from backend.metrics_service import QualityMetricsService
    from backend.datasets.secom.routes import router as secom_router
    from backend.auth.routes import router as auth_router
    from backend.auth.dependencies import require_permission, get_current_user_optional, get_current_user
    from backend.auth.permissions import (
        BATCHES_WRITE, ALERTS_WRITE, INVESTIGATIONS_WRITE, CAPA_WRITE,
        SETTINGS_MANAGE, ML_RUN
    )
except ImportError:
    from metrics_service import QualityMetricsService
    from datasets.secom.routes import router as secom_router
    from auth.routes import router as auth_router
    from auth.dependencies import require_permission, get_current_user_optional, get_current_user
    from auth.permissions import (
        BATCHES_WRITE, ALERTS_WRITE, INVESTIGATIONS_WRITE, CAPA_WRITE,
        SETTINGS_MANAGE, ML_RUN
    )

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="QualiSense AI API",
    description="Predictive Quality Monitoring & Defect Prevention Platform for Cosmetics Manufacturing (Synthetic Prototype)",
    version="1.0.0"
)

# Enable CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount SECOM Real Manufacturing Dataset router (Strictly segregated from cosmetics data)
app.include_router(secom_router)

# Mount Authentication & User Management router
app.include_router(auth_router)

# Startup event: automatically seed if database is empty
@app.on_event("startup")
def on_startup():
    from .database import SessionLocal
    db = SessionLocal()
    try:
        count = db.query(Batch).count()
        if count == 0:
            seed_database(db)
    finally:
        db.close()

# --- DEMO RESET ROUTE ---
@app.post("/api/demo/reset", tags=["Demo Management"])
def reset_demo_data(db: Session = Depends(get_db)):
    """Reset the database to clean initial state with demo batch LOT-2026-HYD-041."""
    seed_database(db)
    return {"message": "Demo database successfully reset and seeded with initial scenario state."}

# --- USERS, PRODUCTS & LINES ---
@app.get("/api/users", response_model=List[UserOut], tags=["Master Data"])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.get("/api/products", response_model=List[ProductProfileOut], tags=["Master Data"])
def get_products(db: Session = Depends(get_db)):
    return db.query(ProductProfile).all()

@app.get("/api/lines", response_model=List[ProductionLineOut], tags=["Master Data"])
def get_lines(db: Session = Depends(get_db)):
    return db.query(ProductionLine).all()

# --- DASHBOARD SUMMARY ---
@app.get("/api/dashboard/summary", response_model=DashboardSummary, tags=["Dashboard"])
def get_dashboard_summary(
    line_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query_batches = db.query(Batch)
    query_alerts = db.query(QualityAlert)
    if line_id:
        query_batches = query_batches.filter(Batch.line_id == line_id)
        query_alerts = query_alerts.join(Batch).filter(Batch.line_id == line_id)

    total_batches = query_batches.count()
    active_deviations = query_alerts.filter(QualityAlert.status.in_(["Open", "Acknowledged", "Investigating"])).count()
    batches_needing_review = query_batches.filter(Batch.status == "Quality Review").count()

    # Centralized First Pass Quality metrics
    fpq_metrics = QualityMetricsService.get_first_pass_metrics(db, line_id=line_id)
    fpq_rate = fpq_metrics["primary_fpq_rate"]

    # Centralized Sustainability Reconciliation
    sust_recon = QualityMetricsService.get_sustainability_reconciliation(db)
    logged_mat = sust_recon["logged_rework"]["material_kg"]
    avoidable_mat = sust_recon["potential_avoidable"]["material_kg"]
    total_rework_units = sust_recon["logged_rework"]["units"]

    # Dynamic Recommended Actions Today
    recommended_actions_raw = QualityMetricsService.get_recommended_actions_today(db)
    recommended_actions_out = [RecommendedAction(**r) for r in recommended_actions_raw]

    # Severity distribution
    sev_counts = {"Critical": 0, "High": 0, "Medium": 0, "Info": 0}
    for row in db.query(QualityAlert.severity, func.count(QualityAlert.id)).group_by(QualityAlert.severity).all():
        if row[0] in sev_counts:
            sev_counts[row[0]] = row[1]

    # Recent batches
    recent_batches_models = query_batches.order_by(desc(Batch.started_at)).limit(5).all()
    recent_batches_out = []
    for b in recent_batches_models:
        recent_batches_out.append(BatchOut(
            id=b.id,
            batch_code=b.batch_code,
            product_profile_id=b.product_profile_id,
            product_name=b.product_profile.name if b.product_profile else "Unknown",
            product_category=b.product_profile.category if b.product_profile else "General",
            line_id=b.line_id,
            line_name=b.production_line.name if b.production_line else "Unknown",
            status=b.status,
            started_at=b.started_at,
            completed_at=b.completed_at,
            target_quantity=b.target_quantity,
            actual_quantity=b.actual_quantity,
            first_pass_quality=b.first_pass_quality,
            disposition_notes=b.disposition_notes,
            alert_count=len(b.alerts),
            open_alert_count=sum(1 for a in b.alerts if a.status != "Resolved")
        ))

    # Recent alerts
    recent_alerts_models = query_alerts.order_by(desc(QualityAlert.created_at)).limit(6).all()
    recent_alerts_out = []
    for a in recent_alerts_models:
        recent_alerts_out.append(QualityAlertOut(
            id=a.id,
            batch_id=a.batch_id,
            batch_code=a.batch.batch_code if a.batch else None,
            product_name=a.batch.product_profile.name if a.batch and a.batch.product_profile else None,
            line_name=a.batch.production_line.name if a.batch and a.batch.production_line else None,
            reading_id=a.reading_id,
            parameter=a.parameter,
            observed_value=a.observed_value,
            lower_limit=a.lower_limit,
            upper_limit=a.upper_limit,
            unit=a.unit,
            severity=a.severity,
            rule_name=a.rule_name,
            explanation=a.explanation,
            status=a.status,
            created_at=a.created_at,
            resolved_at=a.resolved_at,
            resolved_by=a.resolved_by
        ))

    # Quality Trend (Timeline over the past 5 shifts - capped at 100%)
    quality_trend = [
        {"period": "Shift 1 (Mon AM)", "first_pass_rate": 100.0, "alerts_detected": 0, "rework_units": 0},
        {"period": "Shift 2 (Mon PM)", "first_pass_rate": 92.0, "alerts_detected": 1, "rework_units": 600},
        {"period": "Shift 3 (Tue AM)", "first_pass_rate": 100.0, "alerts_detected": 0, "rework_units": 0},
        {"period": "Shift 4 (Tue PM)", "first_pass_rate": 100.0, "alerts_detected": 0, "rework_units": 0},
        {"period": "Shift 5 (Current)", "first_pass_rate": fpq_rate, "alerts_detected": 1, "rework_units": 0}
    ]

    return DashboardSummary(
        batches_monitored=total_batches,
        active_deviations=active_deviations,
        batches_needing_review=batches_needing_review,
        first_pass_quality_rate=fpq_rate,
        total_rework_units=total_rework_units,
        estimated_avoidable_waste_kg=avoidable_mat,
        logged_material_waste_kg=logged_mat,
        potential_avoidable_waste_kg=avoidable_mat,
        fpq_basis_note="Finished Lot FPY: 83.3% (5 released clean of 6 completed lots). Monitored Plant Total: 75.0% (6 of 8 total lots).",
        recent_batches=recent_batches_out,
        recent_alerts=recent_alerts_out,
        severity_distribution=sev_counts,
        quality_trend=quality_trend,
        recommended_actions_today=recommended_actions_out,
        disclaimer="DEMO — SYNTHETIC DATA | L'Oréal Sustainability Challenge Prototype (Option 02). Decision support only."
    )

# --- BATCHES ---
@app.get("/api/batches", response_model=List[BatchOut], tags=["Batches"])
def list_batches(
    line_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Batch)
    if line_id:
        query = query.filter(Batch.line_id == line_id)
    if status_filter and status_filter != "All":
        query = query.filter(Batch.status == status_filter)
    if search:
        query = query.filter(Batch.batch_code.ilike(f"%{search}%"))

    batches = query.order_by(desc(Batch.started_at)).all()
    results = []
    for b in batches:
        results.append(BatchOut(
            id=b.id,
            batch_code=b.batch_code,
            product_profile_id=b.product_profile_id,
            product_name=b.product_profile.name if b.product_profile else "Unknown",
            product_category=b.product_profile.category if b.product_profile else "General",
            line_id=b.line_id,
            line_name=b.production_line.name if b.production_line else "Unknown",
            status=b.status,
            started_at=b.started_at,
            completed_at=b.completed_at,
            target_quantity=b.target_quantity,
            actual_quantity=b.actual_quantity,
            first_pass_quality=b.first_pass_quality,
            disposition_notes=b.disposition_notes,
            alert_count=len(b.alerts),
            open_alert_count=sum(1 for a in b.alerts if a.status != "Resolved")
        ))
    return results

@app.post("/api/batches", response_model=BatchOut, tags=["Batches"])
def create_batch(batch_in: BatchCreate, db: Session = Depends(get_db)):
    # Check if batch code exists
    existing = db.query(Batch).filter(Batch.batch_code == batch_in.batch_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Batch code already exists.")

    new_batch = Batch(
        batch_code=batch_in.batch_code,
        product_profile_id=batch_in.product_profile_id,
        line_id=batch_in.line_id,
        target_quantity=batch_in.target_quantity,
        actual_quantity=batch_in.target_quantity,
        status="In Progress",
        started_at=datetime.datetime.utcnow(),
        first_pass_quality=True
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    return BatchOut(
        id=new_batch.id,
        batch_code=new_batch.batch_code,
        product_profile_id=new_batch.product_profile_id,
        product_name=new_batch.product_profile.name if new_batch.product_profile else None,
        product_category=new_batch.product_profile.category if new_batch.product_profile else None,
        line_id=new_batch.line_id,
        line_name=new_batch.production_line.name if new_batch.production_line else None,
        status=new_batch.status,
        started_at=new_batch.started_at,
        target_quantity=new_batch.target_quantity,
        actual_quantity=new_batch.actual_quantity,
        first_pass_quality=new_batch.first_pass_quality,
        alert_count=0,
        open_alert_count=0
    )

@app.get("/api/batches/{batch_id}", response_model=BatchDetailOut, tags=["Batches"])
def get_batch_detail(batch_id: int, db: Session = Depends(get_db)):
    b = db.query(Batch).filter(Batch.id == batch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")

    readings_out = [
        ProductionReadingOut(
            id=r.id,
            batch_id=r.batch_id,
            stage=r.stage,
            parameter=r.parameter,
            value=r.value,
            unit=r.unit,
            recorded_at=r.recorded_at,
            operator_name=r.operator_name,
            source=r.source
        ) for r in b.readings
    ]

    alerts_out = [
        QualityAlertOut(
            id=a.id,
            batch_id=a.batch_id,
            batch_code=b.batch_code,
            product_name=b.product_profile.name if b.product_profile else None,
            line_name=b.production_line.name if b.production_line else None,
            reading_id=a.reading_id,
            parameter=a.parameter,
            observed_value=a.observed_value,
            lower_limit=a.lower_limit,
            upper_limit=a.upper_limit,
            unit=a.unit,
            severity=a.severity,
            rule_name=a.rule_name,
            explanation=a.explanation,
            status=a.status,
            created_at=a.created_at,
            resolved_at=a.resolved_at,
            resolved_by=a.resolved_by
        ) for a in b.alerts
    ]

    return BatchDetailOut(
        id=b.id,
        batch_code=b.batch_code,
        product_profile_id=b.product_profile_id,
        product_name=b.product_profile.name if b.product_profile else "Unknown",
        product_category=b.product_profile.category if b.product_profile else "General",
        line_id=b.line_id,
        line_name=b.production_line.name if b.production_line else "Unknown",
        status=b.status,
        started_at=b.started_at,
        completed_at=b.completed_at,
        target_quantity=b.target_quantity,
        actual_quantity=b.actual_quantity,
        first_pass_quality=b.first_pass_quality,
        disposition_notes=b.disposition_notes,
        alert_count=len(b.alerts),
        open_alert_count=sum(1 for a in b.alerts if a.status != "Resolved"),
        readings=readings_out,
        alerts=alerts_out,
        parameter_limits=b.product_profile.parameter_limits if b.product_profile else DEFAULT_ILLUSTRATIVE_LIMITS
    )

@app.patch("/api/batches/{batch_id}/disposition", response_model=BatchOut, tags=["Batches"])
def update_batch_disposition(
    batch_id: int,
    disposition: BatchDispositionUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_permission(BATCHES_WRITE))
):
    b = db.query(Batch).filter(Batch.id == batch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")

    b.status = disposition.status
    if disposition.disposition_notes:
        b.disposition_notes = disposition.disposition_notes
    if disposition.status in ["Released", "Rework", "Rejected"]:
        b.completed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(b)

    return BatchOut(
        id=b.id,
        batch_code=b.batch_code,
        product_profile_id=b.product_profile_id,
        product_name=b.product_profile.name if b.product_profile else "Unknown",
        product_category=b.product_profile.category if b.product_profile else "General",
        line_id=b.line_id,
        line_name=b.production_line.name if b.production_line else "Unknown",
        status=b.status,
        started_at=b.started_at,
        completed_at=b.completed_at,
        target_quantity=b.target_quantity,
        actual_quantity=b.actual_quantity,
        first_pass_quality=b.first_pass_quality,
        disposition_notes=b.disposition_notes,
        alert_count=len(b.alerts),
        open_alert_count=sum(1 for a in b.alerts if a.status != "Resolved")
    )

# --- READINGS & RULE ENGINE EXECUTION ---
@app.post("/api/batches/{batch_id}/readings", tags=["Readings & Rules"])
def add_reading(
    batch_id: int,
    reading_in: ProductionReadingCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_permission(BATCHES_WRITE))
):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Validate reading numeric bounds and unit
    if reading_in.value is None or not isinstance(reading_in.value, (int, float)):
        raise HTTPException(status_code=422, detail="Invalid reading numeric value.")

    new_reading = ProductionReading(
        batch_id=batch.id,
        stage=reading_in.stage,
        parameter=reading_in.parameter,
        value=float(reading_in.value),
        unit=reading_in.unit,
        operator_name=reading_in.operator_name or "Operator on Duty",
        source=reading_in.source or "Manual Sensor Check",
        recorded_at=datetime.datetime.utcnow()
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)

    # Trigger backend Rule Engine evaluation!
    alert = RuleEngine.evaluate_reading(db, new_reading, batch)

    alert_out = None
    if alert:
        alert_out = QualityAlertOut(
            id=alert.id,
            batch_id=alert.batch_id,
            batch_code=batch.batch_code,
            product_name=batch.product_profile.name if batch.product_profile else None,
            line_name=batch.production_line.name if batch.production_line else None,
            reading_id=alert.reading_id,
            parameter=alert.parameter,
            observed_value=alert.observed_value,
            lower_limit=alert.lower_limit,
            upper_limit=alert.upper_limit,
            unit=alert.unit,
            severity=alert.severity,
            rule_name=alert.rule_name,
            explanation=alert.explanation,
            status=alert.status,
            created_at=alert.created_at
        )

    reading_out = ProductionReadingOut(
        id=new_reading.id,
        batch_id=new_reading.batch_id,
        stage=new_reading.stage,
        parameter=new_reading.parameter,
        value=new_reading.value,
        unit=new_reading.unit,
        recorded_at=new_reading.recorded_at,
        operator_name=new_reading.operator_name,
        source=new_reading.source
    )

    return {
        "reading": reading_out,
        "alert": alert_out,
        "message": "Reading recorded and evaluated against configured quality profile rules."
    }

# --- QUALITY ALERTS ---
@app.get("/api/alerts", response_model=List[QualityAlertOut], tags=["Quality Alerts"])
def list_alerts(
    severity: Optional[str] = None,
    status_filter: Optional[str] = None,
    batch_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(QualityAlert)
    if severity and severity != "All":
        query = query.filter(QualityAlert.severity == severity)
    if status_filter and status_filter != "All":
        query = query.filter(QualityAlert.status == status_filter)
    if batch_id:
        query = query.filter(QualityAlert.batch_id == batch_id)

    alerts = query.order_by(desc(QualityAlert.created_at)).all()
    results = []
    for a in alerts:
        results.append(QualityAlertOut(
            id=a.id,
            batch_id=a.batch_id,
            batch_code=a.batch.batch_code if a.batch else None,
            product_name=a.batch.product_profile.name if a.batch and a.batch.product_profile else None,
            line_name=a.batch.production_line.name if a.batch and a.batch.production_line else None,
            reading_id=a.reading_id,
            parameter=a.parameter,
            observed_value=a.observed_value,
            lower_limit=a.lower_limit,
            upper_limit=a.upper_limit,
            unit=a.unit,
            severity=a.severity,
            rule_name=a.rule_name,
            explanation=a.explanation,
            status=a.status,
            created_at=a.created_at,
            resolved_at=a.resolved_at,
            resolved_by=a.resolved_by
        ))
    return results

@app.patch("/api/alerts/{alert_id}", response_model=QualityAlertOut, tags=["Quality Alerts"])
def update_alert(
    alert_id: int,
    alert_update: QualityAlertUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_permission(ALERTS_WRITE))
):
    alert = db.query(QualityAlert).filter(QualityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = alert_update.status
    if alert_update.status == "Resolved":
        alert.resolved_at = datetime.datetime.utcnow()
        alert.resolved_by = alert_update.resolved_by or "Dr. Sarah Chen (Senior Quality Eng)"

    db.commit()
    db.refresh(alert)

    return QualityAlertOut(
        id=alert.id,
        batch_id=alert.batch_id,
        batch_code=alert.batch.batch_code if alert.batch else None,
        product_name=alert.batch.product_profile.name if alert.batch and alert.batch.product_profile else None,
        line_name=alert.batch.production_line.name if alert.batch and alert.batch.production_line else None,
        reading_id=alert.reading_id,
        parameter=alert.parameter,
        observed_value=alert.observed_value,
        lower_limit=alert.lower_limit,
        upper_limit=alert.upper_limit,
        unit=alert.unit,
        severity=alert.severity,
        rule_name=alert.rule_name,
        explanation=alert.explanation,
        status=alert.status,
        created_at=alert.created_at,
        resolved_at=alert.resolved_at,
        resolved_by=alert.resolved_by
    )

# --- INVESTIGATION WORKSPACE ---
@app.get("/api/investigations/{alert_id}", response_model=InvestigationOut, tags=["Investigations"])
def get_investigation_by_alert(alert_id: int, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.alert_id == alert_id).first()
    if not inv:
        # Check if alert exists, if so return an initialized investigation template
        alert = db.query(QualityAlert).filter(QualityAlert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        # Create initial investigation entry
        default_fishbone = {
            "Machine": [],
            "Method": [],
            "Material": [],
            "Manpower": [],
            "Measurement": [],
            "Environment": []
        }
        default_5whys = [
            {"step": 1, "question": f"Why was {alert.parameter} observed at {alert.observed_value} {alert.unit}?", "answer": ""},
            {"step": 2, "question": "Why did that condition occur?", "answer": ""},
            {"step": 3, "question": "Why was the barrier or control ineffective?", "answer": ""},
            {"step": 4, "question": "Why was the underlying issue not detected earlier?", "answer": ""},
            {"step": 5, "question": "What is the systemic root cause?", "answer": ""}
        ]
        inv = Investigation(
            alert_id=alert.id,
            batch_id=alert.batch_id,
            notes=f"Investigation initiated for alert on {alert.parameter}.",
            cause_status="Under Investigation",
            investigator_name="Dr. Sarah Chen (Senior Quality Eng)",
            five_whys=default_5whys,
            fishbone=default_fishbone
        )
        db.add(inv)
        db.commit()
        db.refresh(inv)

    actions_out = [
        CorrectiveActionOut(
            id=act.id,
            investigation_id=act.investigation_id,
            batch_id=act.batch_id,
            batch_code=inv.alert.batch.batch_code if inv.alert and inv.alert.batch else None,
            title=act.title,
            description=act.description,
            owner_name=act.owner_name,
            owner_role=act.owner_role,
            priority=act.priority,
            due_date=act.due_date,
            status=act.status,
            completion_note=act.completion_note,
            created_at=act.created_at,
            completed_at=act.completed_at
        ) for act in inv.actions
    ]

    alert_out = QualityAlertOut(
        id=inv.alert.id,
        batch_id=inv.alert.batch_id,
        batch_code=inv.alert.batch.batch_code if inv.alert.batch else None,
        product_name=inv.alert.batch.product_profile.name if inv.alert.batch and inv.alert.batch.product_profile else None,
        line_name=inv.alert.batch.production_line.name if inv.alert.batch and inv.alert.batch.production_line else None,
        reading_id=inv.alert.reading_id,
        parameter=inv.alert.parameter,
        observed_value=inv.alert.observed_value,
        lower_limit=inv.alert.lower_limit,
        upper_limit=inv.alert.upper_limit,
        unit=inv.alert.unit,
        severity=inv.alert.severity,
        rule_name=inv.alert.rule_name,
        explanation=inv.alert.explanation,
        status=inv.alert.status,
        created_at=inv.alert.created_at
    )

    return InvestigationOut(
        id=inv.id,
        alert_id=inv.alert_id,
        batch_id=inv.batch_id,
        batch_code=inv.alert.batch.batch_code if inv.alert and inv.alert.batch else None,
        alert=alert_out,
        notes=inv.notes,
        cause_status=inv.cause_status,
        investigator_name=inv.investigator_name,
        five_whys=inv.five_whys,
        fishbone=inv.fishbone,
        effectiveness_verification=inv.effectiveness_verification,
        actions=actions_out,
        created_at=inv.created_at,
        updated_at=inv.updated_at
    )

@app.post("/api/investigations", response_model=InvestigationOut, tags=["Investigations"])
def save_investigation(
    inv_in: InvestigationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_permission(INVESTIGATIONS_WRITE))
):
    inv = db.query(Investigation).filter(Investigation.alert_id == inv_in.alert_id).first()
    if inv:
        if inv_in.notes is not None:
            inv.notes = inv_in.notes
        if inv_in.cause_status:
            inv.cause_status = inv_in.cause_status
        if inv_in.investigator_name:
            inv.investigator_name = inv_in.investigator_name
        if inv_in.five_whys is not None:
            inv.five_whys = inv_in.five_whys
        if inv_in.fishbone is not None:
            inv.fishbone = inv_in.fishbone
        if inv_in.effectiveness_verification is not None:
            inv.effectiveness_verification = inv_in.effectiveness_verification
        inv.updated_at = datetime.datetime.utcnow()
    else:
        inv = Investigation(
            alert_id=inv_in.alert_id,
            batch_id=inv_in.batch_id,
            notes=inv_in.notes,
            cause_status=inv_in.cause_status,
            investigator_name=inv_in.investigator_name or "Dr. Sarah Chen (Senior Quality Eng)",
            five_whys=inv_in.five_whys,
            fishbone=inv_in.fishbone,
            effectiveness_verification=inv_in.effectiveness_verification
        )
        db.add(inv)

    db.commit()
    db.refresh(inv)
    return get_investigation_by_alert(inv.alert_id, db)

@app.get("/api/investigations/{investigation_id}/dossier", response_model=InvestigationDossierOut, tags=["Investigations"])
def get_investigation_dossier(investigation_id: int, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation record not found")

    alert = inv.alert
    batch = alert.batch if alert else None

    # Corrective actions
    actions_out = [
        CorrectiveActionOut(
            id=act.id,
            investigation_id=act.investigation_id,
            batch_id=act.batch_id,
            batch_code=batch.batch_code if batch else None,
            title=act.title,
            description=act.description,
            owner_name=act.owner_name,
            owner_role=act.owner_role,
            priority=act.priority,
            due_date=act.due_date,
            status=act.status,
            completion_note=act.completion_note,
            created_at=act.created_at,
            completed_at=act.completed_at
        ) for act in inv.actions
    ]

    # Sustainability impact estimate for this batch
    s_impact = {
        "batch_target_units": batch.target_quantity if batch else 5000,
        "potential_material_scrap_kg": 225.0,
        "potential_cip_water_l": 9000.0,
        "potential_energy_kwh": 1100.0,
        "potential_co2_kg": 475.0,
        "basis": "Avoided complete 5,000-unit batch dump via early cooling temperature trim (0.045 kg/u material, 1.80 L/u water, 0.22 kWh/u energy, 0.095 kg CO2e/u)."
    }

    return InvestigationDossierOut(
        investigation_id=inv.id,
        batch_id=inv.batch_id,
        batch_code=batch.batch_code if batch else "LOT-UNKNOWN",
        product_name=batch.product_profile.name if batch and batch.product_profile else "Cosmetic Bulk Emulsion",
        line_name=batch.production_line.name if batch and batch.production_line else "Production Line 01",
        deviation_title=f"Out-of-Bounds {alert.parameter.capitalize() if alert else 'Quality'} Deviation",
        observed_parameter=alert.parameter if alert else "temperature",
        observed_value=alert.observed_value if alert else 0.0,
        configured_bounds=f"{alert.lower_limit} – {alert.upper_limit} {alert.unit}" if alert else "N/A",
        severity=alert.severity if alert else "Critical",
        root_cause_summary=inv.notes or "Root cause investigation documented in 5 Whys and 6M Ishikawa fishbone analysis.",
        cause_status=inv.cause_status,
        investigator_name=inv.investigator_name,
        five_whys=inv.five_whys,
        fishbone=inv.fishbone,
        corrective_actions=actions_out,
        effectiveness_verification=inv.effectiveness_verification,
        sustainability_impact=s_impact,
        data_source_disclosure="CONFIDENTIAL PROTOTYPE REPORT — Generated from QualiSense AI Synthetic Manufacturing Simulation Scenario (LOT-2026-HYD-041). Decision-support record only; not an audited GMP batch record.",
        generated_at=datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    )

# --- CORRECTIVE ACTIONS ---
@app.get("/api/actions", response_model=List[CorrectiveActionOut], tags=["Corrective Actions"])
def list_actions(
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CorrectiveAction)
    if status_filter and status_filter != "All":
        query = query.filter(CorrectiveAction.status == status_filter)
    if priority and priority != "All":
        query = query.filter(CorrectiveAction.priority == priority)

    actions = query.order_by(desc(CorrectiveAction.created_at)).all()
    results = []
    for act in actions:
        b_code = None
        if act.investigation and act.investigation.alert and act.investigation.alert.batch:
            b_code = act.investigation.alert.batch.batch_code
        else:
            b = db.query(Batch).filter(Batch.id == act.batch_id).first()
            if b:
                b_code = b.batch_code

        results.append(CorrectiveActionOut(
            id=act.id,
            investigation_id=act.investigation_id,
            batch_id=act.batch_id,
            batch_code=b_code,
            title=act.title,
            description=act.description,
            owner_name=act.owner_name,
            owner_role=act.owner_role,
            priority=act.priority,
            due_date=act.due_date,
            status=act.status,
            completion_note=act.completion_note,
            created_at=act.created_at,
            completed_at=act.completed_at
        ))
    return results

@app.post("/api/actions", response_model=CorrectiveActionOut, tags=["Corrective Actions"])
def create_action(
    act_in: CorrectiveActionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_permission(CAPA_WRITE))
):
    new_act = CorrectiveAction(
        investigation_id=act_in.investigation_id,
        batch_id=act_in.batch_id,
        title=act_in.title,
        description=act_in.description,
        owner_name=act_in.owner_name,
        owner_role=act_in.owner_role or "Quality Engineer",
        priority=act_in.priority,
        due_date=act_in.due_date,
        status="Open"
    )
    db.add(new_act)
    db.commit()
    db.refresh(new_act)

    b = db.query(Batch).filter(Batch.id == new_act.batch_id).first()

    return CorrectiveActionOut(
        id=new_act.id,
        investigation_id=new_act.investigation_id,
        batch_id=new_act.batch_id,
        batch_code=b.batch_code if b else None,
        title=new_act.title,
        description=new_act.description,
        owner_name=new_act.owner_name,
        owner_role=new_act.owner_role,
        priority=new_act.priority,
        due_date=new_act.due_date,
        status=new_act.status,
        created_at=new_act.created_at
    )

@app.patch("/api/actions/{action_id}", response_model=CorrectiveActionOut, tags=["Corrective Actions"])
def update_action(
    action_id: int,
    act_update: CorrectiveActionUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(require_permission(CAPA_WRITE))
):
    act = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not act:
        raise HTTPException(status_code=404, detail="Action not found")

    if act_update.status:
        act.status = act_update.status
        if act_update.status in ["Completed", "Verified"] and not act.completed_at:
            act.completed_at = datetime.datetime.utcnow()
    if act_update.owner_name:
        act.owner_name = act_update.owner_name
    if act_update.priority:
        act.priority = act_update.priority
    if act_update.due_date:
        act.due_date = act_update.due_date
    if act_update.completion_note:
        act.completion_note = act_update.completion_note

    db.commit()
    db.refresh(act)

    b = db.query(Batch).filter(Batch.id == act.batch_id).first()

    return CorrectiveActionOut(
        id=act.id,
        investigation_id=act.investigation_id,
        batch_id=act.batch_id,
        batch_code=b.batch_code if b else None,
        title=act.title,
        description=act.description,
        owner_name=act.owner_name,
        owner_role=act.owner_role,
        priority=act.priority,
        due_date=act.due_date,
        status=act.status,
        completion_note=act.completion_note,
        created_at=act.created_at,
        completed_at=act.completed_at
    )

# --- QUALITY ANALYTICS ---
@app.get("/api/analytics/quality", tags=["Quality Analytics"])
def get_quality_analytics(db: Session = Depends(get_db)):
    batches = db.query(Batch).all()
    alerts = db.query(QualityAlert).all()

    total_batches = len(batches)
    reworked_batches = sum(1 for b in batches if b.status == "Rework")

    # Use centralized metrics service for 100% calculation consistency across platform
    fpq_metrics = QualityMetricsService.get_first_pass_metrics(db)
    fpq_pct = fpq_metrics["primary_fpq_rate"]

    # Pareto chart of alert parameters
    param_counts: Dict[str, int] = {}
    for a in alerts:
        param_counts[a.parameter] = param_counts.get(a.parameter, 0) + 1

    sorted_params = sorted(param_counts.items(), key=lambda x: x[1], reverse=True)
    total_alerts = sum(param_counts.values()) or 1
    cum_pct = 0.0
    pareto_data = []
    for param, count in sorted_params:
        pct = (count / total_alerts) * 100.0
        cum_pct += pct
        pareto_data.append({
            "parameter": param,
            "count": count,
            "percentage": round(min(100.0, pct), 1),
            "cumulative_percentage": round(min(100.0, cum_pct), 1)
        })

    # Line breakdown
    line_breakdown = []
    for line in db.query(ProductionLine).all():
        line_batches = [b for b in batches if b.line_id == line.id]
        l_total = len(line_batches)
        l_completed = [b for b in line_batches if b.status in ["Released", "Rework", "Rejected"]]
        l_fpq = sum(1 for b in l_completed if b.first_pass_quality)
        l_rate = round((l_fpq / len(l_completed) * 100.0), 1) if l_completed else 100.0
        line_breakdown.append({
            "line_name": line.name,
            "total_batches": l_total,
            "completed_batches": len(l_completed),
            "fpq_rate": min(100.0, l_rate),
            "open_deviations": sum(len([a for a in b.alerts if a.status != "Resolved"]) for b in line_batches)
        })

    return {
        "total_batches": total_batches,
        "first_pass_rate": fpq_pct,
        "completed_batches_count": fpq_metrics["completed_batches_count"],
        "completed_fpq_count": fpq_metrics["completed_fpq_count"],
        "total_monitored_batches": fpq_metrics["total_monitored_count"],
        "total_run_first_pass_rate": fpq_metrics["total_fpq_rate"],
        "reworked_batches_count": reworked_batches,
        "denominator_documentation": fpq_metrics["denominator_documentation"],
        "pareto_distribution": pareto_data,
        "line_breakdown": line_breakdown,
        "disclaimer": "Metrics calculated deterministically from persisted synthetic batch and alert records."
    }

# --- SUSTAINABILITY & RESOURCE IMPACT ---
@app.get("/api/sustainability/summary", response_model=SustainabilitySummary, tags=["Sustainability"])
def get_sustainability_summary(db: Session = Depends(get_db)):
    """
    Transparent resource-impact calculator:
    Uses documented demo assumptions for cosmetic bulk rework & cleaning:
    - Material intensity: 0.045 kg/reworked unit (raw material scrap loss + stabilizer addition)
    - Water intensity: 1.8 L/unit (Clean-In-Place 3-stage rinse & sterilization)
    - Energy intensity: 0.22 kWh/unit (re-heating to 75°C, high-shear re-emulsification & cooling)
    - Carbon factor: 0.095 kg CO2e/unit (based on energy mix + chemical detergent lifecycle)
    """
    records = db.query(SustainabilityRecord).filter(SustainabilityRecord.is_scenario_estimate == False).all()

    total_reworked = sum(r.reworked_units for r in records)
    total_mat = sum(r.material_kg for r in records)
    total_water = sum(r.water_l for r in records)
    total_energy = sum(r.energy_kwh for r in records)
    total_co2 = sum(r.co2_kg for r in records)

    # What-If Scenario Avoidance:
    # If LOT-2026-HYD-041 (5000 units) were detected late at packaging instead of early in-process,
    # the entire 5000-unit batch would have required full dump & rework (225 kg material, 9,000 L water, 1,100 kWh, 475 kg CO2e).
    # With early intervention, rework is prevented or limited.
    avoided_mat = 225.0
    avoided_water = 9000.0
    avoided_energy = 1100.0
    avoided_co2 = 475.0

    assumptions = {
        "material_intensity_per_unit_kg": 0.045,
        "water_cip_intensity_per_unit_l": 1.80,
        "energy_thermal_mixing_intensity_kwh": 0.22,
        "carbon_factor_kg_co2_per_unit": 0.095,
        "scenario_early_intervention_avoidance_basis": "Preventing total 5,000-unit batch loss via early temperature trim during Cooling stage."
    }

    formula_reference = (
        "Formulas:\n"
        "• Material Waste (kg) = Reworked Units × 0.045 kg\n"
        "• CIP Water Used (L) = Reworked Units × 1.80 L\n"
        "• Process Energy (kWh) = Reworked Units × 0.22 kWh\n"
        "• CO2e (kg) = Reworked Units × 0.095 kg CO2e\n"
        "• Avoided Resource = Baseline Late Rejection Scenario (5,000 units bulk loss) − Early Process Intervention Scenario"
    )

    disclaimer = (
        "ILLUSTRATIVE DEMO ESTIMATES: Calculated based on transparent engineering reference assumptions. "
        "These figures demonstrate decision-support workflow logic and do NOT represent certified L'Oréal environmental data or audited LCA."
    )

    return SustainabilitySummary(
        total_reworked_units=total_reworked,
        total_material_waste_kg=round(total_mat, 1),
        total_water_consumption_l=round(total_water, 1),
        total_energy_consumption_kwh=round(total_energy, 1),
        total_co2_kg=round(total_co2, 1),
        avoided_material_kg=avoided_mat,
        avoided_water_l=avoided_water,
        avoided_energy_kwh=avoided_energy,
        avoided_co2_kg=avoided_co2,
        assumptions=assumptions,
        formula_reference=formula_reference,
        disclaimer=disclaimer
    )

# --- OPTIONAL ML DEFECT RISK SIGNAL ---
@app.post("/api/ml/predict", response_model=MLPredictionOut, tags=["ML Signal"])
def predict_ml_risk(payload: MLPredictRequest):
    """
    Experimental ML Signal: Simple Random Forest predicting defect likelihood.
    Decision-support only; never overrides physical rules or automates batch disposition.
    """
    res = ml_model_service.predict(
        temperature=payload.temperature,
        ph=payload.ph,
        mixing_speed=payload.mixing_speed,
        viscosity=payload.viscosity,
        filling_quantity=payload.filling_quantity
    )
    return MLPredictionOut(**res)

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*65)
    print("  QualiSense AI — Cosmetic Quality & Defect Prevention Backend")
    print("  Starting Uvicorn server on http://127.0.0.1:8000")
    print("  Interactive Swagger Docs: http://127.0.0.1:8000/docs")
    print("="*65 + "\n")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

