from fastapi import APIRouter
from app.presentation.api.v1 import health, auth

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
