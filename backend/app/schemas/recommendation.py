from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RecommendationResponse(BaseModel):
    id: int
    drift_event_id: int
    provider_id: str
    priority_score: int
    explanation: str
    business_impact: str
    security_impact: str
    estimated_monthly_cost: float
    recommended_fix: str
    estimated_fix_time: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CostAnalyticsSummary(BaseModel):
    total_estimated_monthly_cost: float
    unmanaged_resource_cost: float
    potential_monthly_savings: float
    cost_by_resource_type: Dict[str, float]
    top_cost_drift_items: List[Dict[str, Any]]
