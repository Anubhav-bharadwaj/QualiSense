import math
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.datasets.secom.schemas import (
    SecomDatasetSummary,
    SecomRecordSummary,
    SecomRecordDetail,
    SecomFeatureStat,
    SecomDistribution,
    SecomMetadata,
    SecomImportResponse
)
from backend.datasets.secom.service import SecomService
from backend.datasets.secom.importer import import_secom_dataset
from backend.models import User
from backend.auth.dependencies import require_permission
from backend.auth.permissions import ML_RUN
from backend.datasets.secom.ml_pipeline import (
    SecomPreprocessingPipeline,
    get_secom_evaluation_status,
    train_and_evaluate_secom_model
)

router = APIRouter(prefix="/api/datasets/secom", tags=["SECOM Manufacturing Dataset"])

@router.get("/summary", response_model=SecomDatasetSummary)
def get_secom_summary(db: Session = Depends(get_db)):
    """Summary KPI metrics calculated dynamically from SECOM database records."""
    return SecomService.get_summary(db)

@router.get("/records")
def get_secom_records(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by Pass, Fail, or All"),
    search_id: Optional[int] = Query(None, description="Search by sample ID or original index"),
    sort_by: str = Query("original_index", description="Column to sort by"),
    sort_order: str = Query("asc", description="Sort order: 'asc' or 'desc'"),
    db: Session = Depends(get_db)
):
    """Searchable, paginated manufacturing observations with pass/fail labels."""
    items, total = SecomService.get_records(
        db=db,
        page=page,
        page_size=page_size,
        status_filter=status,
        search_id=search_id,
        sort_by=sort_by,
        sort_order=sort_order
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/records/{record_id}", response_model=SecomRecordDetail)
def get_secom_record(record_id: int, db: Session = Depends(get_db)):
    """Full detail of an individual wafer sample with all 590 anonymised sensor readings."""
    record = SecomService.get_record_detail(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"SECOM record #{record_id} not found.")
    return record

@router.get("/features")
def get_secom_features(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Features per page"),
    search: Optional[str] = Query(None, description="Search by sensor name (e.g. Sensor_42) or index"),
    missing_only: bool = Query(False, description="Filter to features with missing values only"),
    only_constant: bool = Query(False, description="Filter to constant / non-variant features only"),
    db: Session = Depends(get_db)
):
    """Searchable and paginated sensor feature metrics across all 590 channels."""
    items, total = SecomService.get_features(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        filter_missing_only=missing_only,
        only_constant=only_constant
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/distribution", response_model=SecomDistribution)
def get_secom_distribution(db: Session = Depends(get_db)):
    """Pass vs fail class distribution, imbalance ratio, and missingness histogram."""
    return SecomService.get_distribution(db)

@router.get("/metadata", response_model=SecomMetadata)
def get_secom_metadata(db: Session = Depends(get_db)):
    """Attribution, citation, license, and prominent research dataset disclaimers."""
    return SecomService.get_metadata(db)

@router.get("/ml-readiness")
def get_ml_readiness():
    """Future Machine Learning pipeline readiness status (Zero Data Leakage architecture)."""
    pipeline = SecomPreprocessingPipeline()
    return pipeline.get_pipeline_readiness()

@router.get("/correlation")
def get_secom_feature_correlation(
    feat_x: str = Query("Sensor_0", description="Feature on X-axis"),
    feat_y: str = Query("Sensor_1", description="Feature on Y-axis"),
    db: Session = Depends(get_db)
):
    """Pairwise sensor correlation analysis with non-causation disclosures."""
    return SecomService.get_feature_correlation(db, feat_x=feat_x, feat_y=feat_y)

@router.get("/comparison")
def get_secom_pass_fail_comparison(
    feature: str = Query("Sensor_59", description="Sensor feature to compare"),
    db: Session = Depends(get_db)
):
    """Statistical distribution comparison of a sensor channel between Pass and Fail wafers."""
    return SecomService.get_pass_fail_comparison(db, feature_name=feature)

@router.get("/ml/evaluation")
def get_ml_evaluation():
    """Retrieve benchmark status of the SECOM Machine Learning model."""
    return get_secom_evaluation_status()

@router.post("/ml/train-evaluate")
def trigger_ml_evaluation(current_user: Optional[User] = Depends(require_permission(ML_RUN))):
    """Execute genuine Scikit-Learn Random Forest training and evaluation on the real SECOM dataset."""
    try:
        return train_and_evaluate_secom_model()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate SECOM model: {str(e)}"
        )

@router.post("/import", response_model=SecomImportResponse)
def trigger_secom_import(
    force_reload: bool = Query(False, description="Force re-importing and recomputing statistics"),
    db: Session = Depends(get_db)
):
    """
    Authorized/Admin-triggered dataset import.
    Idempotent: will not duplicate records if already imported unless force_reload=True.
    """
    try:
        res = import_secom_dataset(db, force_reload=force_reload)
        return SecomImportResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import SECOM dataset: {str(e)}"
        )
