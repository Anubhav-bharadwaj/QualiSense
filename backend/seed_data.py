import datetime
from sqlalchemy.orm import Session
from .database import engine, Base
from .models import (
    User, ProductProfile, ProductionLine, Batch, ProductionReading,
    QualityAlert, Investigation, CorrectiveAction, SustainabilityRecord
)
from .rules import DEFAULT_ILLUSTRATIVE_LIMITS

try:
    from .auth.security import hash_password
except ImportError:
    from backend.auth.security import hash_password

def seed_database(db: Session):
    """Seed comprehensive realistic synthetic demonstration data while strictly preserving SECOM tables."""
    # Create tables if not exist
    Base.metadata.create_all(bind=engine)

    # Clean only cosmetic manufacturing demonstration records (Never drop SECOM research dataset)
    db.query(ProductionReading).delete()
    db.query(QualityAlert).delete()
    db.query(CorrectiveAction).delete()
    db.query(Investigation).delete()
    db.query(SustainabilityRecord).delete()
    db.query(Batch).delete()
    db.query(ProductProfile).delete()
    db.query(ProductionLine).delete()
    db.query(User).delete()
    db.commit()

    # 1. Users (All 4 core roles with Argon2id encrypted passwords)
    now = datetime.datetime.utcnow()
    user_admin = User(
        name="Alexandre Martin",
        email="admin@qualisense.internal",
        password_hash=hash_password("AdminPass@2026!"),
        role="Administrator",
        organisation="L’Oréal Global Quality & Operations",
        avatar="AM",
        is_active=True,
        is_verified=True,
        created_at=now,
        updated_at=now
    )
    user_quality = User(
        name="Dr. Sarah Chen",
        email="sarah.chen@qualisense-demo.internal",
        password_hash=hash_password("QualityEng@2026!"),
        role="Quality Engineer",
        organisation="Cosmetics Plant 04 (EMEA)",
        avatar="SC",
        is_active=True,
        is_verified=True,
        created_at=now,
        updated_at=now
    )
    user_manager = User(
        name="Marc Dupont",
        email="marc.dupont@qualisense-demo.internal",
        password_hash=hash_password("ProdMgr@2026!"),
        role="Production Manager",
        organisation="Cosmetics Plant 04 (EMEA)",
        avatar="MD",
        is_active=True,
        is_verified=True,
        created_at=now,
        updated_at=now
    )
    user_operator = User(
        name="Elena Rossi",
        email="elena.rossi@qualisense-demo.internal",
        password_hash=hash_password("ViewerPass@2026!"),
        role="Viewer",
        organisation="Cosmetics Plant 04 (EMEA)",
        avatar="ER",
        is_active=True,
        is_verified=True,
        created_at=now,
        updated_at=now
    )
    db.add_all([user_admin, user_quality, user_manager, user_operator])
    db.flush()

    # 2. Product Profiles
    profile_emulsion = ProductProfile(
        name="Hydra-Luminous Daily Emulsion 50ml",
        code="PROD-HYD-50",
        category="Skincare",
        target_units=5000,
        parameter_limits=DEFAULT_ILLUSTRATIVE_LIMITS,
        is_demo_profile=True
    )

    shampoo_limits = {
        "Temperature": {
            "min": 30.0,
            "max": 38.0,
            "critical_min": 28.0,
            "critical_max": 40.0,
            "unit": "°C",
            "near_limit_margin": 1.0,
            "description": "Preserves surfactant micelle structure and clarity."
        },
        "pH": {
            "min": 5.2,
            "max": 6.2,
            "critical_min": 4.8,
            "critical_max": 6.6,
            "unit": "pH",
            "near_limit_margin": 0.15,
            "description": "Essential for hair cuticle closure and scalp balance."
        },
        "Mixing speed": {
            "min": 600.0,
            "max": 850.0,
            "critical_min": 500.0,
            "critical_max": 950.0,
            "unit": "RPM",
            "near_limit_margin": 30.0,
            "description": "Avoids foam generation while homogenizing viscosity builders."
        },
        "Viscosity": {
            "min": 3200.0,
            "max": 4100.0,
            "critical_min": 2900.0,
            "critical_max": 4500.0,
            "unit": "cP",
            "near_limit_margin": 100.0,
            "description": "Ensures controlled bottle dispensing and consumer hand feel."
        },
        "Filling quantity": {
            "min": 247.0,
            "max": 253.0,
            "critical_min": 244.0,
            "critical_max": 256.0,
            "unit": "ml",
            "near_limit_margin": 1.0,
            "description": "Meets net content packaging declaration."
        }
    }
    profile_shampoo = ProductProfile(
        name="Pro-Keratin Repair Shampoo 250ml",
        code="PROD-SHA-250",
        category="Haircare",
        target_units=12000,
        parameter_limits=shampoo_limits,
        is_demo_profile=True
    )

    serum_limits = {
        "Temperature": {
            "min": 22.0,
            "max": 28.0,
            "critical_min": 20.0,
            "critical_max": 30.0,
            "unit": "°C",
            "near_limit_margin": 0.8,
            "description": "Strict low-temperature processing for bio-active peptide integrity."
        },
        "pH": {
            "min": 5.5,
            "max": 6.5,
            "critical_min": 5.0,
            "critical_max": 7.0,
            "unit": "pH",
            "near_limit_margin": 0.15,
            "description": "Maintains physiological bioavailability of encapsulated actives."
        },
        "Mixing speed": {
            "min": 500.0,
            "max": 750.0,
            "critical_min": 400.0,
            "critical_max": 850.0,
            "unit": "RPM",
            "near_limit_margin": 25.0,
            "description": "Gentle laminar blending to protect liposomal nanocarriers."
        },
        "Viscosity": {
            "min": 1800.0,
            "max": 2400.0,
            "critical_min": 1600.0,
            "critical_max": 2600.0,
            "unit": "cP",
            "near_limit_margin": 80.0,
            "description": "Dropper uptake consistency and rapid skin penetration kinetics."
        },
        "Filling quantity": {
            "min": 29.5,
            "max": 30.5,
            "critical_min": 29.0,
            "critical_max": 31.0,
            "unit": "ml",
            "near_limit_margin": 0.2,
            "description": "High-value active dosing accuracy."
        }
    }
    profile_serum = ProductProfile(
        name="Revitalizing Night Active Serum 30ml",
        code="PROD-SER-30",
        category="Serum",
        target_units=3500,
        parameter_limits=serum_limits,
        is_demo_profile=True
    )

    db.add_all([profile_emulsion, profile_shampoo, profile_serum])
    db.flush()

    # 3. Production Lines
    line_1 = ProductionLine(
        name="Line 01 - Emulsions & Creams",
        code="LINE-01",
        location_label="Building A, Bay 3",
        status="Active"
    )
    line_2 = ProductionLine(
        name="Line 02 - Haircare & Surfactants",
        code="LINE-02",
        location_label="Building B, Bay 1",
        status="Active"
    )
    line_3 = ProductionLine(
        name="Line 03 - Precision Active Serums",
        code="LINE-03",
        location_label="Cleanroom Suite C",
        status="Active"
    )
    db.add_all([line_1, line_2, line_3])
    db.flush()

    now = datetime.datetime.utcnow()

    # 4. Target Demo Batch (LOT-2026-HYD-041) with out-of-range temperature spike!
    demo_batch = Batch(
        batch_code="LOT-2026-HYD-041",
        product_profile_id=profile_emulsion.id,
        line_id=line_1.id,
        status="Quality Review",
        started_at=now - datetime.timedelta(hours=2, minutes=30),
        target_quantity=5000,
        actual_quantity=5000,
        first_pass_quality=False,
        disposition_notes="Batch held at Cooling Stage pending investigation of thermal excursion to 42.8 °C."
    )
    db.add(demo_batch)
    db.flush()

    # Readings for Demo Batch
    r1 = ProductionReading(
        batch_id=demo_batch.id,
        stage="Pre-mix",
        parameter="Temperature",
        value=36.8,
        unit="°C",
        recorded_at=demo_batch.started_at + datetime.timedelta(minutes=15),
        operator_name="Elena Rossi",
        source="Inline Sensor Probe"
    )
    r2 = ProductionReading(
        batch_id=demo_batch.id,
        stage="Pre-mix",
        parameter="Mixing speed",
        value=740.0,
        unit="RPM",
        recorded_at=demo_batch.started_at + datetime.timedelta(minutes=20),
        operator_name="Elena Rossi",
        source="Inline Sensor Probe"
    )
    r3 = ProductionReading(
        batch_id=demo_batch.id,
        stage="Mixing & Heating",
        parameter="Temperature",
        value=38.4,
        unit="°C",
        recorded_at=demo_batch.started_at + datetime.timedelta(minutes=45),
        operator_name="Elena Rossi",
        source="Inline Sensor Probe"
    )
    r4 = ProductionReading(
        batch_id=demo_batch.id,
        stage="Mixing & Heating",
        parameter="pH",
        value=5.42,
        unit="pH",
        recorded_at=demo_batch.started_at + datetime.timedelta(minutes=55),
        operator_name="Elena Rossi",
        source="Lab Verification"
    )
    r5 = ProductionReading(
        batch_id=demo_batch.id,
        stage="Homogenization",
        parameter="Mixing speed",
        value=860.0,
        unit="RPM",
        recorded_at=demo_batch.started_at + datetime.timedelta(hours=1, minutes=15),
        operator_name="Elena Rossi",
        source="Inline Sensor Probe"
    )
    r6 = ProductionReading(
        batch_id=demo_batch.id,
        stage="Homogenization",
        parameter="Viscosity",
        value=3180.0,
        unit="cP",
        recorded_at=demo_batch.started_at + datetime.timedelta(hours=1, minutes=30),
        operator_name="Elena Rossi",
        source="Inline Sensor Probe"
    )
    # The Critical Out-of-Range Spike in Cooling Stage!
    r7_spike = ProductionReading(
        batch_id=demo_batch.id,
        stage="Cooling",
        parameter="Temperature",
        value=42.8,
        unit="°C",
        recorded_at=demo_batch.started_at + datetime.timedelta(hours=1, minutes=50),
        operator_name="Elena Rossi",
        source="Inline Sensor Probe"
    )
    db.add_all([r1, r2, r3, r4, r5, r6, r7_spike])
    db.flush()

    # Alert for Demo Batch
    demo_alert = QualityAlert(
        batch_id=demo_batch.id,
        reading_id=r7_spike.id,
        parameter="Temperature",
        observed_value=42.8,
        lower_limit=35.0,
        upper_limit=40.0,
        unit="°C",
        severity="Critical",
        rule_name="RULE_CRIT_HIGH_TEMPERATURE",
        explanation="CRITICAL HIGH DEVIATION: Temperature measured at 42.8 °C, which exceeds critical threshold 42.0 °C (configured upper limit: 40.0 °C, +2.8 °C excursion). Impact: Maintains lipid phase dispersion and prevents premature emulsion crystallization or active degradation. Immediate batch hold and quality engineering review required.",
        status="Investigating",
        created_at=r7_spike.recorded_at
    )
    db.add(demo_alert)
    db.flush()

    # Investigation for Demo Batch
    demo_investigation = Investigation(
        alert_id=demo_alert.id,
        batch_id=demo_batch.id,
        notes="Operator Elena Rossi noted that during the cooling ramp, chiller jacket return line valve showed delayed reaction. Thermocouple TC-04 was cross-verified with calibrated handheld thermometer (42.7 °C), confirming physical temperature rise rather than sensor drift.",
        cause_status="Engineer-Confirmed",
        investigator_name="Dr. Sarah Chen (Senior Quality Eng)",
        five_whys=[
            {
                "step": 1,
                "question": "Why did the batch temperature reach 42.8 °C during the cooling phase?",
                "answer": "The jacket coolant flow rate dropped by 65% below recipe target during phase 3 emulsification."
            },
            {
                "step": 2,
                "question": "Why did the jacket coolant flow rate drop?",
                "answer": "The secondary pneumatic coolant bypass valve remained stuck at only 15% opening despite command."
            },
            {
                "step": 3,
                "question": "Why was the pneumatic actuator stuck?",
                "answer": "Air pressure supply dropped to 2.8 bar due to severe particulate clogging in the line regulator filter."
            },
            {
                "step": 4,
                "question": "Why was the line regulator filter clogged?",
                "answer": "The 30-day filter cartridge replacement interval had elapsed 14 days prior without replacement."
            },
            {
                "step": 5,
                "question": "Why was the scheduled maintenance replacement missed?",
                "answer": "Auxiliary pneumatic filtration was tracked on manual paper logs rather than the automated plant CMMS maintenance schedule."
            }
        ],
        fishbone={
            "Machine": [
                {"cause": "Pneumatic valve actuator pilot pressure drop (2.8 bar vs 5.5 bar nominal)", "status": "Engineer-Confirmed"},
                {"cause": "Chiller recirculation pump mechanical seal leak", "status": "Ruled Out"}
            ],
            "Method": [
                {"cause": "Cooling ramp verification performed at 30 min checkpoint instead of inline telemetry", "status": "Suspected"},
                {"cause": "Emulsion recipe sequence discrepancy", "status": "Ruled Out"}
            ],
            "Material": [
                {"cause": "Wax raw material lot viscosity within specification (3,150 cP)", "status": "Ruled Out"},
                {"cause": "Purified water temperature inlet nominal (14.2 °C)", "status": "Ruled Out"}
            ],
            "Manpower": [
                {"cause": "Operator responded and placed batch on hold within 6 minutes of alert", "status": "Ruled Out"},
                {"cause": "Shift handover documentation incomplete for chiller maintenance note", "status": "Under Investigation"}
            ],
            "Measurement": [
                {"cause": "Thermocouple TC-04 dual sensor calibration verified at 42.7 °C", "status": "Ruled Out"},
                {"cause": "Inline viscometer signal noise", "status": "Ruled Out"}
            ],
            "Environment": [
                {"cause": "Bay 3 cleanroom ambient temperature 21.4 °C (nominal specification)", "status": "Ruled Out"},
                {"cause": "Ambient humidity variation (48% RH)", "status": "Ruled Out"}
            ]
        },
        effectiveness_verification={
            "verification_date": "2026-11-03",
            "verification_owner": "Marc Dupont (Plant Manager)",
            "effectiveness_status": "Pending Verification",
            "deviation_recurred": False,
            "post_intervention_readings": [
                {"stage": "Cooling Trim", "parameter": "temperature", "value": 37.4, "unit": "°C", "in_spec": True}
            ],
            "notes": "Pneumatic air regulator filter replaced. Target pressure stabilized at 5.6 bar. Awaiting 3 consecutive cooling cycle logs before signing off final effectiveness."
        },
        created_at=demo_alert.created_at + datetime.timedelta(minutes=10)
    )
    db.add(demo_investigation)
    db.flush()

    # Corrective Action for Demo Batch
    demo_action = CorrectiveAction(
        investigation_id=demo_investigation.id,
        batch_id=demo_batch.id,
        title="Replace Pneumatic Chiller Filter & Integrate Line 01 Air Regulators into CMMS",
        description="1) Immediately replace clogged pneumatic air filter on Line 01 chiller actuator.\n2) Migrate Line 01 auxiliary air regulators to automated weekly CMMS work order schedule.\n3) Complete thermal stability test protocol on Batch LOT-2026-HYD-041 sample to verify if active degradation occurred.",
        owner_name="Marc Dupont",
        owner_role="Plant Manager",
        priority="Critical",
        due_date="2026-11-04",
        status="In Progress",
        completion_note="Cartridge replaced and pressure verified at 5.6 bar. CMMS recurring task created (WO-88241). Stability testing sample submitted to lab.",
        created_at=demo_investigation.created_at + datetime.timedelta(minutes=15)
    )
    db.add(demo_action)

    # 5. Seed Historical Batches for Realistic Analytics & Trends
    # Batch 2: LOT-2026-HYD-040 (Released, First-Pass Quality)
    b2 = Batch(
        batch_code="LOT-2026-HYD-040",
        product_profile_id=profile_emulsion.id,
        line_id=line_1.id,
        status="Released",
        started_at=now - datetime.timedelta(days=1, hours=4),
        completed_at=now - datetime.timedelta(days=1, hours=1),
        target_quantity=5000,
        actual_quantity=5000,
        first_pass_quality=True,
        disposition_notes="All process parameters verified within bounds. Released by Quality QA."
    )
    db.add(b2)
    db.flush()
    db.add_all([
        ProductionReading(batch_id=b2.id, stage="Pre-mix", parameter="Temperature", value=37.1, unit="°C", recorded_at=b2.started_at + datetime.timedelta(minutes=15), operator_name="Elena Rossi"),
        ProductionReading(batch_id=b2.id, stage="Mixing & Heating", parameter="pH", value=5.35, unit="pH", recorded_at=b2.started_at + datetime.timedelta(minutes=45), operator_name="Elena Rossi"),
        ProductionReading(batch_id=b2.id, stage="Homogenization", parameter="Viscosity", value=3100.0, unit="cP", recorded_at=b2.started_at + datetime.timedelta(hours=1, minutes=15), operator_name="Elena Rossi"),
        ProductionReading(batch_id=b2.id, stage="Cooling", parameter="Temperature", value=38.2, unit="°C", recorded_at=b2.started_at + datetime.timedelta(hours=1, minutes=45), operator_name="Elena Rossi"),
        ProductionReading(batch_id=b2.id, stage="Filling", parameter="Filling quantity", value=200.4, unit="ml", recorded_at=b2.started_at + datetime.timedelta(hours=2, minutes=20), operator_name="Elena Rossi")
    ])

    # Batch 3: LOT-2026-SHA-109 (Released, Haircare, First Pass Quality)
    b3 = Batch(
        batch_code="LOT-2026-SHA-109",
        product_profile_id=profile_shampoo.id,
        line_id=line_2.id,
        status="Released",
        started_at=now - datetime.timedelta(days=1, hours=8),
        completed_at=now - datetime.timedelta(days=1, hours=4),
        target_quantity=12000,
        actual_quantity=12000,
        first_pass_quality=True,
        disposition_notes="Released. Optimal batch metrics."
    )
    db.add(b3)
    db.flush()
    db.add_all([
        ProductionReading(batch_id=b3.id, stage="Pre-mix", parameter="Temperature", value=34.2, unit="°C", recorded_at=b3.started_at + datetime.timedelta(minutes=20), operator_name="Marc Dupont"),
        ProductionReading(batch_id=b3.id, stage="Mixing & Heating", parameter="pH", value=5.65, unit="pH", recorded_at=b3.started_at + datetime.timedelta(minutes=50), operator_name="Marc Dupont"),
        ProductionReading(batch_id=b3.id, stage="Homogenization", parameter="Mixing speed", value=780.0, unit="RPM", recorded_at=b3.started_at + datetime.timedelta(hours=1, minutes=30), operator_name="Marc Dupont"),
        ProductionReading(batch_id=b3.id, stage="Cooling", parameter="Viscosity", value=3650.0, unit="cP", recorded_at=b3.started_at + datetime.timedelta(hours=2, minutes=15), operator_name="Marc Dupont"),
        ProductionReading(batch_id=b3.id, stage="Filling", parameter="Filling quantity", value=249.8, unit="ml", recorded_at=b3.started_at + datetime.timedelta(hours=3, minutes=10), operator_name="Marc Dupont")
    ])

    # Batch 4: LOT-2026-SER-022 (Released, Serum, First Pass Quality)
    b4 = Batch(
        batch_code="LOT-2026-SER-022",
        product_profile_id=profile_serum.id,
        line_id=line_3.id,
        status="Released",
        started_at=now - datetime.timedelta(days=2),
        completed_at=now - datetime.timedelta(days=1, hours=20),
        target_quantity=3500,
        actual_quantity=3500,
        first_pass_quality=True,
        disposition_notes="Released under sterile protocol."
    )
    db.add(b4)
    db.flush()
    db.add_all([
        ProductionReading(batch_id=b4.id, stage="Pre-mix", parameter="Temperature", value=24.5, unit="°C", recorded_at=b4.started_at + datetime.timedelta(minutes=15), operator_name="Dr. Sarah Chen"),
        ProductionReading(batch_id=b4.id, stage="Mixing & Heating", parameter="pH", value=5.92, unit="pH", recorded_at=b4.started_at + datetime.timedelta(minutes=40), operator_name="Dr. Sarah Chen"),
        ProductionReading(batch_id=b4.id, stage="Homogenization", parameter="Mixing speed", value=620.0, unit="RPM", recorded_at=b4.started_at + datetime.timedelta(hours=1, minutes=10), operator_name="Dr. Sarah Chen"),
        ProductionReading(batch_id=b4.id, stage="Cooling", parameter="Viscosity", value=2120.0, unit="cP", recorded_at=b4.started_at + datetime.timedelta(hours=1, minutes=40), operator_name="Dr. Sarah Chen"),
        ProductionReading(batch_id=b4.id, stage="Filling", parameter="Filling quantity", value=29.9, unit="ml", recorded_at=b4.started_at + datetime.timedelta(hours=2, minutes=30), operator_name="Dr. Sarah Chen")
    ])

    # Batch 5: LOT-2026-HYD-039 (Rework batch - Viscosity deviation resolved)
    b5 = Batch(
        batch_code="LOT-2026-HYD-039",
        product_profile_id=profile_emulsion.id,
        line_id=line_1.id,
        status="Rework",
        started_at=now - datetime.timedelta(days=3),
        completed_at=now - datetime.timedelta(days=2, hours=18),
        target_quantity=5000,
        actual_quantity=4850,
        first_pass_quality=False,
        disposition_notes="Batch required 600 units rework due to viscosity drift (2620 cP vs 2800 cP min). Shear trim applied."
    )
    db.add(b5)
    db.flush()
    r_b5 = ProductionReading(
        batch_id=b5.id,
        stage="Homogenization",
        parameter="Viscosity",
        value=2620.0,
        unit="cP",
        recorded_at=b5.started_at + datetime.timedelta(hours=1, minutes=20),
        operator_name="Elena Rossi"
    )
    db.add(r_b5)
    db.flush()
    a_b5 = QualityAlert(
        batch_id=b5.id,
        reading_id=r_b5.id,
        parameter="Viscosity",
        observed_value=2620.0,
        lower_limit=2800.0,
        upper_limit=3500.0,
        unit="cP",
        severity="High",
        rule_name="RULE_LOW_VISCOSITY",
        explanation="HIGH DEVIATION: Viscosity observed at 2620 cP, below configured lower limit of 2800 cP (-180 cP).",
        status="Resolved",
        created_at=r_b5.recorded_at,
        resolved_at=r_b5.recorded_at + datetime.timedelta(hours=3),
        resolved_by="Dr. Sarah Chen"
    )
    db.add(a_b5)
    # Add historical sustainability record for this reworked batch
    s_b5 = SustainabilityRecord(
        batch_id=b5.id,
        reworked_units=600,
        material_kg=27.0,      # 600 * 0.045 kg
        water_l=1080.0,        # 600 * 1.8 L
        energy_kwh=132.0,      # 600 * 0.22 kWh
        co2_kg=57.0,           # 600 * 0.095 kg
        basis_notes="Recorded rework reprocessing of 600 units: CIP rinse, re-homogenization shear cycle.",
        is_scenario_estimate=False,
        created_at=b5.completed_at
    )
    db.add(s_b5)

    # Batch 6: LOT-2026-SHA-108 (Active, In Progress on Line 02)
    b6 = Batch(
        batch_code="LOT-2026-SHA-108",
        product_profile_id=profile_shampoo.id,
        line_id=line_2.id,
        status="In Progress",
        started_at=now - datetime.timedelta(minutes=45),
        target_quantity=12000,
        actual_quantity=12000,
        first_pass_quality=True,
        disposition_notes="In Progress - Phase 2 Mixing."
    )
    db.add(b6)
    db.flush()
    db.add_all([
        ProductionReading(batch_id=b6.id, stage="Pre-mix", parameter="Temperature", value=33.8, unit="°C", recorded_at=b6.started_at + datetime.timedelta(minutes=15), operator_name="Marc Dupont"),
        ProductionReading(batch_id=b6.id, stage="Mixing & Heating", parameter="pH", value=5.58, unit="pH", recorded_at=b6.started_at + datetime.timedelta(minutes=35), operator_name="Marc Dupont")
    ])

    # Batch 7: LOT-2026-SER-021 (Released, First-Pass Quality)
    b7 = Batch(
        batch_code="LOT-2026-SER-021",
        product_profile_id=profile_serum.id,
        line_id=line_3.id,
        status="Released",
        started_at=now - datetime.timedelta(days=4),
        completed_at=now - datetime.timedelta(days=3, hours=21),
        target_quantity=3500,
        actual_quantity=3500,
        first_pass_quality=True,
        disposition_notes="Released. Lab microbiological and purity check passed."
    )
    db.add(b7)

    # Batch 8: LOT-2026-HYD-038 (Released, Emulsion, First-Pass Quality)
    b8 = Batch(
        batch_code="LOT-2026-HYD-038",
        product_profile_id=profile_emulsion.id,
        line_id=line_1.id,
        status="Released",
        started_at=now - datetime.timedelta(days=5),
        completed_at=now - datetime.timedelta(days=4, hours=22),
        target_quantity=5000,
        actual_quantity=5000,
        first_pass_quality=True,
        disposition_notes="Released. Certified standard run."
    )
    db.add(b8)

    db.commit()

    # Ensure SECOM dataset is populated if empty
    from backend.models import SecomSample
    if db.query(SecomSample).count() == 0:
        from backend.datasets.secom.importer import import_secom_dataset
        import_secom_dataset(db, force_reload=False)

    print("Database successfully seeded with realistic synthetic demonstration data.")

