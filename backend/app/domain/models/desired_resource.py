from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from app.domain.models.base import BaseModel
from app.domain.models.resource import ResourceType


class DesiredResource(BaseModel):
    """
    Desired cloud infrastructure state extracted from Terraform (.tfstate) files.
    """
    __tablename__ = "desired_resources"

    sync_job_id = Column(Integer, ForeignKey("sync_jobs.id"), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False, index=True)
    provider_id = Column(String(255), nullable=False, index=True)
    resource_name = Column(String(255), nullable=False, index=True)
    provider = Column(String(50), default="AWS", nullable=False)
    region = Column(String(50), default="us-east-1", nullable=False)
    configuration_payload = Column(JSON, nullable=False)
    source_file = Column(String(255), default="terraform.tfstate", nullable=False)
