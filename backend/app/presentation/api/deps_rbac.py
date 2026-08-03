from typing import List, Callable
from fastapi import Depends, HTTPException, status
from app.domain.models.user import User, UserRole
from app.presentation.api.deps import get_current_user


def require_roles(allowed_roles: List[UserRole]) -> Callable:
    """
    Dependency factory enforcing Role-Based Access Control (RBAC) permissions.
    """
    def rbac_dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser or current_user.role in allowed_roles:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden. Required role: {', '.join([r.value for r in allowed_roles])}."
        )

    return rbac_dependency
