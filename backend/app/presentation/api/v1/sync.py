from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.sync import (
    SyncJobResponse,
    SyncJobCreate,
    ComparisonReadyPair,
    DesiredResourceResponse
)
from app.services.sync_service import sync_service
from app.services.terraform_parser_service import terraform_parser_service
from app.repositories.sync_repository import sync_repository
from app.presentation.api.deps import get_current_user
from app.domain.models.user import User

router = APIRouter(prefix="/sync", tags=["Cloud Synchronization Engine"])


@router.post("/run", response_model=APIResponse[SyncJobResponse], status_code=status.HTTP_201_CREATED)
def trigger_synchronization_job(
    payload: Optional[SyncJobCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers a cloud infrastructure synchronization job.
    Parses Terraform state (provided or default sample) and discovers live AWS resources.
    """
    raw_tf = payload.terraform_state_raw if payload else None
    job = sync_service.run_synchronization_job(db=db, terraform_state_raw=raw_tf)
    return APIResponse(
        success=True,
        message="Cloud infrastructure synchronization job executed successfully.",
        data=SyncJobResponse.model_validate(job)
    )


@router.post("/parse-terraform", response_model=APIResponse[List[DesiredResourceResponse]])
def parse_terraform_state(
    payload: SyncJobCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Extracts desired resources directly from a raw Terraform .tfstate JSON string payload.
    """
    raw_json = payload.terraform_state_raw or terraform_parser_service.get_sample_terraform_state()
    parsed_items = terraform_parser_service.parse_tfstate_json(raw_json)

    # Return validated dummy responses for preview
    preview_data = [
        DesiredResourceResponse(
            id=idx + 1,
            sync_job_id=0,
            resource_type=item["resource_type"],
            provider_id=item["provider_id"],
            resource_name=item["resource_name"],
            provider=item["provider"],
            region=item["region"],
            configuration_payload=item["configuration_payload"],
            source_file=item["source_file"]
        ) for idx, item in enumerate(parsed_items)
    ]

    return APIResponse(
        success=True,
        message=f"Parsed {len(preview_data)} desired resources from Terraform state.",
        data=preview_data
    )


@router.get("/sample-tfstate", response_model=APIResponse[dict])
def get_sample_tfstate_raw(
    current_user: User = Depends(get_current_user)
):
    """
    Returns standard sample Terraform .tfstate JSON for user testing.
    """
    sample_json = terraform_parser_service.get_sample_terraform_state()
    return APIResponse(
        success=True,
        message="Sample Terraform state retrieved.",
        data={"raw_json": sample_json}
    )


@router.get("/jobs", response_model=APIResponse[List[SyncJobResponse]])
def get_sync_job_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves history of cloud infrastructure synchronization runs.
    """
    jobs = sync_repository.get_multi(db, skip=skip, limit=limit)
    data = [SyncJobResponse.model_validate(j) for j in jobs]
    return APIResponse(
        success=True,
        message=f"Retrieved {len(data)} sync jobs history.",
        data=data
    )


@router.get("/comparison-ready", response_model=APIResponse[List[ComparisonReadyPair]])
def get_comparison_ready_inventory(
    job_id: Optional[int] = Query(None, description="Specific SyncJob ID or latest"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves paired comparison snapshot (Desired vs Actual Live State) ready for drift detection analysis.
    """
    pairs = sync_service.get_comparison_ready_pairs(db=db, sync_job_id=job_id)
    return APIResponse(
        success=True,
        message=f"Retrieved {len(pairs)} comparison-ready resource pairs.",
        data=pairs
    )
