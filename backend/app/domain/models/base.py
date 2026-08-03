from datetime import datetime
from sqlalchemy import Column, Integer, DateTime
from app.core.database import Base


class BaseModel(Base):
    """
    Abstract base model containing common audit fields for SQLAlchemy entities.
    """
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
