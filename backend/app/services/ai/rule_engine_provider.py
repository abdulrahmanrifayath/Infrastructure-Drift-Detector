from typing import Dict, Any
from app.services.ai.base import BaseAIRecommendationProvider
from app.domain.models.drift_event import DriftCategory, DriftSeverity

# Standard estimated monthly costs per AWS resource type
COST_MATRIX = {
    "EC2": 72.0,           # Average t3.large instance running 24/7 ($0.0832/hr ~ $60-$90/mo)
    "Database": 180.0,     # RDS PostgreSQL Multi-AZ db.m5.large (~$180/mo)
    "Load Balancer": 22.5, # AWS ALB base price per month
    "S3": 15.0,            # Unmanaged or unencrypted bucket storage allocation
    "Security Group": 0.0, # Security Group configuration risk (indirect financial risk)
    "VPC": 0.0,
    "Subnet": 0.0,
    "IAM": 0.0
}


class RuleEngineAIProvider(BaseAIRecommendationProvider):
    """
    Rule-based AI engine evaluating drift severity, resource type, and attribute variances.
    Generates structured remediation guidance and dynamic 0-100 Priority Scores.
    """

    def generate_recommendation_payload(self, drift_event: Any) -> Dict[str, Any]:
        category = getattr(drift_event, 'drift_category', '')
        severity = getattr(drift_event, 'severity', '')
        res_type = getattr(drift_event, 'resource_type', '')
        res_name = getattr(drift_event, 'resource_name', '')
        provider_id = getattr(drift_event, 'provider_id', '')

        # Base Monthly Cost
        estimated_cost = COST_MATRIX.get(res_type, 25.0)
        if category == DriftCategory.UNMANAGED_RESOURCE.value or category == DriftCategory.UNMANAGED_RESOURCE:
            # Unmanaged resources incur 1.5x wasteful spend multiplier
            estimated_cost *= 1.5

        # Dynamic Priority Score Calculation (0 - 100)
        priority_score = self._calculate_priority_score(severity, category, estimated_cost)

        # Contextual Remediation Steps & Explanations
        explanation, biz_impact, sec_impact, fix_cmd, fix_time = self._build_contextual_remediation(
            category=str(category),
            severity=str(severity),
            res_type=res_type,
            res_name=res_name,
            provider_id=provider_id
        )

        return {
            "priority_score": priority_score,
            "explanation": explanation,
            "business_impact": biz_impact,
            "security_impact": sec_impact,
            "estimated_monthly_cost": round(estimated_cost, 2),
            "recommended_fix": fix_cmd,
            "estimated_fix_time": fix_time
        }

    def _calculate_priority_score(self, severity: Any, category: Any, cost: float) -> int:
        sev_str = str(severity).lower()
        score = 30

        if "critical" in sev_str:
            score = 95
        elif "high" in sev_str:
            score = 80
        elif "medium" in sev_str:
            score = 60
        else:
            score = 40

        # Cost boost
        if cost > 100:
            score = min(99, score + 10)

        return score

    def _build_contextual_remediation(self, category: str, severity: str, res_type: str, res_name: str, provider_id: str):
        if "Security" in category:
            explanation = f"Security drift detected on {res_name} ({provider_id}). Ingress ports or public access attributes differ from IaC definitions."
            biz_impact = "High risk of unauthorized network exposure, vulnerability exploits, and SOC 2 / HIPAA compliance failures."
            sec_impact = "Exposes internal ports (e.g. 22/3389/5432) to 0.0.0.0/0 public internet ranges."
            fix_cmd = (
                f"# AWS CLI Remediation:\n"
                f"aws ec2 revoke-security-group-ingress --group-id {provider_id} --protocol tcp --port 22 --cidr 0.0.0.0/0\n\n"
                f"# Terraform Remediation:\n"
                f"terraform import aws_security_group.{res_name.replace('-', '_')} {provider_id}\n"
                f"terraform apply"
            )
            fix_time = "10 mins"

        elif "IAM" in category:
            explanation = f"IAM policy or role permissions drift detected on {res_name}."
            biz_impact = "Elevated risk of privilege escalation, lateral movement, and unauthorized cloud access."
            sec_impact = "Over-privileged AdministratorAccess or wildcard '*' actions detected."
            fix_cmd = (
                f"# AWS CLI Remediation:\n"
                f"aws iam detach-role-policy --role-name {res_name} --policy-arn arn:aws:iam::aws:policy/AdministratorAccess\n\n"
                f"# Terraform Remediation:\n"
                f"terraform apply -target=aws_iam_role.{res_name.replace('-', '_')}"
            )
            fix_time = "15 mins"

        elif "Unmanaged" in category:
            explanation = f"Cloud resource {res_name} ({provider_id}) exists in live AWS but is unmanaged by Terraform."
            biz_impact = "Creates shadow IT infrastructure, untracked operational costs, and drift compliance audit issues."
            sec_impact = "Unmonitored resource without automated security scanning or centralized IAM policies."
            fix_cmd = (
                f"# Option A: Import into Terraform State\n"
                f"terraform import {res_type.lower()}.{res_name.replace('-', '_')} {provider_id}\n\n"
                f"# Option B: Terminate Unmanaged Resource\n"
                f"aws ec2 terminate-instances --instance-ids {provider_id}"
            )
            fix_time = "20 mins"

        elif "Missing" in category:
            explanation = f"Declared Terraform resource {res_name} is missing in live AWS cloud environment."
            biz_impact = "Application outages, failed database connection pools, or broken ingress routing."
            sec_impact = "Service degradation and infrastructure state discrepancy."
            fix_cmd = (
                f"# Re-provision missing resource via Terraform:\n"
                f"terraform apply -target={res_type.lower()}.{res_name.replace('-', '_')}"
            )
            fix_time = "10 mins"

        else:
            explanation = f"Configuration attribute variance detected on {res_type} ({res_name})."
            biz_impact = "Operational variance from standard deployment baselines."
            sec_impact = "Potential compliance rule drift."
            fix_cmd = f"terraform apply -auto-approve"
            fix_time = "15 mins"

        return explanation, biz_impact, sec_impact, fix_cmd, fix_time


rule_engine_ai_provider = RuleEngineAIProvider()
