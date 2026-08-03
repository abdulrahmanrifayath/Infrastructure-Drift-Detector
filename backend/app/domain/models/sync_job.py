import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Enum, Text
from app.domain.models.base import BaseModel


class SyncJobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SyncJob(BaseModel):
    """
    Tracks execution history and metrics of cloud infrastructure synchronization runs.
    """
    __tablename__ = "sync_jobs"

    status = Column(Enum(SyncJobStatus), default=SyncJobStatus.PENDING, nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    desired_resources_count = Column(Integer, default=0, nullable=False)
    actual_resources_count = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
