import numpy as np
from typing import Dict, Any, List, Optional
try:
    from sklearn.ensemble import RandomForestClassifier
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class CosmeticBatchRiskModel:
    MODEL_VERSION = "v0.1-synthetic-rf"

    def __init__(self):
        self.is_trained = False
        self.model: Optional[Any] = None
        self.feature_names = [
            "temp_delta_from_target",
            "ph_delta_from_target",
            "speed_delta_from_target",
            "viscosity_delta_from_target",
            "fill_delta_from_target"
        ]
        self._train_baseline_model()

    def _train_baseline_model(self):
        """Train a baseline Random Forest classifier on synthetic process parameter deviations."""
        if not SKLEARN_AVAILABLE:
            return

        # Generate 400 synthetic historical runs
        np.random.seed(42)
        n_samples = 400

        # Feature representations: absolute normalized deviations from target centers
        # Target centers for Emulsion: Temp 37.5, pH 5.5, Speed 800, Viscosity 3150, Fill 200
        temp_dev = np.abs(np.random.normal(0, 1.5, n_samples))
        ph_dev = np.abs(np.random.normal(0, 0.25, n_samples))
        speed_dev = np.abs(np.random.normal(0, 60, n_samples))
        visc_dev = np.abs(np.random.normal(0, 180, n_samples))
        fill_dev = np.abs(np.random.normal(0, 1.2, n_samples))

        X = np.column_stack([temp_dev, ph_dev, speed_dev, visc_dev, fill_dev])

        # Ground truth defect label based on multi-variate stress interaction
        # Higher temperature deviation + high viscosity deviation strongly correlates with stability defect
        risk_score = (
            (temp_dev / 2.5) * 0.35 +
            (visc_dev / 350.0) * 0.30 +
            (ph_dev / 0.5) * 0.15 +
            (speed_dev / 100.0) * 0.10 +
            (fill_dev / 2.0) * 0.10
        )
        y = (risk_score > 0.85).astype(int)

        self.model = RandomForestClassifier(n_estimators=30, max_depth=4, random_state=42)
        self.model.fit(X, y)
        self.is_trained = True

    def predict(
        self,
        temperature: float,
        ph: float,
        mixing_speed: float,
        viscosity: float,
        filling_quantity: float
    ) -> Dict[str, Any]:
        """Predict defect probability from readings."""
        if not self.is_trained or self.model is None:
            return {
                "defect_risk_probability": 0.0,
                "risk_level": "Unavailable",
                "model_version": self.MODEL_VERSION,
                "top_contributing_features": [],
                "is_model_available": False,
                "disclaimer": "ML model is currently unavailable. Decisions rely solely on configured boundary rules."
            }

        # Calculate absolute delta from standard target set points
        t_target, ph_target, s_target, v_target, f_target = 37.5, 5.5, 800.0, 3150.0, 200.0

        t_delta = abs(temperature - t_target)
        ph_delta = abs(ph - ph_target)
        s_delta = abs(mixing_speed - s_target)
        v_delta = abs(viscosity - v_target)
        f_delta = abs(filling_quantity - f_target)

        X_input = np.array([[t_delta, ph_delta, s_delta, v_delta, f_delta]])
        probs = self.model.predict_proba(X_input)[0]
        # Probability of class 1 (Defect/instability)
        risk_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])

        # Feature importance breakdown
        importances = self.model.feature_importances_
        feature_contributions = [
            {"feature": "Thermal Deviation (|T - 37.5 °C|)", "delta": round(t_delta, 2), "unit": "°C", "weight": round(float(importances[0]), 3)},
            {"feature": "Viscosity Deviation (|V - 3150 cP|)", "delta": round(v_delta, 1), "unit": "cP", "weight": round(float(importances[3]), 3)},
            {"feature": "pH Balance Deviation (|pH - 5.5|)", "delta": round(ph_delta, 2), "unit": "pH", "weight": round(float(importances[1]), 3)},
            {"feature": "Mixing Agitation Deviation (|RPM - 800|)", "delta": round(s_delta, 1), "unit": "RPM", "weight": round(float(importances[2]), 3)},
            {"feature": "Filling Weight Tolerance (|Fill - 200 ml|)", "delta": round(f_delta, 2), "unit": "ml", "weight": round(float(importances[4]), 3)}
        ]
        # Sort by weight descending
        feature_contributions.sort(key=lambda x: x["weight"], reverse=True)

        if risk_prob >= 0.70:
            level = "Critical"
        elif risk_prob >= 0.45:
            level = "Elevated"
        elif risk_prob >= 0.20:
            level = "Moderate"
        else:
            level = "Low"

        return {
            "defect_risk_probability": round(risk_prob, 3),
            "risk_level": level,
            "model_version": self.MODEL_VERSION,
            "top_contributing_features": feature_contributions,
            "is_model_available": True,
            "disclaimer": "EXPERIMENTAL ML SIGNAL: Trained on synthetic demonstration data. Decision-support only — does not replace configured physical limits, lab assays, or qualified engineer batch disposition."
        }

# Global singleton instance
ml_model_service = CosmeticBatchRiskModel()

