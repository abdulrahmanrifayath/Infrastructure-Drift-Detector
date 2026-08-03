from fastapi import APIRouter
from app.presentation.api.v1 import health, auth, resources, sync, drift

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(resources.router)
api_router.include_router(sync.router)
api_router.include_router(drift.router)
