import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Enum, JSON, ForeignKey, Text
from app.domain.models.base import BaseModel


class DriftCategory(str, enum.Enum):
    CONFIGURATION = "Configuration"
    MISSING_RESOURCE = "Missing Resource"
    UNMANAGED_RESOURCE = "Unmanaged Resource"
    SECURITY = "Security"
    IAM = "IAM"
    NETWORKING = "Networking"


class DriftSeverity(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class DriftStatus(str, enum.Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    IGNORED = "ignored"


class DriftEvent(BaseModel):
    """
    DriftEvent entity representing detected infrastructure drift between IaC and live Cloud APIs.
    """
    __tablename__ = "drift_events"

    sync_job_id = Column(Integer, ForeignKey("sync_jobs.id"), nullable=False, index=True)
    resource_name = Column(String(255), nullable=False, index=True)
    provider_id = Column(String(255), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False, index=True)
    drift_category = Column(Enum(DriftCategory), nullable=False, index=True)
    severity = Column(Enum(DriftSeverity), nullable=False, index=True)
    status = Column(Enum(DriftStatus), default=DriftStatus.OPEN, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    desired_state = Column(JSON, nullable=True)
    actual_state = Column(JSON, nullable=True)
    diff_details = Column(JSON, nullable=False)
