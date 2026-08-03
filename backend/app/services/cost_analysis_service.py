from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.domain.models.drift_event import DriftEvent, DriftStatus
from app.repositories.drift_repository import drift_repository
from app.repositories.recommendation_repository import recommendation_repository
from app.domain.models.recommendation import Recommendation
from app.services.ai.factory import ai_recommendation_factory
from app.schemas.recommendation import CostAnalyticsSummary
from app.core.logging import logger


class CostAnalysisService:
    """
    Service generating AI Recommendations and calculating FinOps Cost Analysis metrics.
    """

    def generate_recommendations(self, db: Session) -> List[Recommendation]:
        drift_events, _ = drift_repository.filter_drift_events(db, status=DriftStatus.OPEN, limit=500)
        provider = ai_recommendation_factory.get_provider()

        generated: List[Recommendation] = []
        for event in drift_events:
            existing = recommendation_repository.get_by_drift_event(db, event.id)
            payload = provider.generate_recommendation_payload(event)
            payload["drift_event_id"] = event.id
            payload["provider_id"] = event.provider_id

            if existing:
                updated = recommendation_repository.update(db, db_obj=existing, obj_in=payload)
                generated.append(updated)
            else:
                created = recommendation_repository.create(db, obj_in=payload)
                generated.append(created)

        logger.info(f"AI Engine generated {len(generated)} governance recommendations.")
        return generated

    def get_cost_analytics_summary(self, db: Session) -> CostAnalyticsSummary:
        recommendations = recommendation_repository.get_all_ordered_by_priority(db, limit=500)

        total_cost = 0.0
        unmanaged_cost = 0.0
        by_type: Dict[str, float] = {}
        top_items: List[Dict[str, Any]] = []

        for rec in recommendations:
            cost = rec.estimated_monthly_cost
            total_cost += cost

            event = drift_repository.get(db, rec.drift_event_id)
            res_type = event.resource_type if event else "Unknown"

            if event and "Unmanaged" in event.drift_category.value:
                unmanaged_cost += cost

            by_type[res_type] = round(by_type.get(res_type, 0.0) + cost, 2)

            top_items.append({
                "recommendation_id": rec.id,
                "provider_id": rec.provider_id,
                "resource_name": event.resource_name if event else rec.provider_id,
                "resource_type": res_type,
                "priority_score": rec.priority_score,
                "estimated_monthly_cost": round(cost, 2),
                "category": event.drift_category.value if event else "General"
            })

        top_items = sorted(top_items, key=lambda x: x["estimated_monthly_cost"], reverse=True)[:10]

        return CostAnalyticsSummary(
            total_estimated_monthly_cost=round(total_cost, 2),
            unmanaged_resource_cost=round(unmanaged_cost, 2),
            potential_monthly_savings=round(unmanaged_cost * 0.8, 2),
            cost_by_resource_type=by_type,
            top_cost_drift_items=top_items
        )


cost_analysis_service = CostAnalysisService()
