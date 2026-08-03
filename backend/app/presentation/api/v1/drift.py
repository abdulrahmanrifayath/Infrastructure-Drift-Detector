from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.drift import DriftEventResponse, DriftSummaryMetrics, SideBySideDiffResponse
from app.domain.models.drift_event import DriftCategory, DriftSeverity, DriftStatus
from app.repositories.drift_repository import drift_repository
from app.repositories.sync_repository import sync_repository
from app.services.drift_detection_engine import drift_detection_engine
from app.presentation.api.deps import get_current_user
from app.domain.models.user import User

router = APIRouter(prefix="/drift", tags=["Drift Detection Engine"])


@router.post("/analyze", response_model=APIResponse[List[DriftEventResponse]])
def run_drift_analysis(
    sync_job_id: Optional[int] = Query(None, description="Target SyncJob ID or latest"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes Drift Detection Engine to compare IaC against live cloud state and classify drift events.
    """
    if not sync_job_id:
        latest = sync_repository.get_latest_sync_job(db)
        if not latest:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No synchronization jobs found. Run a sync job before analyzing drift."
            )
        sync_job_id = latest.id

    events = drift_detection_engine.analyze_sync_job_drift(db, sync_job_id=sync_job_id)
    data = [DriftEventResponse.model_validate(e) for e in events]

    return APIResponse(
        success=True,
        message=f"Drift detection complete. Found {len(data)} drift events.",
        data=data
    )


@router.get("/events", response_model=APIResponse[List[DriftEventResponse]])
def get_drift_events(
    category: Optional[DriftCategory] = Query(None),
    severity: Optional[DriftSeverity] = Query(None),
    status_filter: Optional[DriftStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves filtered drift audit history with pagination support.
    """
    items, total = drift_repository.filter_drift_events(
        db=db,
        category=category,
        severity=severity,
        status=status_filter,
        search=search,
        skip=skip,
        limit=limit
    )

    data = [DriftEventResponse.model_validate(i) for i in items]
    return APIResponse(
        success=True,
        message=f"Retrieved {len(data)} of {total} drift events.",
        data=data
    )


@router.get("/metrics", response_model=APIResponse[DriftSummaryMetrics])
def get_drift_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns aggregate drift metrics for Dashboard widgets.
    """
    raw = drift_repository.get_summary_metrics(db)
    return APIResponse(
        success=True,
        message="Drift summary metrics retrieved.",
        data=DriftSummaryMetrics(**raw)
    )


@router.get("/compare/{event_id}", response_model=APIResponse[SideBySideDiffResponse])
def get_side_by_side_comparison(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves side-by-side JSON attribute delta comparison for a specific drift event.
    """
    event = drift_repository.get(db, id=event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Drift event #{event_id} not found."
        )

    diff_details = event.diff_details or {}
    diff_keys = list(diff_details.keys())

    return APIResponse(
        success=True,
        message="Side-by-side resource diff retrieved.",
        data=SideBySideDiffResponse(
            event_id=event.id,
            provider_id=event.provider_id,
            resource_name=event.resource_name,
            resource_type=event.resource_type,
            drift_category=event.drift_category.value,
            severity=event.severity.value,
            desired_state=event.desired_state,
            actual_state=event.actual_state,
            diff_keys=diff_keys,
            differences=diff_details
        )
    )
