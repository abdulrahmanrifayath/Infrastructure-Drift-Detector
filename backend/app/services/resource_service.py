from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.resource_repository import resource_repository
from app.domain.models.resource import Resource, ResourceType, ResourceStatus
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceMetrics
from app.core.logging import logger


class ResourceService:
    """
    Application Service managing Cloud Resource Inventory operations.
    """

    def list_resources(
        self,
        db: Session,
        resource_type: Optional[ResourceType] = None,
        is_managed: Optional[bool] = None,
        region: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Resource], int]:
        return resource_repository.filter_resources(
            db=db,
            resource_type=resource_type,
            is_managed=is_managed,
            region=region,
            search=search,
            skip=skip,
            limit=limit
        )

    def get_resource_by_id(self, db: Session, resource_id: int) -> Resource:
        resource = resource_repository.get(db, id=resource_id)
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Resource with ID {resource_id} not found."
            )
        return resource

    def create_resource(self, db: Session, resource_in: ResourceCreate) -> Resource:
        existing = resource_repository.get_by_provider_id(db, provider_id=resource_in.provider_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Resource with provider_id '{resource_in.provider_id}' already exists."
            )

        data = resource_in.model_dump()
        created = resource_repository.create(db, obj_in=data)
        logger.info(f"Created new inventory resource: {created.resource_name} ({created.provider_id})")
        return created

    def update_resource(self, db: Session, resource_id: int, resource_in: ResourceUpdate) -> Resource:
        resource = self.get_resource_by_id(db, resource_id=resource_id)
        data = resource_in.model_dump(exclude_unset=True)
        data["last_checked_at"] = datetime.utcnow()
        updated = resource_repository.update(db, db_obj=resource, obj_in=data)
        logger.info(f"Updated resource {resource_id}: {updated.resource_name}")
        return updated

    def delete_resource(self, db: Session, resource_id: int) -> Resource:
        resource = self.get_resource_by_id(db, resource_id=resource_id)
        resource_repository.remove(db, id=resource_id)
        logger.info(f"Deleted resource {resource_id}")
        return resource

    def get_metrics(self, db: Session) -> ResourceMetrics:
        raw_metrics = resource_repository.get_inventory_metrics(db)
        return ResourceMetrics(**raw_metrics)

    def seed_demo_inventory(self, db: Session) -> List[Resource]:
        """
        Seeds initial enterprise cloud resources supporting all 8 required types:
        EC2, Security Groups, IAM, VPC, Subnets, Load Balancers, Databases, S3.
        """
        demo_resources = [
            {
                "resource_name": "prod-api-cluster-node-01",
                "resource_type": ResourceType.EC2,
                "provider_id": "i-0a123456789abcdef0",
                "provider": "AWS",
                "region": "us-east-1",
                "status": ResourceStatus.ACTIVE,
                "is_managed": True,
                "configuration_metadata": {"instance_type": "t3.large", "ami": "ami-0c55b159cbfafe1f0"}
            },
            {
                "resource_name": "legacy-dev-sandbox-vm",
                "resource_type": ResourceType.EC2,
                "provider_id": "i-0987654321fedcba0",
                "provider": "AWS",
                "region": "us-west-2",
                "status": ResourceStatus.STOPPED,
                "is_managed": False,
                "configuration_metadata": {"instance_type": "t2.micro", "unmanaged_reason": "Created via manual AWS Console"}
            },
            {
                "resource_name": "prod-alb-security-group",
                "resource_type": ResourceType.SECURITY_GROUP,
                "provider_id": "sg-01234567890abcdef",
                "provider": "AWS",
                "region": "us-east-1",
                "status": ResourceStatus.ACTIVE,
                "is_managed": True,
                "configuration_metadata": {"ingress_rules_count": 2, "allowed_ports": [80, 443]}
            },
            {
                "resource_name": "open-ssh-debug-sg",
                "resource_type": ResourceType.SECURITY_GROUP,
                "provider_id": "sg-09998887776655443",
                "provider": "AWS",
                "region": "us-east-1",
                "status": ResourceStatus.ACTIVE,
                "is_managed": False,
                "configuration_metadata": {"warning": "0.0.0.0/0 port 22 open manually"}
            },
            {
                "resource_name": "TerraformExecutionRole",
                "resource_type": ResourceType.IAM,
                "provider_id": "arn:aws:iam::123456789012:role/TerraformExecutionRole",
                "provider": "AWS",
                "region": "global",
                "status": ResourceStatus.ACTIVE,
                "is_managed": True,
                "configuration_metadata": {"attached_policies": ["AdministratorAccess"]}
            },
            {
                "resource_name": "prod-vpc-main",
                "resource_type": ResourceType.VPC,
                "provider_id": "vpc-0a1b2c3d4e5f6g7h8",
                "provider": "AWS",
                "region": "us-east-1",
                "status": ResourceStatus.ACTIVE,
                "is_managed": True,
                "configuration_metadata": {"cidr_block": "10.0.0.0/16", "enable_dns_hostnames": True}
            },
            {
                "resource_name": "prod-public-subnet-1a",
                "resource_type": ResourceType.SUBNET,
                "provider_id": "subnet-01122334455667788",
                "provider": "AWS",
                "region": "us-east-1a",
                "status": ResourceStatus.ACTIVE,
                "is_managed": True,
                "configuration_metadata": {"cidr_block": "10.0.1.0/24", "map_public_ip_on_launch": True}
            },
            {
                "resource_name": "prod-external-alb",
                "resource_type": ResourceType.LOAD_BALANCER,
                "provider_id": "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/prod-external-alb/12345",
                "provider": "AWS",
                "region": "us-east-1",
                "status": ResourceStatus.ACTIVE,
                "is_managed": True,
                "configuration_metadata": {"scheme": "internet-facing", "type": "application"}
            },
            {
                "resource_name": "prod-postgres-db-primary",
                "resource_type": ResourceType.DATABASE,
                "provider_id": "rds-prod-postgres-main",
                "provider": "AWS",
                "region": "us-east-1",
                "status": ResourceStatus.ACTIVE,
                "is_managed": True,
                "configuration_metadata": {"engine": "postgres", "engine_version": "15.4", "multi_az": True}
            },
            {
                "resource_name": "enterprise-tf-state-bucket",
                "resource_type": ResourceType.S3,
                "provider_id": "s3:::enterprise-tf-state-bucket-prod",
                "provider": "AWS",
                "region": "us-east-1",
                "status": ResourceStatus.ACTIVE,
                "is_managed": True,
                "configuration_metadata": {"versioning": "Enabled", "encryption": "aws:kms"}
            },
            {
                "resource_name": "shadow-it-backup-bucket",
                "resource_type": ResourceType.S3,
                "provider_id": "s3:::unmanaged-temp-backups-bucket",
                "provider": "AWS",
                "region": "eu-central-1",
                "status": ResourceStatus.ACTIVE,
                "is_managed": False,
                "configuration_metadata": {"versioning": "Disabled", "public_access": "Unrestricted"}
            }
        ]

        created_list = []
        for item in demo_resources:
            existing = resource_repository.get_by_provider_id(db, provider_id=item["provider_id"])
            if not existing:
                created_list.append(resource_repository.create(db, obj_in=item))
            else:
                created_list.append(existing)

        logger.info(f"Seeded demo resource inventory ({len(created_list)} resources available)")
        return created_list


resource_service = ResourceService()
