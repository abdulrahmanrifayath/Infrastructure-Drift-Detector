from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.scheduler import (
    SchedulerConfigResponse,
    SchedulerUpdateRequest,
    NotificationLogResponse,
    AuditLogResponse,
    MonitoringDashboardMetrics
)
from app.repositories.scheduler_repository import scheduler_repository
from app.repositories.resource_repository import resource_repository
from app.repositories.drift_repository import drift_repository
from app.services.scheduler_service import scheduler_service
from app.presentation.api.deps import get_current_user
from app.domain.models.user import User

router = APIRouter(prefix="/monitoring", tags=["System Monitoring & Scheduler"])


@router.get("/dashboard", response_model=APIResponse[MonitoringDashboardMetrics])
def get_monitoring_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns monitoring metrics: Last Scan, Next Scan, Resources Scanned, Drifts Found, and Notifications Sent count.
    """
    config = scheduler_repository.get_or_create_config(db)
    res_count = resource_repository.get_inventory_metrics(db).get("total_resources", 0)
    drift_count = drift_repository.get_summary_metrics(db).get("open_drift_count", 0)
    notifications_count = len(scheduler_repository.get_notification_logs(db, limit=1000))

    return APIResponse(
        success=True,
        message="Monitoring dashboard metrics retrieved.",
        data=MonitoringDashboardMetrics(
            last_scan=config.last_scan_at,
            next_scan=config.next_scan_at,
            scan_interval_minutes=config.interval_minutes,
            resources_scanned_count=res_count,
            drifts_found_count=drift_count,
            notifications_sent_count=notifications_count,
            active_channels=["Slack (#cloud-governance-alerts)", "Email (devops-alerts@enterprise.com)", "HTTPS Webhook"]
        )
    )


@router.get("/scheduler", response_model=APIResponse[SchedulerConfigResponse])
def get_scheduler_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves current background scheduler scan interval configuration.
    """
    config = scheduler_repository.get_or_create_config(db)
    return APIResponse(
        success=True,
        message="Scheduler config retrieved.",
        data=SchedulerConfigResponse.model_validate(config)
    )


@router.put("/scheduler", response_model=APIResponse[SchedulerConfigResponse])
def update_scheduler_config(
    payload: SchedulerUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates background drift scan interval frequency (e.g. 15, 30, 60, 360, 1440 minutes).
    """
    config = scheduler_repository.get_or_create_config(db)
    now = datetime.utcnow()
    next_scan = now + timedelta(minutes=payload.interval_minutes)

    updated = scheduler_repository.update(db, db_obj=config, obj_in={
        "interval_minutes": payload.interval_minutes,
        "is_active": payload.is_active,
        "next_scan_at": next_scan
    })

    scheduler_repository.create_audit_log(
        db,
        action="SCHEDULER_INTERVAL_UPDATED",
        actor=current_user.email,
        details={"new_interval_minutes": payload.interval_minutes}
    )

    return APIResponse(
        success=True,
        message=f"Background scan interval updated to every {payload.interval_minutes} minutes.",
        data=SchedulerConfigResponse.model_validate(updated)
    )


@router.post("/trigger-scan", response_model=APIResponse[dict])
def trigger_immediate_background_scan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers an immediate background drift scan routine.
    """
    scheduler_service.execute_scheduled_drift_scan()
    scheduler_repository.create_audit_log(
        db,
        action="MANUAL_SCAN_TRIGGERED",
        actor=current_user.email
    )

    return APIResponse(
        success=True,
        message="Immediate background drift scan executed.",
        data={"status": "completed"}
    )


@router.get("/notifications", response_model=APIResponse[List[NotificationLogResponse]])
def get_notification_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves notification dispatch history across Slack, Email, and Webhooks.
    """
    logs = scheduler_repository.get_notification_logs(db, skip=skip, limit=limit)
    data = [NotificationLogResponse.model_validate(l) for l in logs]
    return APIResponse(
        success=True,
        message=f"Retrieved {len(data)} notification logs.",
        data=data
    )


@router.get("/audit-logs", response_model=APIResponse[List[AuditLogResponse]])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves system activity audit trail.
    """
    logs = scheduler_repository.get_audit_logs(db, skip=skip, limit=limit)
    data = [AuditLogResponse.model_validate(l) for l in logs]
    return APIResponse(
        success=True,
        message=f"Retrieved {len(data)} system audit logs.",
        data=data
    )
