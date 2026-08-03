from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.services.analytics_service import analytics_service
from app.services.report_export_service import report_export_service
from app.presentation.api.deps import get_current_user
from app.domain.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics & Compliance Governance"])


@router.get("/trends", response_model=APIResponse[dict])
def get_historical_trends(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns historical drift trend timelines and resolution velocity metrics.
    """
    trends = analytics_service.get_historical_trends(db, days=days)
    return APIResponse(
        success=True,
        message=f"Retrieved {days}-day historical drift trend data.",
        data=trends
    )


@router.get("/compliance", response_model=APIResponse[dict])
def get_compliance_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns compliance framework scorecards for CIS AWS Benchmark, SOC 2, ISO 27001, and HIPAA.
    """
    scores = analytics_service.get_compliance_framework_scores(db)
    return APIResponse(
        success=True,
        message="Compliance framework scores calculated.",
        data=scores
    )


@router.get("/export/csv")
def export_csv_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exports downloadable CSV audit report of all infrastructure drift findings.
    """
    csv_content = report_export_service.generate_csv_report(db)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=infrastructure_drift_audit_report.csv"}
    )


@router.get("/export/pdf")
def export_pdf_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exports formatted HTML/PDF executive audit report.
    """
    html_content = report_export_service.generate_pdf_html_report(db)
    return Response(
        content=html_content,
        media_type="text/html",
        headers={"Content-Disposition": "inline; filename=infrastructure_drift_report.html"}
    )
