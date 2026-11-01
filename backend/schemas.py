from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import datetime

# --- User ---
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

# --- Product Profile ---
class ProductProfileOut(BaseModel):
    id: int
    name: str
    code: str
    category: str
    target_units: int
    parameter_limits: Dict[str, Any]
    is_demo_profile: bool

    class Config:
        from_attributes = True

# --- Production Line ---
class ProductionLineOut(BaseModel):
    id: int
    name: str
    code: str
    location_label: str
    status: str

    class Config:
        from_attributes = True

# --- Production Reading ---
class ProductionReadingCreate(BaseModel):
    batch_id: int
    stage: str
    parameter: str
    value: float
    unit: str
    operator_name: Optional[str] = "Operator on Duty"
    source: Optional[str] = "Manual Sensor Check"

class ProductionReadingOut(BaseModel):
    id: int
    batch_id: int
    stage: str
    parameter: str
    value: float
    unit: str
    recorded_at: datetime.datetime
    operator_name: str
    source: str

    class Config:
        from_attributes = True

# --- Quality Alert ---
class QualityAlertOut(BaseModel):
    id: int
    batch_id: int
    batch_code: Optional[str] = None
    product_name: Optional[str] = None
    line_name: Optional[str] = None
    reading_id: Optional[int] = None
    parameter: str
    observed_value: float
    lower_limit: float
    upper_limit: float
    unit: str
    severity: str  # Critical, High, Medium, Info
    rule_name: str
    explanation: str
    status: str  # Open, Acknowledged, Investigating, Resolved
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    resolved_by: Optional[str] = None

    class Config:
        from_attributes = True

class QualityAlertUpdate(BaseModel):
    status: str
    resolved_by: Optional[str] = None

# --- Corrective Action ---
class CorrectiveActionCreate(BaseModel):
    investigation_id: Optional[int] = None
    batch_id: int
    title: str
    description: str
    owner_name: str
    owner_role: Optional[str] = "Quality Engineer"
    priority: str = "High"
    due_date: str

class CorrectiveActionUpdate(BaseModel):
    status: Optional[str] = None
    owner_name: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    completion_note: Optional[str] = None

class CorrectiveActionOut(BaseModel):
    id: int
    investigation_id: Optional[int] = None
    batch_id: int
    batch_code: Optional[str] = None
    title: str
    description: str
    owner_name: str
    owner_role: str
    priority: str
    due_date: str
    status: str
    completion_note: Optional[str] = None
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# --- Investigation ---
class InvestigationCreate(BaseModel):
    alert_id: int
    batch_id: int
    notes: Optional[str] = ""
    cause_status: str = "Under Investigation"
    investigator_name: Optional[str] = "Dr. Sarah Chen (Senior Quality Eng)"
    five_whys: Optional[List[Dict[str, Any]]] = None
    fishbone: Optional[Dict[str, List[Dict[str, Any]]]] = None
    effectiveness_verification: Optional[Dict[str, Any]] = None

class InvestigationUpdate(BaseModel):
    notes: Optional[str] = None
    cause_status: Optional[str] = None
    investigator_name: Optional[str] = None
    five_whys: Optional[List[Dict[str, Any]]] = None
    fishbone: Optional[Dict[str, List[Dict[str, Any]]]] = None
    effectiveness_verification: Optional[Dict[str, Any]] = None

class InvestigationOut(BaseModel):
    id: int
    alert_id: int
    batch_id: int
    batch_code: Optional[str] = None
    alert: Optional[QualityAlertOut] = None
    notes: Optional[str] = None
    cause_status: str
    investigator_name: str
    five_whys: Optional[List[Dict[str, Any]]] = None
    fishbone: Optional[Dict[str, List[Dict[str, Any]]]] = None
    effectiveness_verification: Optional[Dict[str, Any]] = None
    actions: List[CorrectiveActionOut] = []
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class InvestigationDossierOut(BaseModel):
    investigation_id: int
    batch_id: int
    batch_code: str
    product_name: str
    line_name: str
    deviation_title: str
    observed_parameter: str
    observed_value: float
    configured_bounds: str
    severity: str
    root_cause_summary: str
    cause_status: str
    investigator_name: str
    five_whys: Optional[List[Dict[str, Any]]] = None
    fishbone: Optional[Dict[str, List[Dict[str, Any]]]] = None
    corrective_actions: List[CorrectiveActionOut] = []
    effectiveness_verification: Optional[Dict[str, Any]] = None
    sustainability_impact: Dict[str, Any]
    data_source_disclosure: str
    generated_at: str

# --- Batch ---
class BatchCreate(BaseModel):
    batch_code: str
    product_profile_id: int
    line_id: int
    target_quantity: int = 5000

class BatchDispositionUpdate(BaseModel):
    status: str
    disposition_notes: Optional[str] = None

class BatchOut(BaseModel):
    id: int
    batch_code: str
    product_profile_id: int
    product_name: Optional[str] = None
    product_category: Optional[str] = None
    line_id: int
    line_name: Optional[str] = None
    status: str
    started_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    target_quantity: int
    actual_quantity: int
    first_pass_quality: bool
    disposition_notes: Optional[str] = None
    alert_count: int = 0
    open_alert_count: int = 0

    class Config:
        from_attributes = True

class BatchDetailOut(BatchOut):
    readings: List[ProductionReadingOut] = []
    alerts: List[QualityAlertOut] = []
    parameter_limits: Optional[Dict[str, Any]] = None

# --- Sustainability ---
class SustainabilityRecordOut(BaseModel):
    id: int
    batch_id: int
    reworked_units: int
    material_kg: float
    water_l: float
    energy_kwh: float
    co2_kg: float
    basis_notes: Optional[str] = None
    is_scenario_estimate: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SustainabilitySummary(BaseModel):
    total_reworked_units: int
    total_material_waste_kg: float
    total_water_consumption_l: float
    total_energy_consumption_kwh: float
    total_co2_kg: float
    avoided_material_kg: float
    avoided_water_l: float
    avoided_energy_kwh: float
    avoided_co2_kg: float
    assumptions: Dict[str, Any]
    formula_reference: str
    disclaimer: str

# --- Dashboard & Recommendations ---
class RecommendedAction(BaseModel):
    id: str
    priority: str
    title: str
    rationale: str
    action_type: str
    target_url: str
    target_label: str
    source_badge: str

class DashboardSummary(BaseModel):
    batches_monitored: int
    active_deviations: int
    batches_needing_review: int
    first_pass_quality_rate: float
    total_rework_units: int
    estimated_avoidable_waste_kg: float
    logged_material_waste_kg: float = 0.0
    potential_avoidable_waste_kg: float = 0.0
    fpq_basis_note: Optional[str] = None
    recent_batches: List[BatchOut]
    recent_alerts: List[QualityAlertOut]
    severity_distribution: Dict[str, int]
    quality_trend: List[Dict[str, Any]]
    recommended_actions_today: List[RecommendedAction] = []
    disclaimer: str

# --- ML Signal ---
class MLPredictRequest(BaseModel):
    temperature: float
    ph: float
    mixing_speed: float
    viscosity: float
    filling_quantity: float
    product_category: Optional[str] = "Skincare"

class MLPredictionOut(BaseModel):
    batch_id: Optional[int] = None
    defect_risk_probability: float
    risk_level: str  # "Low", "Moderate", "Elevated", "Critical"
    model_version: str
    top_contributing_features: List[Dict[str, Any]]
    is_model_available: bool
    disclaimer: str

