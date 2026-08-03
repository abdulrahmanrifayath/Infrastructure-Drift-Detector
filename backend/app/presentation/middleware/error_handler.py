from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.schemas.common import APIResponse
from app.core.logging import logger


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handles HTTPExceptions and formats error payload into standard APIResponse.
    """
    logger.warning(f"HTTP exception on {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse(
            success=False,
            message=str(exc.detail),
            data=None,
            errors=None
        ).model_dump()
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles request validation errors and returns standardized error structure.
    """
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=APIResponse(
            success=False,
            message="Input validation failed",
            data=None,
            errors=exc.errors()
        ).model_dump()
    )


async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches unhandled errors to avoid leaking stack traces in production.
    """
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=APIResponse(
            success=False,
            message="An unexpected internal server error occurred.",
            data=None,
            errors=str(exc)
        ).model_dump()
    )
