from fastapi import APIRouter
from app.presentation.api.v1 import health, auth, resources, sync, drift, recommendations, monitoring, analytics

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(resources.router)
api_router.include_router(sync.router)
api_router.include_router(drift.router)
api_router.include_router(recommendations.router)
api_router.include_router(monitoring.router)
api_router.include_router(analytics.router)
