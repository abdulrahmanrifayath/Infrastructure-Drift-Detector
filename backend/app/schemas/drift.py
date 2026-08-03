from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.domain.models.drift_event import DriftCategory, DriftSeverity, DriftStatus


class DriftEventBase(BaseModel):
    sync_job_id: int
    resource_name: str
    provider_id: str
    resource_type: str
    drift_category: DriftCategory
    severity: DriftSeverity
    status: DriftStatus = DriftStatus.OPEN
    title: str
    description: str
    desired_state: Optional[Dict[str, Any]] = None
    actual_state: Optional[Dict[str, Any]] = None
    diff_details: Dict[str, Any]


class DriftEventCreate(DriftEventBase):
    pass


class DriftEventResponse(DriftEventBase):
    id: int
    detected_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DriftSummaryMetrics(BaseModel):
    total_drift_count: int
    open_drift_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    by_category: Dict[str, int]
    by_resource_type: Dict[str, int]


class SideBySideDiffResponse(BaseModel):
    event_id: int
    provider_id: str
    resource_name: str
    resource_type: str
    drift_category: str
    severity: str
    desired_state: Optional[Dict[str, Any]] = None
    actual_state: Optional[Dict[str, Any]] = None
    diff_keys: List[str]
    differences: Dict[str, Dict[str, Any]]  # key -> {desired: val, actual: val}
