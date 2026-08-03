from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.common import APIResponse
from app.schemas.auth import Token, LoginRequest
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import auth_service
from app.presentation.api.deps import get_current_user
from app.domain.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new platform user.
    """
    user = auth_service.register_user(db=db, user_in=user_in)
    return APIResponse(
        success=True,
        message="User account registered successfully.",
        data=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=APIResponse[Token])
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates user and issues JWT bearer token.
    """
    token = auth_service.authenticate_user(db=db, login_data=login_data)
    return APIResponse(
        success=True,
        message="Login successful.",
        data=token
    )


@router.get("/me", response_model=APIResponse[UserResponse])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns authenticated user's profile information.
    """
    return APIResponse(
        success=True,
        message="User profile retrieved.",
        data=UserResponse.model_validate(current_user)
    )
