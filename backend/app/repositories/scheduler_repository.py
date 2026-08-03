from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.domain.models.scheduler_config import SchedulerConfig
from app.domain.models.notification_log import NotificationLog, NotificationChannel
from app.domain.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class SchedulerRepository(BaseRepository[SchedulerConfig]):
    def __init__(self):
        super().__init__(SchedulerConfig)

    def get_or_create_config(self, db: Session) -> SchedulerConfig:
        config = db.query(SchedulerConfig).first()
        if not config:
            now = datetime.utcnow()
            config = SchedulerConfig(
                interval_minutes=60,
                is_active=True,
                last_scan_at=now,
                next_scan_at=now + timedelta(minutes=60)
            )
            db.add(config)
            db.commit()
            db.refresh(config)
        return config

    def create_notification_log(self, db: Session, payload: dict) -> NotificationLog:
        log = NotificationLog(**payload)
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def get_notification_logs(self, db: Session, skip: int = 0, limit: int = 100) -> List[NotificationLog]:
        return db.query(NotificationLog).order_by(NotificationLog.sent_at.desc()).offset(skip).limit(limit).all()

    def create_audit_log(self, db: Session, action: str, actor: str = "System Engine", details: dict = None) -> AuditLog:
        log = AuditLog(action=action, actor=actor, details=details or {}, timestamp=datetime.utcnow())
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def get_audit_logs(self, db: Session, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()


scheduler_repository = SchedulerRepository()
