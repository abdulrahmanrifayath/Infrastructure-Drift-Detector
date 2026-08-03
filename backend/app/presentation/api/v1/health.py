from fastapi import APIRouter
from app.schemas.common import APIResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=APIResponse[dict])
def health_check():
    """
    Health check endpoint for container probes and deployment monitoring.
    """
    return APIResponse(
        success=True,
        message="Infrastructure Drift Detector Backend API is healthy",
        data={"status": "healthy", "service": "backend"}
    )
