from datetime import datetime
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.domain.models.sync_job import SyncJob, SyncJobStatus
from app.repositories.sync_repository import sync_repository
from app.repositories.resource_repository import resource_repository
from app.services.terraform_parser_service import terraform_parser_service
from app.services.aws_discovery_service import aws_discovery_service
from app.schemas.sync import ComparisonReadyPair, DesiredResourceResponse, ActualResourceResponse
from app.core.logging import logger


class SyncService:
    """
    Orchestration service coordinating Terraform parsing, AWS SDK Discovery, and Comparison Snapshot generation.
    """

    def run_synchronization_job(self, db: Session, terraform_state_raw: Optional[str] = None) -> SyncJob:
        # Create SyncJob record
        job = sync_repository.create(db, obj_in={
            "status": SyncJobStatus.RUNNING,
            "started_at": datetime.utcnow()
        })
        logger.info(f"Starting cloud infrastructure sync job #{job.id}...")

        try:
            # 1. Parse Terraform desired state
            raw_tf = terraform_state_raw or terraform_parser_service.get_sample_terraform_state()
            desired_items = terraform_parser_service.parse_tfstate_json(raw_tf)
            for item in desired_items:
                item["sync_job_id"] = job.id
            created_desired = sync_repository.create_desired_resources(db, desired_items)

            # 2. Discover AWS live cloud infrastructure
            actual_items = aws_discovery_service.discover_live_resources()
            for item in actual_items:
                item["sync_job_id"] = job.id
            created_actual = sync_repository.create_actual_resources(db, actual_items)

            # 3. Synchronize main Resource Inventory repository
            self._sync_into_main_inventory(db, created_desired, created_actual)

            # 4. Update SyncJob completion status
            updated_job = sync_repository.update(db, db_obj=job, obj_in={
                "status": SyncJobStatus.COMPLETED,
                "completed_at": datetime.utcnow(),
                "desired_resources_count": len(created_desired),
                "actual_resources_count": len(created_actual)
            })

            logger.info(
                f"Sync job #{job.id} completed cleanly. "
                f"Desired: {len(created_desired)}, Actual Discovered: {len(created_actual)}"
            )
            return updated_job

        except Exception as e:
            logger.error(f"Sync job #{job.id} failed: {str(e)}", exc_info=True)
            sync_repository.update(db, db_obj=job, obj_in={
                "status": SyncJobStatus.FAILED,
                "completed_at": datetime.utcnow(),
                "error_message": str(e)
            })
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Synchronization failed: {str(e)}"
            )

    def get_comparison_ready_pairs(self, db: Session, sync_job_id: Optional[int] = None) -> List[ComparisonReadyPair]:
        """
        Builds side-by-side comparison snapshot models pairing desired vs actual cloud resources.
        """
        if not sync_job_id:
            latest_job = sync_repository.get_latest_sync_job(db)
            if not latest_job:
                return []
            sync_job_id = latest_job.id

        desired_list = sync_repository.get_desired_by_job(db, sync_job_id=sync_job_id)
        actual_list = sync_repository.get_actual_by_job(db, sync_job_id=sync_job_id)

        desired_map: Dict[str, DesiredResourceResponse] = {
            item.provider_id: DesiredResourceResponse.model_validate(item) for item in desired_list
        }
        actual_map: Dict[str, ActualResourceResponse] = {
            item.provider_id: ActualResourceResponse.model_validate(item) for item in actual_list
        }

        all_provider_ids = set(desired_map.keys()).union(set(actual_map.keys()))
        pairs: List[ComparisonReadyPair] = []

        for pid in sorted(all_provider_ids):
            des = desired_map.get(pid)
            act = actual_map.get(pid)

            resource_type = des.resource_type if des else (act.resource_type if act else "Unknown")

            if des and act:
                state = "in_sync"
                # Preliminary check for configuration attribute difference
                if des.configuration_payload != act.configuration_payload:
                    state = "drifted"
            elif des and not act:
                state = "missing_in_cloud"
            else:
                state = "unmanaged_in_cloud"

            pairs.append(ComparisonReadyPair(
                provider_id=pid,
                resource_type=resource_type,
                desired=des,
                actual=act,
                state=state
            ))

        return pairs

    def _sync_into_main_inventory(self, db: Session, desired_list, actual_list):
        desired_ids = {item.provider_id for item in desired_list}

        for act in actual_list:
            is_managed = act.provider_id in desired_ids
            existing = resource_repository.get_by_provider_id(db, provider_id=act.provider_id)
            payload = {
                "resource_name": act.resource_name,
                "resource_type": act.resource_type,
                "provider_id": act.provider_id,
                "provider": act.provider,
                "region": act.region,
                "status": act.status,
                "is_managed": is_managed,
                "configuration_metadata": act.configuration_payload
            }

            if existing:
                resource_repository.update(db, db_obj=existing, obj_in=payload)
            else:
                resource_repository.create(db, obj_in=payload)


sync_service = SyncService()
