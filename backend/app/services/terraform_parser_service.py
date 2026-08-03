import json
from typing import List, Dict, Any
from app.core.logging import logger

# Terraform resource type mappings to normalized platform types
TF_TYPE_MAP = {
    "aws_instance": "EC2",
    "aws_security_group": "Security Group",
    "aws_iam_role": "IAM",
    "aws_iam_policy": "IAM",
    "aws_vpc": "VPC",
    "aws_subnet": "Subnet",
    "aws_lb": "Load Balancer",
    "aws_alb": "Load Balancer",
    "aws_db_instance": "Database",
    "aws_s3_bucket": "S3",
}


class TerraformParserService:
    """
    Service responsible for parsing Terraform .tfstate v4 JSON payloads into Desired Resource objects.
    """

    def parse_tfstate_json(self, state_json_content: str) -> List[Dict[str, Any]]:
        """
        Parses raw string representation of a .tfstate file and returns normalized desired resources.
        """
        try:
            data = json.loads(state_json_content)
        except Exception as e:
            logger.error(f"Failed to parse JSON content: {str(e)}")
            raise ValueError(f"Invalid Terraform JSON format: {str(e)}")

        resources = data.get("resources", [])
        desired_items: List[Dict[str, Any]] = []

        for res in resources:
            tf_type = res.get("type", "")
            mapped_type = TF_TYPE_MAP.get(tf_type)
            if not mapped_type:
                # Fallback matching
                if "instance" in tf_type:
                    mapped_type = "EC2"
                elif "security_group" in tf_type:
                    mapped_type = "Security Group"
                elif "iam" in tf_type:
                    mapped_type = "IAM"
                elif "vpc" in tf_type:
                    mapped_type = "VPC"
                elif "subnet" in tf_type:
                    mapped_type = "Subnet"
                elif "lb" in tf_type or "alb" in tf_type:
                    mapped_type = "Load Balancer"
                elif "db" in tf_type or "rds" in tf_type:
                    mapped_type = "Database"
                elif "s3" in tf_type:
                    mapped_type = "S3"
                else:
                    mapped_type = tf_type

            instances = res.get("instances", [])
            for inst in instances:
                attributes = inst.get("attributes", {})
                provider_id = (
                    attributes.get("id") or
                    attributes.get("arn") or
                    f"{res.get('name')}-id"
                )
                res_name = attributes.get("name") or attributes.get("tags", {}).get("Name") or res.get("name")
                region = attributes.get("region") or attributes.get("availability_zone", "us-east-1")[:9] or "us-east-1"

                desired_items.append({
                    "resource_type": mapped_type,
                    "provider_id": str(provider_id),
                    "resource_name": str(res_name),
                    "provider": "AWS",
                    "region": str(region),
                    "configuration_payload": attributes,
                    "source_file": "terraform.tfstate"
                })

        logger.info(f"Successfully parsed {len(desired_items)} desired resources from Terraform state.")
        return desired_items

    def get_sample_terraform_state(self) -> str:
        """
        Generates standard sample .tfstate v4 payload for demonstration and testing.
        """
        sample = {
            "version": 4,
            "terraform_version": "1.6.0",
            "serial": 1,
            "resources": [
                {
                    "mode": "managed",
                    "type": "aws_instance",
                    "name": "prod_api_node",
                    "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
                    "instances": [
                        {
                            "attributes": {
                                "id": "i-0a123456789abcdef0",
                                "instance_type": "t3.large",
                                "ami": "ami-0c55b159cbfafe1f0",
                                "region": "us-east-1",
                                "tags": {"Name": "prod-api-cluster-node-01"}
                            }
                        }
                    ]
                },
                {
                    "mode": "managed",
                    "type": "aws_security_group",
                    "name": "alb_sg",
                    "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
                    "instances": [
                        {
                            "attributes": {
                                "id": "sg-01234567890abcdef",
                                "name": "prod-alb-security-group",
                                "description": "Production ALB Security Group",
                                "region": "us-east-1"
                            }
                        }
                    ]
                },
                {
                    "mode": "managed",
                    "type": "aws_vpc",
                    "name": "main_vpc",
                    "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
                    "instances": [
                        {
                            "attributes": {
                                "id": "vpc-0a1b2c3d4e5f6g7h8",
                                "cidr_block": "10.0.0.0/16",
                                "tags": {"Name": "prod-vpc-main"}
                            }
                        }
                    ]
                },
                {
                    "mode": "managed",
                    "type": "aws_subnet",
                    "name": "public_subnet_1a",
                    "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
                    "instances": [
                        {
                            "attributes": {
                                "id": "subnet-01122334455667788",
                                "cidr_block": "10.0.1.0/24",
                                "tags": {"Name": "prod-public-subnet-1a"}
                            }
                        }
                    ]
                },
                {
                    "mode": "managed",
                    "type": "aws_lb",
                    "name": "external_alb",
                    "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
                    "instances": [
                        {
                            "attributes": {
                                "id": "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/prod-external-alb/12345",
                                "name": "prod-external-alb",
                                "load_balancer_type": "application"
                            }
                        }
                    ]
                },
                {
                    "mode": "managed",
                    "type": "aws_db_instance",
                    "name": "postgres_primary",
                    "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
                    "instances": [
                        {
                            "attributes": {
                                "id": "rds-prod-postgres-main",
                                "allocated_storage": 100,
                                "engine": "postgres",
                                "engine_version": "15.4"
                            }
                        }
                    ]
                },
                {
                    "mode": "managed",
                    "type": "aws_s3_bucket",
                    "name": "tf_state_bucket",
                    "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
                    "instances": [
                        {
                            "attributes": {
                                "id": "s3:::enterprise-tf-state-bucket-prod",
                                "bucket": "enterprise-tf-state-bucket-prod"
                            }
                        }
                    ]
                }
            ]
        }
        return json.dumps(sample, indent=2)


terraform_parser_service = TerraformParserService()
