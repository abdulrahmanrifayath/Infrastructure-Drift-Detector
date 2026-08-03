from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import logger
from app.core.database import engine, Base
from app.presentation.api.v1.router import api_router
from app.presentation.middleware.logging_middleware import LoggingMiddleware
from app.presentation.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    global_exception_handler,
)

# Auto-create tables for initial phase foundation (Alembic can manage migrations)
Base.metadata.create_all(bind=engine)


def create_application() -> FastAPI:
    """
    FastAPI Application Factory function initializing settings, middleware, exception handlers, and routes.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
    )

    # CORS Middleware
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Custom Logging Middleware
    app.add_middleware(LoggingMiddleware)

    # Exception Handlers
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)

    # API Routes
    app.include_router(api_router, prefix=settings.API_V1_STR)

    logger.info("Infrastructure Drift Detector FastAPI application initialized.")
    return app


app = create_application()
