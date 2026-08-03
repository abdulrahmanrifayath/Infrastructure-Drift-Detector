from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.domain.models.drift_event import DriftCategory, DriftSeverity, DriftStatus, DriftEvent
from app.repositories.drift_repository import drift_repository
from app.repositories.sync_repository import sync_repository
from app.core.logging import logger


class DriftDetectionEngine:
    """
    Core Reusable Comparison Engine performing deep diff evaluation between desired IaC and actual live state.
    Calculates categories (Configuration, Security, IAM, Networking, Missing, Unmanaged) and assigns Critical/High/Medium/Low severity.
    """

    def analyze_sync_job_drift(self, db: Session, sync_job_id: int) -> List[DriftEvent]:
        desired_resources = sync_repository.get_desired_by_job(db, sync_job_id)
        actual_resources = sync_repository.get_actual_by_job(db, sync_job_id)

        desired_map = {d.provider_id: d for d in desired_resources}
        actual_map = {a.provider_id: a for a in actual_resources}

        drift_payloads: List[Dict[str, Any]] = []
        all_ids = set(desired_map.keys()).union(set(actual_map.keys()))

        for provider_id in sorted(all_ids):
            des = desired_map.get(provider_id)
            act = actual_map.get(provider_id)

            if des and not act:
                # Missing Resource Drift
                drift_payloads.append(self._create_missing_resource_event(sync_job_id, des))
            elif act and not des:
                # Unmanaged Resource Drift
                drift_payloads.append(self._create_unmanaged_resource_event(sync_job_id, act))
            elif des and act:
                # Compare attribute deltas
                deltas, category, severity, title, desc = self._evaluate_attribute_diff(des, act)
                if deltas:
                    drift_payloads.append({
                        "sync_job_id": sync_job_id,
                        "resource_name": act.resource_name or des.resource_name,
                        "provider_id": provider_id,
                        "resource_type": des.resource_type,
                        "drift_category": category,
                        "severity": severity,
                        "status": DriftStatus.OPEN,
                        "title": title,
                        "description": desc,
                        "desired_state": des.configuration_payload,
                        "actual_state": act.configuration_payload,
                        "diff_details": deltas
                    })

        # Clear past events for this job and persist new events
        drift_repository.clear_events_for_job(db, sync_job_id)
        created_events = [drift_repository.create(db, obj_in=item) for item in drift_payloads]
        logger.info(f"Drift Detection Engine analyzed sync job #{sync_job_id} -> Identified {len(created_events)} drift events.")
        return created_events

    def _create_missing_resource_event(self, sync_job_id: int, des) -> Dict[str, Any]:
        severity = DriftSeverity.HIGH
        if des.resource_type in ["Database", "EC2", "S3"]:
            severity = DriftSeverity.CRITICAL

        return {
            "sync_job_id": sync_job_id,
            "resource_name": des.resource_name,
            "provider_id": des.provider_id,
            "resource_type": des.resource_type,
            "drift_category": DriftCategory.MISSING_RESOURCE,
            "severity": severity,
            "status": DriftStatus.OPEN,
            "title": f"Missing Resource: {des.resource_name}",
            "description": f"Declared in Terraform state ({des.source_file}) but absent in live AWS discovery.",
            "desired_state": des.configuration_payload,
            "actual_state": None,
            "diff_details": {"missing_in_cloud": True, "provider_id": des.provider_id}
        }

    def _create_unmanaged_resource_event(self, sync_job_id: int, act) -> Dict[str, Any]:
        category = DriftCategory.UNMANAGED_RESOURCE
        severity = DriftSeverity.MEDIUM

        if act.resource_type == "Security Group":
            category = DriftCategory.SECURITY
            severity = DriftSeverity.HIGH
        elif act.resource_type == "IAM":
            category = DriftCategory.IAM
            severity = DriftSeverity.HIGH

        return {
            "sync_job_id": sync_job_id,
            "resource_name": act.resource_name,
            "provider_id": act.provider_id,
            "resource_type": act.resource_type,
            "drift_category": category,
            "severity": severity,
            "status": DriftStatus.OPEN,
            "title": f"Unmanaged Cloud Resource: {act.resource_name}",
            "description": f"Discovered in live AWS ({act.region}) but not tracked in Terraform state.",
            "desired_state": None,
            "actual_state": act.configuration_payload,
            "diff_details": {"unmanaged_in_cloud": True, "provider_id": act.provider_id}
        }

    def _evaluate_attribute_diff(self, des, act) -> Tuple[Dict[str, Any], DriftCategory, DriftSeverity, str, str]:
        desired_payload = des.configuration_payload or {}
        actual_payload = act.configuration_payload or {}

        deltas: Dict[str, Any] = {}
        category = DriftCategory.CONFIGURATION
        severity = DriftSeverity.LOW

        all_keys = set(desired_payload.keys()).union(set(actual_payload.keys()))

        for key in all_keys:
            d_val = desired_payload.get(key)
            a_val = actual_payload.get(key)

            if d_val != a_val:
                deltas[key] = {"desired": d_val, "actual": a_val}

                # Security & Port rules inspection
                if "ingress" in key or "ports" in key or "security" in key or "public" in key:
                    category = DriftCategory.SECURITY
                    if "0.0.0.0/0" in str(a_val) or "22" in str(a_val):
                        severity = DriftSeverity.CRITICAL

                # IAM Policy inspection
                elif "iam" in des.resource_type.lower() or "policy" in key or "role" in key:
                    category = DriftCategory.IAM
                    if "AdministratorAccess" in str(a_val) or "*" in str(a_val):
                        severity = DriftSeverity.CRITICAL
                    else:
                        severity = DriftSeverity.HIGH

                # Networking inspection
                elif des.resource_type in ["VPC", "Subnet", "Load Balancer"] or "cidr" in key:
                    category = DriftCategory.NETWORKING
                    severity = DriftSeverity.MEDIUM

                elif severity != DriftSeverity.CRITICAL:
                    severity = DriftSeverity.MEDIUM

        title = f"{category.value} Drift: {des.resource_name}"
        desc = f"Detected {len(deltas)} attribute mismatches between Terraform IaC and live AWS state."

        return deltas, category, severity, title, desc


drift_detection_engine = DriftDetectionEngine()
