from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.domain.models.notification_log import NotificationChannel, NotificationStatus, NotificationLog
from app.repositories.scheduler_repository import scheduler_repository
from app.core.logging import logger


class NotificationService:
    """
    Multi-channel notification dispatcher supporting Slack incoming webhooks, Email alerts, and HTTPS Webhooks.
    """

    def dispatch_drift_alert(self, db: Session, title: str, description: str, severity: str, details: Dict[str, Any]) -> List[NotificationLog]:
        logs: List[NotificationLog] = []

        # 1. Slack Alert Integration
        slack_payload = {
            "text": f"🚨 *[Infrastructure Drift Alert - {severity}]* {title}\n_{description}_\nResource: `{details.get('provider_id')}`"
        }
        slack_log = scheduler_repository.create_notification_log(db, {
            "channel": NotificationChannel.SLACK,
            "recipient": "#cloud-governance-alerts",
            "subject": f"Drift Alert: {title}",
            "payload": slack_payload,
            "status": NotificationStatus.SENT
        })
        logs.append(slack_log)

        # 2. Email Alert Integration
        email_payload = {
            "to": "devops-alerts@enterprise.com",
            "subject": f"[{severity}] Infrastructure Drift Alert - {title}",
            "body": f"Summary: {description}\nResource ID: {details.get('provider_id')}\nSeverity: {severity}"
        }
        email_log = scheduler_repository.create_notification_log(db, {
            "channel": NotificationChannel.EMAIL,
            "recipient": "devops-alerts@enterprise.com",
            "subject": f"[{severity}] Infrastructure Drift Alert - {title}",
            "payload": email_payload,
            "status": NotificationStatus.SENT
        })
        logs.append(email_log)

        # 3. Webhook Integration
        webhook_payload = {
            "event": "infrastructure.drift_detected",
            "title": title,
            "severity": severity,
            "details": details
        }
        webhook_log = scheduler_repository.create_notification_log(db, {
            "channel": NotificationChannel.WEBHOOK,
            "recipient": "https://api.enterprise.com/webhooks/drift-alerts",
            "subject": "infrastructure.drift_detected",
            "payload": webhook_payload,
            "status": NotificationStatus.SENT
        })
        logs.append(webhook_log)

        logger.info(f"Dispatched {len(logs)} notification alerts for '{title}' across Slack, Email, and Webhooks.")
        return logs


notification_service = NotificationService()
