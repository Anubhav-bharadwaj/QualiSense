import os
import zipfile
import datetime
import math
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.models import SecomSample, DatasetImport

SECOM_DATA_DIR = os.path.join(os.getcwd(), "data", "secom")
SECOM_ZIP_PATH = os.path.join(os.getcwd(), "secom.zip")

def ensure_extracted() -> str:
    """Ensure secom.zip is extracted into data/secom safely without overwriting zip."""
    if not os.path.exists(SECOM_DATA_DIR) or not os.path.exists(os.path.join(SECOM_DATA_DIR, "secom.data")):
        os.makedirs(SECOM_DATA_DIR, exist_ok=True)
        if not os.path.exists(SECOM_ZIP_PATH):
            raise FileNotFoundError(f"SECOM archive not found at {SECOM_ZIP_PATH}")
        with zipfile.ZipFile(SECOM_ZIP_PATH, "r") as z:
            for member in z.infolist():
                target_path = os.path.normpath(os.path.join(SECOM_DATA_DIR, member.filename))
                if not target_path.startswith(SECOM_DATA_DIR):
                    raise ValueError("Unsafe path detected in ZIP archive")
                z.extract(member, SECOM_DATA_DIR)
    return SECOM_DATA_DIR

def import_secom_dataset(db: Session, force_reload: bool = False) -> Dict[str, Any]:
    """
    Import or refresh SECOM dataset into SQLite secom_samples & dataset_imports.
    Idempotent: Avoids duplicate records.
    """
    # Check if already imported
    existing_count = db.query(SecomSample).count()
    if existing_count > 0 and not force_reload:
        import_rec = db.query(DatasetImport).filter(DatasetImport.dataset_name == "SECOM Semiconductor Dataset").first()
        return {
            "message": "SECOM dataset is already imported. Use force_reload to re-import.",
            "total_records": existing_count,
            "total_features": 590,
            "successful_records": existing_count,
            "failed_records": 0,
            "missing_values_count": import_rec.missing_values_count if import_rec else 41951,
            "import_status": "Completed"
        }

    data_dir = ensure_extracted()
    data_file = os.path.join(data_dir, "secom.data")
    labels_file = os.path.join(data_dir, "secom_labels.data")

    if not os.path.exists(data_file) or not os.path.exists(labels_file):
        raise FileNotFoundError(f"Missing required SECOM files in {data_dir}")

    # Read lines
    with open(data_file, "r", encoding="utf-8") as f:
        data_lines = [line.strip() for line in f if line.strip()]

    with open(labels_file, "r", encoding="utf-8") as f:
        label_lines = [line.strip() for line in f if line.strip()]

    total_records = len(data_lines)
    if total_records != len(label_lines):
        raise ValueError(f"Record count mismatch: data has {total_records} rows, labels have {len(label_lines)} rows")

    # Parse labels & timestamps
    # Each label line format: '-1 "19/07/2008 11:55:00"' or '1 "19/07/2008 11:55:00"'
    parsed_labels: List[Tuple[int, str, Optional[str]]] = []
    for idx, lline in enumerate(label_lines):
        parts = lline.split('"', 1)
        raw_label = parts[0].strip()
        timestamp = parts[1].replace('"', '').strip() if len(parts) > 1 else None
        try:
            num_label = int(raw_label)
        except ValueError:
            num_label = -1
        readable_status = "Fail" if num_label == 1 else "Pass"
        parsed_labels.append((num_label, readable_status, timestamp))

    # Parse features matrix into numeric 2D array while tracking NaNs
    num_features = 590
    feature_columns: List[List[Optional[float]]] = [[] for _ in range(num_features)]
    sample_features: List[Dict[str, Optional[float]]] = []
    sample_missing_counts: List[int] = []

    total_missing_values = 0

    for row_idx, line in enumerate(data_lines):
        tokens = line.split()
        if len(tokens) != num_features:
            raise ValueError(f"Malformed row {row_idx}: expected {num_features} columns, got {len(tokens)}")

        row_dict: Dict[str, Optional[float]] = {}
        row_missing = 0

        for col_idx, tok in enumerate(tokens):
            feat_name = f"Sensor_{col_idx}"
            if tok == "NaN":
                val = None
                row_missing += 1
                total_missing_values += 1
            else:
                try:
                    val = float(tok)
                except ValueError:
                    val = None
                    row_missing += 1
                    total_missing_values += 1

            row_dict[feat_name] = val
            feature_columns[col_idx].append(val)

        sample_features.append(row_dict)
        sample_missing_counts.append(row_missing)

    # Compute feature-level statistics for explorer & constant feature detection
    feature_stats: List[Dict[str, Any]] = []
    constant_features_count = 0

    for col_idx in range(num_features):
        col_vals = feature_columns[col_idx]
        non_nulls = [v for v in col_vals if v is not None]
        missing_cnt = total_records - len(non_nulls)
        missing_pct = round((missing_cnt / total_records) * 100.0, 2)

        if non_nulls:
            arr = np.array(non_nulls, dtype=np.float64)
            mean_val = float(np.mean(arr))
            std_val = float(np.std(arr))
            min_val = float(np.min(arr))
            max_val = float(np.max(arr))
            is_const = bool(std_val == 0.0 or min_val == max_val)
        else:
            mean_val, std_val, min_val, max_val = None, None, None, None
            is_const = True

        if is_const:
            constant_features_count += 1

        feature_stats.append({
            "name": f"Sensor_{col_idx}",
            "index": col_idx,
            "available_count": len(non_nulls),
            "missing_count": missing_cnt,
            "missing_percentage": missing_pct,
            "mean": round(mean_val, 4) if mean_val is not None else None,
            "std": round(std_val, 4) if std_val is not None else None,
            "min": round(min_val, 4) if min_val is not None else None,
            "max": round(max_val, 4) if max_val is not None else None,
            "is_constant": is_const
        })

    # Clear existing secom_samples safely if force_reload
    if existing_count > 0:
        db.query(SecomSample).delete()
        db.commit()

    # Bulk insert secom_samples in chunks of 250 for speed and memory safety
    batch_size = 250
    now = datetime.datetime.utcnow()

    for start_idx in range(0, total_records, batch_size):
        end_idx = min(start_idx + batch_size, total_records)
        chunk_objs = []
        for i in range(start_idx, end_idx):
            num_label, readable_status, timestamp = parsed_labels[i]
            sample = SecomSample(
                source="UCI SECOM Dataset",
                original_index=i,
                original_label=num_label,
                quality_status=readable_status,
                recorded_at=timestamp,
                missing_count=sample_missing_counts[i],
                features_json=sample_features[i],
                imported_at=now
            )
            chunk_objs.append(sample)
        db.add_all(chunk_objs)
        db.commit()

    pass_count = sum(1 for (lbl, _, _) in parsed_labels if lbl == -1)
    fail_count = sum(1 for (lbl, _, _) in parsed_labels if lbl == 1)

    # Save or update DatasetImport record
    db_import = db.query(DatasetImport).filter(DatasetImport.dataset_name == "SECOM Semiconductor Dataset").first()
    if not db_import:
        db_import = DatasetImport(
            dataset_name="SECOM Semiconductor Dataset",
            source="UCI Machine Learning Repository",
            total_records=total_records,
            total_features=num_features,
            pass_count=pass_count,
            fail_count=fail_count,
            successful_records=total_records,
            failed_records=0,
            missing_values_count=total_missing_values,
            constant_features_count=constant_features_count,
            import_status="Completed",
            feature_stats_json=feature_stats,
            metadata_json={
                "authors": "Michael McCann, Adrian Johnston",
                "area": "Semiconductor Manufacturing",
                "donation_date": "2008-11-19",
                "label_convention": {"-1": "Pass", "1": "Fail"},
                "class_imbalance": f"{round(pass_count / fail_count, 1)} : 1",
                "pass_percentage": round((pass_count / total_records) * 100.0, 2),
                "fail_percentage": round((fail_count / total_records) * 100.0, 2)
            },
            imported_at=now
        )
        db.add(db_import)
    else:
        db_import.total_records = total_records
        db_import.total_features = num_features
        db_import.pass_count = pass_count
        db_import.fail_count = fail_count
        db_import.successful_records = total_records
        db_import.failed_records = 0
        db_import.missing_values_count = total_missing_values
        db_import.constant_features_count = constant_features_count
        db_import.import_status = "Completed"
        db_import.feature_stats_json = feature_stats
        db_import.imported_at = now

    db.commit()

    return {
        "message": "SECOM manufacturing dataset successfully imported and verified.",
        "total_records": total_records,
        "total_features": num_features,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "successful_records": total_records,
        "failed_records": 0,
        "missing_values_count": total_missing_values,
        "constant_features_count": constant_features_count,
        "import_status": "Completed"
    }
