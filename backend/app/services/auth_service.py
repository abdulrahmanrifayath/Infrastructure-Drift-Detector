from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate
from app.schemas.auth import LoginRequest, Token
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.logging import logger


class AuthService:
    """
    Application Service handling authentication logic, token generation, and user validation.
    """

    def register_user(self, db: Session, user_in: UserCreate):
        existing_user = user_repository.get_by_email(db, email=user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        user_data = user_in.model_dump()
        raw_password = user_data.pop("password")
        user_data["hashed_password"] = get_password_hash(raw_password)

        created_user = user_repository.create(db, obj_in=user_data)
        logger.info(f"Successfully registered new user: {created_user.email}")
        return created_user

    def authenticate_user(self, db: Session, login_data: LoginRequest) -> Token:
        user = user_repository.get_by_email(db, email=login_data.email)
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated."
            )

        access_token = create_access_token(subject=user.email)
        logger.info(f"User authenticated successfully: {user.email}")
        return Token(access_token=access_token, token_type="bearer", user=user)


auth_service = AuthService()
