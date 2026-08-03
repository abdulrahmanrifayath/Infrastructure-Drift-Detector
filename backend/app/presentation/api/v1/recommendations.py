from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.recommendation import RecommendationResponse, CostAnalyticsSummary
from app.repositories.recommendation_repository import recommendation_repository
from app.services.cost_analysis_service import cost_analysis_service
from app.presentation.api.deps import get_current_user
from app.domain.models.user import User

router = APIRouter(prefix="/recommendations", tags=["AI Recommendation & Cost Governance"])


@router.post("/generate", response_model=APIResponse[List[RecommendationResponse]], status_code=status.HTTP_201_CREATED)
def generate_ai_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers AI Recommendation Engine (Rule-based or LLM provider) to synthesize recommendations and priority scores.
    """
    recs = cost_analysis_service.generate_recommendations(db)
    data = [RecommendationResponse.model_validate(r) for r in recs]
    return APIResponse(
        success=True,
        message=f"Generated {len(data)} AI remediation recommendations.",
        data=data
    )


@router.get("", response_model=APIResponse[List[RecommendationResponse]])
def get_recommendations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all actionable AI recommendations ordered by Priority Score (0-100).
    """
    recs = recommendation_repository.get_all_ordered_by_priority(db, skip=skip, limit=limit)
    data = [RecommendationResponse.model_validate(r) for r in recs]
    return APIResponse(
        success=True,
        message=f"Retrieved {len(data)} recommendations.",
        data=data
    )


@router.get("/cost-analytics", response_model=APIResponse[CostAnalyticsSummary])
def get_cost_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns FinOps cost exposure analysis, unmanaged cloud spending, and potential monthly savings.
    """
    summary = cost_analysis_service.get_cost_analytics_summary(db)
    return APIResponse(
        success=True,
        message="Cost analytics summary calculated.",
        data=summary
    )


@router.get("/{drift_event_id}", response_model=APIResponse[RecommendationResponse])
def get_recommendation_by_drift(
    drift_event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves specific AI recommendation for a target drift event ID.
    """
    rec = recommendation_repository.get_by_drift_event(db, drift_event_id=drift_event_id)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No recommendation generated for drift event #{drift_event_id} yet."
        )
    return APIResponse(
        success=True,
        message="Recommendation details retrieved.",
        data=RecommendationResponse.model_validate(rec)
    )
