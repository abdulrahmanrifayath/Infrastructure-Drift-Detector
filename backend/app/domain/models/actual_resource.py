from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from app.domain.models.base import BaseModel


class ActualResource(BaseModel):
    """
    Actual live cloud infrastructure state discovered via AWS SDK (boto3).
    """
    __tablename__ = "actual_resources"

    sync_job_id = Column(Integer, ForeignKey("sync_jobs.id"), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False, index=True)
    provider_id = Column(String(255), nullable=False, index=True)
    resource_name = Column(String(255), nullable=False, index=True)
    provider = Column(String(50), default="AWS", nullable=False)
    region = Column(String(50), default="us-east-1", nullable=False)
    status = Column(String(50), default="active", nullable=False)
    configuration_payload = Column(JSON, nullable=False)
