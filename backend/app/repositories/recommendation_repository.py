from typing import Optional, List
from sqlalchemy.orm import Session
from app.domain.models.recommendation import Recommendation
from app.repositories.base import BaseRepository


class RecommendationRepository(BaseRepository[Recommendation]):
    def __init__(self):
        super().__init__(Recommendation)

    def get_by_drift_event(self, db: Session, drift_event_id: int) -> Optional[Recommendation]:
        return db.query(Recommendation).filter(Recommendation.drift_event_id == drift_event_id).first()

    def get_all_ordered_by_priority(self, db: Session, skip: int = 0, limit: int = 100) -> List[Recommendation]:
        return db.query(Recommendation).order_by(Recommendation.priority_score.desc()).offset(skip).limit(limit).all()


recommendation_repository = RecommendationRepository()
