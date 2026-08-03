from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.domain.models.drift_event import DriftEvent, DriftCategory, DriftSeverity, DriftStatus
from app.repositories.base import BaseRepository


class DriftRepository(BaseRepository[DriftEvent]):
    def __init__(self):
        super().__init__(DriftEvent)

    def filter_drift_events(
        self,
        db: Session,
        category: Optional[DriftCategory] = None,
        severity: Optional[DriftSeverity] = None,
        status: Optional[DriftStatus] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[DriftEvent], int]:
        query = db.query(DriftEvent)

        if category:
            query = query.filter(DriftEvent.drift_category == category)

        if severity:
            query = query.filter(DriftEvent.severity == severity)

        if status:
            query = query.filter(DriftEvent.status == status)

        if search:
            pattern = f"%{search}%"
            query = query.filter(
                (DriftEvent.resource_name.ilike(pattern)) |
                (DriftEvent.provider_id.ilike(pattern)) |
                (DriftEvent.title.ilike(pattern))
            )

        total = query.count()
        results = query.order_by(DriftEvent.detected_at.desc()).offset(skip).limit(limit).all()
        return results, total

    def get_summary_metrics(self, db: Session) -> dict:
        total_drift = db.query(DriftEvent).count()
        open_drift = db.query(DriftEvent).filter(DriftEvent.status == DriftStatus.OPEN).count()

        critical = db.query(DriftEvent).filter(
            DriftEvent.severity == DriftSeverity.CRITICAL, DriftEvent.status == DriftStatus.OPEN
        ).count()
        high = db.query(DriftEvent).filter(
            DriftEvent.severity == DriftSeverity.HIGH, DriftEvent.status == DriftStatus.OPEN
        ).count()
        medium = db.query(DriftEvent).filter(
            DriftEvent.severity == DriftSeverity.MEDIUM, DriftEvent.status == DriftStatus.OPEN
        ).count()
        low = db.query(DriftEvent).filter(
            DriftEvent.severity == DriftSeverity.LOW, DriftEvent.status == DriftStatus.OPEN
        ).count()

        cat_counts = db.query(DriftEvent.drift_category, func.count(DriftEvent.id))\
            .filter(DriftEvent.status == DriftStatus.OPEN)\
            .group_by(DriftEvent.drift_category).all()
        by_category = {c.value if hasattr(c, 'value') else str(c): count for c, count in cat_counts}

        type_counts = db.query(DriftEvent.resource_type, func.count(DriftEvent.id))\
            .filter(DriftEvent.status == DriftStatus.OPEN)\
            .group_by(DriftEvent.resource_type).all()
        by_type = {t: count for t, count in type_counts}

        return {
            "total_drift_count": total_drift,
            "open_drift_count": open_drift,
            "critical_count": critical,
            "high_count": high,
            "medium_count": medium,
            "low_count": low,
            "by_category": by_category,
            "by_resource_type": by_type
        }

    def clear_events_for_job(self, db: Session, sync_job_id: int):
        db.query(DriftEvent).filter(DriftEvent.sync_job_id == sync_job_id).delete()
        db.commit()


drift_repository = DriftRepository()
