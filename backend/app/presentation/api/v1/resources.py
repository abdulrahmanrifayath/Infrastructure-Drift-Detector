from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.resource import ResourceResponse, ResourceCreate, ResourceUpdate, ResourceMetrics
from app.domain.models.resource import ResourceType
from app.services.resource_service import resource_service
from app.presentation.api.deps import get_current_user
from app.domain.models.user import User

router = APIRouter(prefix="/resources", tags=["Resource Inventory"])


@router.get("", response_model=APIResponse[List[ResourceResponse]])
def get_resources(
    resource_type: Optional[ResourceType] = Query(None, description="Filter by resource type"),
    is_managed: Optional[bool] = Query(None, description="Filter by managed status"),
    region: Optional[str] = Query(None, description="Filter by region"),
    search: Optional[str] = Query(None, description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves cloud resource inventory with support for filtering, search, and pagination.
    """
    items, total = resource_service.list_resources(
        db=db,
        resource_type=resource_type,
        is_managed=is_managed,
        region=region,
        search=search,
        skip=skip,
        limit=limit
    )

    data = [ResourceResponse.model_validate(item) for item in items]
    return APIResponse(
        success=True,
        message=f"Retrieved {len(data)} of {total} cloud resources.",
        data=data
    )


@router.get("/metrics", response_model=APIResponse[ResourceMetrics])
def get_inventory_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns inventory summary analytics including total resources, managed percentage, and breakdown by type.
    """
    metrics = resource_service.get_metrics(db)
    return APIResponse(
        success=True,
        message="Inventory metrics calculated successfully.",
        data=metrics
    )


@router.post("/seed-demo", response_model=APIResponse[List[ResourceResponse]])
def seed_demo_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Seeds initial enterprise sample inventory with EC2, Security Groups, IAM, VPC, Subnets, ELB, RDS, and S3 resources.
    """
    seeded = resource_service.seed_demo_inventory(db)
    data = [ResourceResponse.model_validate(item) for item in seeded]
    return APIResponse(
        success=True,
        message="Sample cloud resource inventory successfully seeded.",
        data=data
    )


@router.get("/{resource_id}", response_model=APIResponse[ResourceResponse])
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed inventory record for a specific resource by ID.
    """
    resource = resource_service.get_resource_by_id(db, resource_id=resource_id)
    return APIResponse(
        success=True,
        message="Resource details retrieved.",
        data=ResourceResponse.model_validate(resource)
    )


@router.post("", response_model=APIResponse[ResourceResponse], status_code=status.HTTP_201_CREATED)
def create_resource(
    resource_in: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually register a resource into the inventory.
    """
    created = resource_service.create_resource(db, resource_in=resource_in)
    return APIResponse(
        success=True,
        message="Resource registered successfully in inventory.",
        data=ResourceResponse.model_validate(created)
    )


@router.put("/{resource_id}", response_model=APIResponse[ResourceResponse])
def update_resource(
    resource_id: int,
    resource_in: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update resource details or management status.
    """
    updated = resource_service.update_resource(db, resource_id=resource_id, resource_in=resource_in)
    return APIResponse(
        success=True,
        message="Resource updated successfully.",
        data=ResourceResponse.model_validate(updated)
    )


@router.delete("/{resource_id}", response_model=APIResponse[ResourceResponse])
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a resource from inventory tracking.
    """
    deleted = resource_service.delete_resource(db, resource_id=resource_id)
    return APIResponse(
        success=True,
        message="Resource removed from inventory.",
        data=ResourceResponse.model_validate(deleted)
    )
