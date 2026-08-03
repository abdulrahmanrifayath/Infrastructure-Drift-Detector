from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Standardized Enterprise API Response Wrapper.
    Enforces unified response contract across all endpoints.
    """
    success: bool = Field(..., description="Indicates if operation succeeded")
    message: str = Field(default="Operation completed successfully", description="Human-readable response message")
    data: Optional[T] = Field(default=None, description="Payload data returned by API")
    errors: Optional[Any] = Field(default=None, description="Detailed error information if failed")
