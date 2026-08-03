import time
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger

# Simple in-memory bucket rate limiter (100 requests per minute per IP)
RATE_LIMIT_REQUESTS = 120
RATE_LIMIT_WINDOW = 60  # seconds


class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.ip_requests: Dict[str, List[float]] = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        # Clean old requests outside window
        timestamps = self.ip_requests.get(client_ip, [])
        timestamps = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]

        if len(timestamps) >= RATE_LIMIT_REQUESTS:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on {request.url.path}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait before making further requests."
            )

        timestamps.append(now)
        self.ip_requests[client_ip] = timestamps

        response = await call_next(request)
        return response
