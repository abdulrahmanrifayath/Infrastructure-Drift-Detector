import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Enum, JSON
from app.domain.models.base import BaseModel


class NotificationChannel(str, enum.Enum):
    SLACK = "slack"
    EMAIL = "email"
    WEBHOOK = "webhook"


class NotificationStatus(str, enum.Enum):
    SENT = "sent"
    FAILED = "failed"


class NotificationLog(BaseModel):
    """
    Tracks multi-channel notification dispatch logs (Slack, Email, Webhooks).
    """
    __tablename__ = "notification_logs"

    channel = Column(Enum(NotificationChannel), nullable=False, index=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.SENT, nullable=False, index=True)
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
