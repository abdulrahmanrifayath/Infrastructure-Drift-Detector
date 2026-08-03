from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.domain.models.notification_log import NotificationChannel, NotificationStatus


class SchedulerConfigResponse(BaseModel):
    id: int
    interval_minutes: int
    is_active: bool
    last_scan_at: Optional[datetime] = None
    next_scan_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SchedulerUpdateRequest(BaseModel):
    interval_minutes: int
    is_active: Optional[bool] = True


class NotificationLogResponse(BaseModel):
    id: int
    channel: NotificationChannel
    recipient: str
    subject: str
    payload: Dict[str, Any]
    status: NotificationStatus
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    id: int
    action: str
    actor: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class MonitoringDashboardMetrics(BaseModel):
    last_scan: Optional[datetime] = None
    next_scan: Optional[datetime] = None
    scan_interval_minutes: int
    resources_scanned_count: int
    drifts_found_count: int
    notifications_sent_count: int
    active_channels: List[str]
