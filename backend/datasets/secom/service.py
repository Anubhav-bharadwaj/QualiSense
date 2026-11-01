from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
import datetime

from backend.models import SecomSample, DatasetImport
from backend.datasets.secom.schemas import (
    SecomDatasetSummary,
    SecomRecordSummary,
    SecomRecordDetail,
    SecomFeatureStat,
    SecomDistribution,
    SecomMetadata
)

class SecomService:
    @staticmethod
    def get_summary(db: Session) -> SecomDatasetSummary:
        """Dynamically calculated dataset summary figures."""
        import_rec = db.query(DatasetImport).filter(
            DatasetImport.dataset_name == "SECOM Semiconductor Dataset"
        ).first()

        total = db.query(SecomSample).count()
        if total == 0:
            return SecomDatasetSummary(
                dataset_name="SECOM Semiconductor Dataset",
                source="UCI Machine Learning Repository",
                total_records=0,
                total_features=590,
                pass_count=0,
                fail_count=0,
                pass_percentage=0.0,
                fail_percentage=0.0,
                missing_values_count=0,
                missing_percentage=0.0,
                constant_features_count=0,
                import_status="Not Imported",
                imported_at=None,
                disclaimer="SECOM is a semiconductor manufacturing research dataset. Measurements do not represent cosmetics parameters."
            )

        pass_cnt = db.query(SecomSample).filter(SecomSample.quality_status == "Pass").count()
        fail_cnt = db.query(SecomSample).filter(SecomSample.quality_status == "Fail").count()

        missing_val_cnt = import_rec.missing_values_count if import_rec else 41951
        const_feat_cnt = import_rec.constant_features_count if import_rec else 116
        total_cells = total * 590
        missing_pct = round((missing_val_cnt / total_cells) * 100.0, 2) if total_cells > 0 else 0.0

        return SecomDatasetSummary(
            dataset_name="SECOM Semiconductor Dataset",
            source="UCI Machine Learning Repository",
            total_records=total,
            total_features=590,
            pass_count=pass_cnt,
            fail_count=fail_cnt,
            pass_percentage=round((pass_cnt / total) * 100.0, 2),
            fail_percentage=round((fail_cnt / total) * 100.0, 2),
            missing_values_count=missing_val_cnt,
            missing_percentage=missing_pct,
            constant_features_count=const_feat_cnt,
            import_status=import_rec.import_status if import_rec else "Completed",
            imported_at=import_rec.imported_at if import_rec else None,
            disclaimer="REAL RESEARCH DATA — SECOM. Semiconductor manufacturing sensor measurements. Anonymised; not cosmetics process parameters."
        )

    @staticmethod
    def get_records(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        status_filter: Optional[str] = None,
        search_id: Optional[int] = None,
        sort_by: str = "original_index",
        sort_order: str = "asc"
    ) -> Tuple[List[SecomRecordSummary], int]:
        """Paginated, filtered list of SECOM manufacturing observations."""
        query = db.query(SecomSample)

        if status_filter and status_filter != "All":
            query = query.filter(SecomSample.quality_status == status_filter)

        if search_id is not None:
            query = query.filter(
                (SecomSample.id == search_id) | (SecomSample.original_index == search_id)
            )

        total_count = query.count()

        # Sorting
        sort_col = getattr(SecomSample, sort_by, SecomSample.original_index)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        results = [
            SecomRecordSummary(
                id=item.id,
                original_index=item.original_index,
                original_label=item.original_label,
                quality_status=item.quality_status,
                recorded_at=item.recorded_at,
                missing_count=item.missing_count
            ) for item in items
        ]

        return results, total_count

    @staticmethod
    def get_record_detail(db: Session, record_id: int) -> Optional[SecomRecordDetail]:
        """Get full individual record with all 590 sensor readings."""
        sample = db.query(SecomSample).filter(
            (SecomSample.id == record_id) | (SecomSample.original_index == record_id)
        ).first()

        if not sample:
            return None

        return SecomRecordDetail(
            id=sample.id,
            source=sample.source,
            original_index=sample.original_index,
            original_label=sample.original_label,
            quality_status=sample.quality_status,
            recorded_at=sample.recorded_at,
            missing_count=sample.missing_count,
            features=sample.features_json,
            imported_at=sample.imported_at
        )

    @staticmethod
    def get_features(
        db: Session,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        filter_missing_only: bool = False,
        only_constant: bool = False
    ) -> Tuple[List[SecomFeatureStat], int]:
        """Searchable and paginated sensor feature metrics."""
        import_rec = db.query(DatasetImport).filter(
            DatasetImport.dataset_name == "SECOM Semiconductor Dataset"
        ).first()

        if not import_rec or not import_rec.feature_stats_json:
            return [], 0

        all_stats = import_rec.feature_stats_json

        # Filtering
        filtered = all_stats
        if search:
            s_lower = search.strip().lower()
            filtered = [
                f for f in filtered
                if s_lower in f["name"].lower() or s_lower == str(f["index"])
            ]

        if filter_missing_only:
            filtered = [f for f in filtered if f["missing_count"] > 0]

        if only_constant:
            filtered = [f for f in filtered if f.get("is_constant", False)]

        total_features = len(filtered)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_stats = filtered[start_idx:end_idx]

        results = [SecomFeatureStat(**stat) for stat in paged_stats]
        return results, total_features

    @staticmethod
    def get_distribution(db: Session) -> SecomDistribution:
        """Pass/fail distribution, imbalance, and missingness metrics."""
        summary = SecomService.get_summary(db)

        import_rec = db.query(DatasetImport).filter(
            DatasetImport.dataset_name == "SECOM Semiconductor Dataset"
        ).first()

        all_stats = import_rec.feature_stats_json if import_rec and import_rec.feature_stats_json else []

        # Missingness histogram across features
        # 0% missing, 1-5%, 5-15%, 15-30%, >30%
        bins = {
            "0% Missing (Complete)": 0,
            "0.1% - 5% Missing": 0,
            "5% - 20% Missing": 0,
            "20% - 50% Missing": 0,
            "> 50% Severe Missing": 0
        }

        top_missing = sorted(all_stats, key=lambda x: x["missing_count"], reverse=True)[:10]
        constant_features = [f["name"] for f in all_stats if f.get("is_constant", False)]

        for f in all_stats:
            pct = f["missing_percentage"]
            if pct == 0.0:
                bins["0% Missing (Complete)"] += 1
            elif pct <= 5.0:
                bins["0.1% - 5% Missing"] += 1
            elif pct <= 20.0:
                bins["5% - 20% Missing"] += 1
            elif pct <= 50.0:
                bins["20% - 50% Missing"] += 1
            else:
                bins["> 50% Severe Missing"] += 1

        histogram = [{"range": k, "feature_count": v} for k, v in bins.items()]
        imbalance = f"{round(summary.pass_count / max(summary.fail_count, 1), 1)} : 1"

        return SecomDistribution(
            pass_count=summary.pass_count,
            fail_count=summary.fail_count,
            pass_percentage=summary.pass_percentage,
            fail_percentage=summary.fail_percentage,
            imbalance_ratio=imbalance,
            missingness_histogram=histogram,
            top_missing_features=[SecomFeatureStat(**stat) for stat in top_missing],
            constant_features=constant_features
        )

    @staticmethod
    def get_metadata(db: Session) -> SecomMetadata:
        """Attribution, dataset description, and strict disclaimers."""
        import_rec = db.query(DatasetImport).filter(
            DatasetImport.dataset_name == "SECOM Semiconductor Dataset"
        ).first()

        return SecomMetadata(
            dataset_name="SECOM Semiconductor Manufacturing Dataset",
            source="UCI Machine Learning Repository",
            authors="Michael McCann, Adrian Johnston (2008)",
            area="Semiconductor Wafer Fabrication & In-House Line Testing",
            description=(
                "A complex modern semi-conductor manufacturing process monitored via signals/variables "
                "collected from sensors and process measurement points. Each observation represents a wafer entity "
                "with 590 anonymised sensor readings and a pass/fail yield test label with associated timestamp."
            ),
            instances=1567,
            features=590,
            label_mapping={
                "-1": "Pass (In-house line yield test passed)",
                "1": "Fail (Yield test failure detected)"
            },
            license_attribution=(
                "CC BY 4.0 / Open Research Data - UCI Machine Learning Repository (McCann & Johnston, 2008)."
            ),
            disclaimer=(
                "SECOM is a semiconductor manufacturing research dataset. Its sensor measurements are anonymised "
                "and do not represent cosmetics manufacturing process parameters. This dataset is used for "
                "manufacturing analytics and future ML experimentation."
            ),
            last_imported_at=import_rec.imported_at if import_rec else None
        )

    @staticmethod
    def get_feature_correlation(db: Session, feat_x: str, feat_y: str) -> Dict[str, Any]:
        """
        Calculates Pearson correlation between two selected sensor features.
        Handles missing values safely and downsamples points for responsive rendering.
        """
        import numpy as np
        samples = db.query(SecomSample.features_json, SecomSample.quality_status).all()

        x_vals = []
        y_vals = []
        statuses = []
        missing_x = 0
        missing_y = 0
        missing_joint = 0

        for s_features, status in samples:
            vx = s_features.get(feat_x)
            vy = s_features.get(feat_y)

            if vx is None:
                missing_x += 1
            if vy is None:
                missing_y += 1

            if vx is not None and vy is not None:
                x_vals.append(float(vx))
                y_vals.append(float(vy))
                statuses.append(status)
            else:
                missing_joint += 1

        total_samples = len(samples)
        valid_sample_count = len(x_vals)

        if valid_sample_count >= 5:
            arr_x = np.array(x_vals, dtype=np.float64)
            arr_y = np.array(y_vals, dtype=np.float64)
            std_x = np.std(arr_x)
            std_y = np.std(arr_y)

            if std_x > 0 and std_y > 0:
                corr = float(np.corrcoef(arr_x, arr_y)[0, 1])
                corr = round(corr, 4)
            else:
                corr = 0.0

            # Downsample to at most 180 representative points for crisp scatter visualization
            step = max(1, valid_sample_count // 180)
            points = []
            for i in range(0, valid_sample_count, step):
                points.append({
                    "x": round(x_vals[i], 3),
                    "y": round(y_vals[i], 3),
                    "status": statuses[i]
                })
        else:
            corr = 0.0
            points = []

        return {
            "feature_x": feat_x,
            "feature_y": feat_y,
            "correlation_r": corr,
            "valid_sample_count": valid_sample_count,
            "missing_count_x": missing_x,
            "missing_count_y": missing_y,
            "missing_joint_count": missing_joint,
            "total_samples": total_samples,
            "points": points,
            "causation_caveat": "Correlation reflects mathematical linear association across semiconductor sensors. Correlation does NOT establish causal defect mechanisms."
        }

    @staticmethod
    def get_pass_fail_comparison(db: Session, feature_name: str) -> Dict[str, Any]:
        """
        Compares statistical distribution of a sensor feature between Pass (-1) and Fail (+1) samples.
        """
        import numpy as np
        samples = db.query(SecomSample.features_json, SecomSample.quality_status).all()

        pass_vals = []
        fail_vals = []

        for s_features, status in samples:
            val = s_features.get(feature_name)
            if val is not None:
                if status == "Pass":
                    pass_vals.append(float(val))
                else:
                    fail_vals.append(float(val))

        def calc_stats(vals):
            if not vals:
                return {
                    "count": 0, "mean": None, "std": None, "median": None,
                    "min": None, "max": None, "iqr": None
                }
            arr = np.array(vals, dtype=np.float64)
            q25, q50, q75 = np.percentile(arr, [25, 50, 75])
            return {
                "count": len(vals),
                "mean": round(float(np.mean(arr)), 3),
                "std": round(float(np.std(arr)), 3),
                "median": round(float(q50), 3),
                "min": round(float(np.min(arr)), 3),
                "max": round(float(np.max(arr)), 3),
                "iqr": round(float(q75 - q25), 3)
            }

        p_stats = calc_stats(pass_vals)
        f_stats = calc_stats(fail_vals)

        # Difference of means if both present
        diff_mean = None
        if p_stats["mean"] is not None and f_stats["mean"] is not None:
            diff_mean = round(f_stats["mean"] - p_stats["mean"], 3)

        # Binned comparison histogram (6 bins across combined min to max)
        combined = pass_vals + fail_vals
        binned_data = []
        if combined and min(combined) != max(combined):
            c_min, c_max = min(combined), max(combined)
            bin_edges = np.linspace(c_min, c_max, 7)
            for b_idx in range(6):
                low, high = bin_edges[b_idx], bin_edges[b_idx + 1]
                p_cnt = sum(1 for v in pass_vals if low <= v < high or (b_idx == 5 and v == high))
                f_cnt = sum(1 for v in fail_vals if low <= v < high or (b_idx == 5 and v == high))
                binned_data.append({
                    "range": f"{round(low, 1)}–{round(high, 1)}",
                    "pass_count": p_cnt,
                    "fail_count": f_cnt
                })

        return {
            "feature_name": feature_name,
            "pass_stats": p_stats,
            "fail_stats": f_stats,
            "difference_of_means": diff_mean,
            "total_valid_samples": len(combined),
            "total_missing_samples": len(samples) - len(combined),
            "binned_distribution": binned_data,
            "disclaimer": "Sensor values reflect semiconductor research telemetry. Measurements do not correlate with cosmetic products."
        }
