from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import datetime

class SecomRecordSummary(BaseModel):
    id: int
    original_index: int
    original_label: int  # -1 or 1
    quality_status: str  # "Pass" or "Fail"
    recorded_at: Optional[str] = None
    missing_count: int

    class Config:
        from_attributes = True

class SecomRecordDetail(BaseModel):
    id: int
    source: str
    original_index: int
    original_label: int
    quality_status: str
    recorded_at: Optional[str] = None
    missing_count: int
    features: Dict[str, Optional[float]]
    imported_at: datetime.datetime

    class Config:
        from_attributes = True

class SecomFeatureStat(BaseModel):
    name: str  # "Sensor_0"
    index: int  # 0
    available_count: int
    missing_count: int
    missing_percentage: float
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    is_constant: bool = False

class SecomDatasetSummary(BaseModel):
    dataset_name: str
    source: str
    total_records: int
    total_features: int
    pass_count: int
    fail_count: int
    pass_percentage: float
    fail_percentage: float
    missing_values_count: int
    missing_percentage: float
    constant_features_count: int
    import_status: str
    imported_at: Optional[datetime.datetime] = None
    disclaimer: str

class SecomDistribution(BaseModel):
    pass_count: int
    fail_count: int
    pass_percentage: float
    fail_percentage: float
    imbalance_ratio: str
    missingness_histogram: List[Dict[str, Any]]
    top_missing_features: List[SecomFeatureStat]
    constant_features: List[str]

class SecomMetadata(BaseModel):
    dataset_name: str
    source: str
    authors: str
    area: str
    description: str
    instances: int
    features: int
    label_mapping: Dict[str, str]
    license_attribution: str
    disclaimer: str
    last_imported_at: Optional[datetime.datetime] = None

class SecomImportResponse(BaseModel):
    message: str
    total_records: int
    total_features: int
    successful_records: int
    failed_records: int
    missing_values_count: int
    import_status: str

