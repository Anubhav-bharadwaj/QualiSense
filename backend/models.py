import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    organisation = Column(String(150), default="L'Oréal Plant Operations", nullable=True)
    role = Column(String(50), nullable=False, default="Viewer")  # Administrator, Quality Engineer, Production Manager, Viewer
    avatar = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    refresh_sessions = relationship("RefreshSession", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

class ProductProfile(Base):
    __tablename__ = "product_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False)  # Skincare, Haircare, Serum
    target_units = Column(Integer, default=5000)
    # JSON containing parameter specs: min, max, unit, critical_min, critical_max, description
    parameter_limits = Column(JSON, nullable=False)
    is_demo_profile = Column(Boolean, default=True)

    batches = relationship("Batch", back_populates="product_profile")

class ProductionLine(Base):
    __tablename__ = "production_lines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    location_label = Column(String(100), nullable=False)
    status = Column(String(50), default="Active")  # Active, Maintenance, Idle

    batches = relationship("Batch", back_populates="production_line")

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_code = Column(String(50), unique=True, index=True, nullable=False)
    product_profile_id = Column(Integer, ForeignKey("product_profiles.id"), nullable=False)
    line_id = Column(Integer, ForeignKey("production_lines.id"), nullable=False)
    status = Column(String(50), default="In Progress")  # In Progress, Quality Review, Released, Rework, Rejected
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    target_quantity = Column(Integer, default=5000)
    actual_quantity = Column(Integer, default=5000)
    first_pass_quality = Column(Boolean, default=True)
    disposition_notes = Column(Text, nullable=True)

    product_profile = relationship("ProductProfile", back_populates="batches")
    production_line = relationship("ProductionLine", back_populates="batches")
    readings = relationship("ProductionReading", back_populates="batch", cascade="all, delete-orphan")
    alerts = relationship("QualityAlert", back_populates="batch", cascade="all, delete-orphan")
    sustainability_records = relationship("SustainabilityRecord", back_populates="batch", cascade="all, delete-orphan")

class ProductionReading(Base):
    __tablename__ = "production_readings"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    stage = Column(String(50), nullable=False)  # Pre-mix, Mixing & Heating, Homogenization, Cooling, Filling
    parameter = Column(String(50), nullable=False)  # Temperature, pH, Mixing speed, Viscosity, Filling quantity
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    operator_name = Column(String(100), default="Operator on Duty")
    source = Column(String(50), default="Inline Sensor Probe")  # Inline Sensor Probe, Manual Sensor Check, Lab Verification

    batch = relationship("Batch", back_populates="readings")
    alerts = relationship("QualityAlert", back_populates="reading")

class QualityAlert(Base):
    __tablename__ = "quality_alerts"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    reading_id = Column(Integer, ForeignKey("production_readings.id"), nullable=True)
    parameter = Column(String(50), nullable=False)
    observed_value = Column(Float, nullable=False)
    lower_limit = Column(Float, nullable=False)
    upper_limit = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    severity = Column(String(20), nullable=False)  # Critical, High, Medium, Info
    rule_name = Column(String(100), nullable=False)
    explanation = Column(Text, nullable=False)
    status = Column(String(50), default="Open")  # Open, Acknowledged, Investigating, Resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True)

    batch = relationship("Batch", back_populates="alerts")
    reading = relationship("ProductionReading", back_populates="alerts")
    investigations = relationship("Investigation", back_populates="alert", cascade="all, delete-orphan")

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("quality_alerts.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    notes = Column(Text, nullable=True)
    cause_status = Column(String(50), default="Under Investigation")  # Suspected, Under Investigation, Engineer-Confirmed, Ruled Out
    investigator_name = Column(String(100), default="Dr. Sarah Chen (Senior Quality Eng)")
    # JSON list of { "step": 1, "question": "Why?", "answer": "..." }
    five_whys = Column(JSON, nullable=True)
    # JSON dict of { "Machine": [...], "Method": [...], "Material": [...], "Manpower": [...], "Measurement": [...], "Environment": [...] }
    fishbone = Column(JSON, nullable=True)
    # JSON dict of { "verification_date": "...", "verification_owner": "...", "post_readings": [...], "recurred": False, "status": "Effective", "notes": "..." }
    effectiveness_verification = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    alert = relationship("QualityAlert", back_populates="investigations")
    actions = relationship("CorrectiveAction", back_populates="investigation", cascade="all, delete-orphan")

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    owner_name = Column(String(100), nullable=False)
    owner_role = Column(String(100), default="Quality Engineer")
    priority = Column(String(20), default="High")  # Critical, High, Medium, Low
    due_date = Column(String(50), nullable=False)
    status = Column(String(50), default="Open")  # Open, In Progress, Completed, Verified
    completion_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    investigation = relationship("Investigation", back_populates="actions")

class SustainabilityRecord(Base):
    __tablename__ = "sustainability_records"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    reworked_units = Column(Integer, default=0)
    material_kg = Column(Float, default=0.0)
    water_l = Column(Float, default=0.0)
    energy_kwh = Column(Float, default=0.0)
    co2_kg = Column(Float, default=0.0)
    basis_notes = Column(Text, nullable=True)
    is_scenario_estimate = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    batch = relationship("Batch", back_populates="sustainability_records")

class SecomSample(Base):
    __tablename__ = "secom_samples"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(100), default="UCI SECOM Dataset")
    original_index = Column(Integer, unique=True, index=True, nullable=False)
    original_label = Column(Integer, nullable=False)  # -1 (Pass) or 1 (Fail)
    quality_status = Column(String(20), index=True, nullable=False)  # "Pass" or "Fail"
    recorded_at = Column(String(50), nullable=True)  # e.g. "19/07/2008 11:55:00"
    missing_count = Column(Integer, default=0)
    features_json = Column(JSON, nullable=False)  # {"Sensor_0": 3030.93, "Sensor_1": null, ...}
    imported_at = Column(DateTime, default=datetime.datetime.utcnow)

class DatasetImport(Base):
    __tablename__ = "dataset_imports"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(100), nullable=False)
    source = Column(String(150), nullable=False)
    total_records = Column(Integer, default=0)
    total_features = Column(Integer, default=0)
    pass_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)
    successful_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    missing_values_count = Column(Integer, default=0)
    constant_features_count = Column(Integer, default=0)
    import_status = Column(String(50), default="Completed")
    feature_stats_json = Column(JSON, nullable=True)  # Precomputed stats for all 590 sensors
    metadata_json = Column(JSON, nullable=True)
    imported_at = Column(DateTime, default=datetime.datetime.utcnow)

class RefreshSession(Base):
    __tablename__ = "refresh_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, index=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="refresh_sessions")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reset_tokens")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    target_type = Column(String(50), nullable=True)
    target_id = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    metadata_json = Column(JSON, nullable=True)

    actor = relationship("User", foreign_keys=[actor_user_id])



