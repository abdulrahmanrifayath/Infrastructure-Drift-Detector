import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, JSON
from app.domain.models.base import BaseModel


class ResourceType(str, enum.Enum):
    EC2 = "EC2"
    SECURITY_GROUP = "Security Group"
    IAM = "IAM"
    VPC = "VPC"
    SUBNET = "Subnet"
    LOAD_BALANCER = "Load Balancer"
    DATABASE = "Database"
    S3 = "S3"


class ResourceStatus(str, enum.Enum):
    ACTIVE = "active"
    STOPPED = "stopped"
    PROVISIONING = "provisioning"
    DELETED = "deleted"
    UNKNOWN = "unknown"


class Resource(BaseModel):
    """
    Resource entity representing cloud resources across AWS/cloud providers.
    """
    __tablename__ = "resources"

    resource_name = Column(String(255), nullable=False, index=True)
    resource_type = Column(Enum(ResourceType), nullable=False, index=True)
    provider_id = Column(String(255), nullable=False, unique=True, index=True)
    provider = Column(String(50), default="AWS", nullable=False)
    region = Column(String(50), nullable=False, default="us-east-1", index=True)
    status = Column(Enum(ResourceStatus), default=ResourceStatus.ACTIVE, nullable=False)
    is_managed = Column(Boolean, default=True, nullable=False, index=True)
    last_checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    configuration_metadata = Column(JSON, nullable=True)
