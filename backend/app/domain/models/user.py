from sqlalchemy import Column, String, Boolean, Enum
import enum
from app.domain.models.base import BaseModel


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ENGINEER = "engineer"
    VIEWER = "viewer"


class User(BaseModel):
    """
    User entity representing platform users and access controls.
    """
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.ENGINEER, nullable=False)
