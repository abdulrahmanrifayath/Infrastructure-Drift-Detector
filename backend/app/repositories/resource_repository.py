from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.domain.models.resource import Resource, ResourceType
from app.repositories.base import BaseRepository


class ResourceRepository(BaseRepository[Resource]):
    """
    Resource Repository providing custom queries for cloud inventory filtering and analytics.
    """
    def __init__(self):
        super().__init__(Resource)

    def get_by_provider_id(self, db: Session, provider_id: str) -> Optional[Resource]:
        return db.query(Resource).filter(Resource.provider_id == provider_id).first()

    def filter_resources(
        self,
        db: Session,
        resource_type: Optional[ResourceType] = None,
        is_managed: Optional[bool] = None,
        region: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Resource], int]:
        query = db.query(Resource)

        if resource_type:
            query = query.filter(Resource.resource_type == resource_type)

        if is_managed is not None:
            query = query.filter(Resource.is_managed == is_managed)

        if region:
            query = query.filter(Resource.region == region)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Resource.resource_name.ilike(search_pattern)) |
                (Resource.provider_id.ilike(search_pattern))
            )

        total = query.count()
        results = query.order_by(Resource.created_at.desc()).offset(skip).limit(limit).all()
        return results, total

    def get_inventory_metrics(self, db: Session) -> dict:
        total = db.query(Resource).count()
        managed = db.query(Resource).filter(Resource.is_managed == True).count()
        unmanaged = total - managed

        # Group by type
        type_counts = db.query(Resource.resource_type, func.count(Resource.id))\
            .group_by(Resource.resource_type).all()
        by_type = {t.value if hasattr(t, 'value') else str(t): count for t, count in type_counts}

        # Group by region
        region_counts = db.query(Resource.region, func.count(Resource.id))\
            .group_by(Resource.region).all()
        by_region = {region: count for region, count in region_counts}

        managed_pct = round((managed / total * 100), 2) if total > 0 else 0.0

        return {
            "total_resources": total,
            "managed_resources": managed,
            "unmanaged_resources": unmanaged,
            "managed_percentage": managed_pct,
            "resources_by_type": by_type,
            "resources_by_region": by_region,
        }


resource_repository = ResourceRepository()
