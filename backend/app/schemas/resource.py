from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.domain.models.resource import ResourceType, ResourceStatus


class ResourceBase(BaseModel):
    resource_name: str
    resource_type: ResourceType
    provider_id: str
    provider: str = "AWS"
    region: str = "us-east-1"
    status: ResourceStatus = ResourceStatus.ACTIVE
    is_managed: bool = True
    configuration_metadata: Optional[Dict[str, Any]] = None


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(BaseModel):
    resource_name: Optional[str] = None
    resource_type: Optional[ResourceType] = None
    region: Optional[str] = None
    status: Optional[ResourceStatus] = None
    is_managed: Optional[bool] = None
    configuration_metadata: Optional[Dict[str, Any]] = None


class ResourceResponse(ResourceBase):
    id: int
    last_checked_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResourceMetrics(BaseModel):
    total_resources: int
    managed_resources: int
    unmanaged_resources: int
    managed_percentage: float
    resources_by_type: Dict[str, int]
    resources_by_region: Dict[str, int]
