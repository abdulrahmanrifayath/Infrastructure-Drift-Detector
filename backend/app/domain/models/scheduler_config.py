from datetime import datetime
from sqlalchemy import Column, Integer, Boolean, DateTime
from app.domain.models.base import BaseModel


class SchedulerConfig(BaseModel):
    """
    Stores background scheduler scan frequency and execution timestamps.
    """
    __tablename__ = "scheduler_configs"

    interval_minutes = Column(Integer, default=60, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_scan_at = Column(DateTime, nullable=True)
    next_scan_at = Column(DateTime, nullable=True)
