from typing import List, Optional
from sqlalchemy.orm import Session
from app.domain.models.sync_job import SyncJob, SyncJobStatus
from app.domain.models.desired_resource import DesiredResource
from app.domain.models.actual_resource import ActualResource
from app.repositories.base import BaseRepository


class SyncRepository(BaseRepository[SyncJob]):
    def __init__(self):
        super().__init__(SyncJob)

    def create_desired_resources(self, db: Session, desired_list: List[dict]) -> List[DesiredResource]:
        objects = [DesiredResource(**item) for item in desired_list]
        db.add_all(objects)
        db.commit()
        return objects

    def create_actual_resources(self, db: Session, actual_list: List[dict]) -> List[ActualResource]:
        objects = [ActualResource(**item) for item in actual_list]
        db.add_all(objects)
        db.commit()
        return objects

    def get_desired_by_job(self, db: Session, sync_job_id: int) -> List[DesiredResource]:
        return db.query(DesiredResource).filter(DesiredResource.sync_job_id == sync_job_id).all()

    def get_actual_by_job(self, db: Session, sync_job_id: int) -> List[ActualResource]:
        return db.query(ActualResource).filter(ActualResource.sync_job_id == sync_job_id).all()

    def get_latest_sync_job(self, db: Session) -> Optional[SyncJob]:
        return db.query(SyncJob).order_by(SyncJob.created_at.desc()).first()


sync_repository = SyncRepository()
