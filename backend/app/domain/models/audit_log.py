from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.domain.models.base import BaseModel


class AuditLog(BaseModel):
    """
    Audit log entity recording all system operations, scan executions, and configuration changes.
    """
    __tablename__ = "audit_logs"

    action = Column(String(100), nullable=False, index=True)
    actor = Column(String(255), default="System Engine", nullable=False)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
