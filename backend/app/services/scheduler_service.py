from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.repositories.scheduler_repository import scheduler_repository
from app.services.sync_service import sync_service
from app.services.drift_detection_engine import drift_detection_engine
from app.services.cost_analysis_service import cost_analysis_service
from app.services.notification_service import notification_service
from app.core.logging import logger


class SchedulerService:
    """
    Background Scheduler Service managing periodic automated drift scans.
    """

    def execute_scheduled_drift_scan(self):
        """
        Periodic worker execution task.
        """
        logger.info("Executing scheduled periodic drift scan worker task...")
        db: Session = SessionLocal()
        try:
            config = scheduler_repository.get_or_create_config(db)
            if not config.is_active:
                logger.info("Background scheduler is disabled. Skipping periodic scan.")
                return

            # 1. Run Sync Job
            sync_job = sync_service.run_synchronization_job(db)

            # 2. Run Drift Engine
            drift_events = drift_detection_engine.analyze_sync_job_drift(db, sync_job.id)

            # 3. Run AI Recommendations
            cost_analysis_service.generate_recommendations(db)

            # 4. Dispatch Notifications if critical/high drift found
            for event in drift_events:
                sev = getattr(event, 'severity', '').value if hasattr(getattr(event, 'severity', ''), 'value') else str(getattr(event, 'severity', ''))
                if "Critical" in sev or "High" in sev:
                    notification_service.dispatch_drift_alert(
                        db=db,
                        title=event.title,
                        description=event.description,
                        severity=sev,
                        details={"provider_id": event.provider_id, "resource_name": event.resource_name}
                    )

            # 5. Update Config Timestamps
            now = datetime.utcnow()
            next_run = now + timedelta(minutes=config.interval_minutes)
            scheduler_repository.update(db, db_obj=config, obj_in={
                "last_scan_at": now,
                "next_scan_at": next_run
            })

            # Record Audit Log
            scheduler_repository.create_audit_log(
                db,
                action="PERIODIC_DRIFT_SCAN_EXECUTED",
                actor="APScheduler Worker",
                details={
                    "sync_job_id": sync_job.id,
                    "drifts_found": len(drift_events),
                    "next_scan": next_run.isoformat()
                }
            )

            logger.info(f"Periodic drift scan worker completed successfully. Next scan at: {next_run}")

        except Exception as e:
            logger.error(f"Error during periodic drift scan worker: {str(e)}", exc_info=True)
        finally:
            db.close()


scheduler_service = SchedulerService()
