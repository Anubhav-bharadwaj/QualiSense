from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
import datetime
from .models import ProductionReading, QualityAlert, Batch, ProductProfile

# Illustrative demo limits reference (Note: NOT official L'Oréal specifications)
DEFAULT_ILLUSTRATIVE_LIMITS = {
    "Temperature": {
        "min": 35.0,
        "max": 40.0,
        "critical_min": 32.0,
        "critical_max": 42.0,
        "unit": "°C",
        "near_limit_margin": 1.0,
        "description": "Maintains lipid phase dispersion and prevents premature emulsion crystallization or active degradation."
    },
    "pH": {
        "min": 5.0,
        "max": 6.0,
        "critical_min": 4.5,
        "critical_max": 6.5,
        "unit": "pH",
        "near_limit_margin": 0.15,
        "description": "Crucial for topical skin compatibility, preservative efficacy, and colloidal suspension stability."
    },
    "Mixing speed": {
        "min": 700.0,
        "max": 900.0,
        "critical_min": 600.0,
        "critical_max": 1050.0,
        "unit": "RPM",
        "near_limit_margin": 30.0,
        "description": "Ensures uniform droplet size distribution without micro-bubble entrainment or polymer shear breakdown."
    },
    "Viscosity": {
        "min": 2800.0,
        "max": 3500.0,
        "critical_min": 2500.0,
        "critical_max": 3800.0,
        "unit": "cP",
        "near_limit_margin": 100.0,
        "description": "Determines sensory spreadability, nozzle filling flow, and long-term shelf-life suspension."
    },
    "Filling quantity": {
        "min": 198.0,
        "max": 202.0,
        "critical_min": 195.0,
        "critical_max": 205.0,
        "unit": "ml",
        "near_limit_margin": 1.0,
        "description": "Guarantees regulatory declared weight accuracy and head-space seal integrity."
    }
}

class RuleEngine:
    @staticmethod
    def get_limits_for_batch(batch: Batch) -> Dict[str, Any]:
        """Fetch configured limits from the product profile or fall back to default illustrative limits."""
        if batch.product_profile and batch.product_profile.parameter_limits:
            return batch.product_profile.parameter_limits
        return DEFAULT_ILLUSTRATIVE_LIMITS

    @classmethod
    def evaluate_reading(
        cls, db: Session, reading: ProductionReading, batch: Batch
    ) -> Optional[QualityAlert]:
        """
        Evaluate a production reading against product limits.
        Generates a QualityAlert if out-of-range or near-limit warning.
        Deduplicates sensible repeated alerts.
        """
        param = reading.parameter
        value = reading.value
        unit = reading.unit

        limits_dict = cls.get_limits_for_batch(batch)
        if param not in limits_dict:
            return None

        spec = limits_dict[param]
        low = float(spec.get("min", 0.0))
        high = float(spec.get("max", 100.0))
        crit_low = float(spec.get("critical_min", low - 0.1 * (high - low)))
        crit_high = float(spec.get("critical_max", high + 0.1 * (high - low)))
        near_margin = float(spec.get("near_limit_margin", 0.05 * (high - low)))
        param_desc = spec.get("description", "Quality specification boundary.")

        severity: Optional[str] = None
        rule_name: str = ""
        explanation: str = ""

        # 1. Critical Excursion
        if value > crit_high:
            severity = "Critical"
            rule_name = f"RULE_CRIT_HIGH_{param.upper().replace(' ', '_')}"
            delta = round(value - high, 2)
            explanation = (
                f"CRITICAL HIGH DEVIATION: {param} measured at {value} {unit}, which exceeds critical threshold {crit_high} {unit} "
                f"(configured upper limit: {high} {unit}, +{delta} {unit} excursion). "
                f"Impact: {param_desc} Immediate batch hold and quality engineering review required."
            )
        elif value < crit_low:
            severity = "Critical"
            rule_name = f"RULE_CRIT_LOW_{param.upper().replace(' ', '_')}"
            delta = round(low - value, 2)
            explanation = (
                f"CRITICAL LOW DEVIATION: {param} measured at {value} {unit}, which dropped below critical threshold {crit_low} {unit} "
                f"(configured lower limit: {low} {unit}, -{delta} {unit} excursion). "
                f"Impact: {param_desc} Immediate process halt and quality engineering review required."
            )
        # 2. Standard High / Low Out-of-Bounds
        elif value > high:
            severity = "High"
            rule_name = f"RULE_HIGH_{param.upper().replace(' ', '_')}"
            delta = round(value - high, 2)
            explanation = (
                f"HIGH DEVIATION: {param} observed at {value} {unit}, above configured limit of {high} {unit} (+{delta} {unit}). "
                f"Impact: {param_desc} Recommend immediate calibration verification and cooling/mixing adjustment."
            )
        elif value < low:
            severity = "High"
            rule_name = f"RULE_LOW_{param.upper().replace(' ', '_')}"
            delta = round(low - value, 2)
            explanation = (
                f"LOW DEVIATION: {param} observed at {value} {unit}, below configured limit of {low} {unit} (-{delta} {unit}). "
                f"Impact: {param_desc} Recommend process parameter trim before advancing to next manufacturing stage."
            )
        # 3. Warning Near-Limit (Optional medium alert)
        elif (high - near_margin) <= value <= high:
            severity = "Medium"
            rule_name = f"WARN_NEAR_HIGH_{param.upper().replace(' ', '_')}"
            explanation = (
                f"NEAR-LIMIT WARNING: {param} at {value} {unit} is approaching upper bound ({high} {unit}). "
                f"Close monitoring advised to prevent drift into out-of-specification condition."
            )
        elif low <= value <= (low + near_margin):
            severity = "Medium"
            rule_name = f"WARN_NEAR_LOW_{param.upper().replace(' ', '_')}"
            explanation = (
                f"NEAR-LIMIT WARNING: {param} at {value} {unit} is approaching lower bound ({low} {unit}). "
                f"Close monitoring advised to prevent drift into out-of-specification condition."
            )

        if not severity:
            # Value is fully within normal healthy target zone
            return None

        # --- DEDUPLICATION LOGIC ---
        # Check if an alert for this batch, parameter and severity is already Open or Acknowledged
        existing_alert = db.query(QualityAlert).filter(
            QualityAlert.batch_id == batch.id,
            QualityAlert.parameter == param,
            QualityAlert.status.in_(["Open", "Acknowledged", "Investigating"])
        ).first()

        if existing_alert:
            # If the new reading is even more severe, upgrade the existing alert
            if severity == "Critical" and existing_alert.severity != "Critical":
                existing_alert.severity = "Critical"
                existing_alert.observed_value = value
                existing_alert.explanation = f"[ESCALATED] {explanation}"
                existing_alert.reading_id = reading.id
                db.commit()
                db.refresh(existing_alert)
            return existing_alert

        # Create new QualityAlert
        alert = QualityAlert(
            batch_id=batch.id,
            reading_id=reading.id,
            parameter=param,
            observed_value=value,
            lower_limit=low,
            upper_limit=high,
            unit=unit,
            severity=severity,
            rule_name=rule_name,
            explanation=explanation,
            status="Open",
            created_at=datetime.datetime.utcnow()
        )
        db.add(alert)

        # Flag the batch as needing Quality Review if High or Critical
        if severity in ["High", "Critical"]:
            batch.status = "Quality Review"
            batch.first_pass_quality = False

        db.commit()
        db.refresh(alert)
        return alert

