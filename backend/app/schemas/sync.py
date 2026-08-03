from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.domain.models.sync_job import SyncJobStatus


class SyncJobCreate(BaseModel):
    terraform_state_raw: Optional[str] = None


class SyncJobResponse(BaseModel):
    id: int
    status: SyncJobStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    desired_resources_count: int
    actual_resources_count: int
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DesiredResourceResponse(BaseModel):
    id: int
    sync_job_id: int
    resource_type: str
    provider_id: str
    resource_name: str
    provider: str
    region: str
    configuration_payload: Dict[str, Any]
    source_file: str

    model_config = ConfigDict(from_attributes=True)


class ActualResourceResponse(BaseModel):
    id: int
    sync_job_id: int
    resource_type: str
    provider_id: str
    resource_name: str
    provider: str
    region: str
    status: str
    configuration_payload: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


class ComparisonReadyPair(BaseModel):
    provider_id: str
    resource_type: str
    desired: Optional[DesiredResourceResponse] = None
    actual: Optional[ActualResourceResponse] = None
    state: str  # 'in_sync' | 'drifted' | 'missing_in_cloud' | 'unmanaged_in_cloud'
