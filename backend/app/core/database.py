from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

db_url = settings.DATABASE_URL or "sqlite:///./drift_detector.db"

# Fallback to SQLite if PostgreSQL/psycopg is blocked by Windows App Control or unavailable locally
try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=10 if "sqlite" not in db_url else 5,
        max_overflow=20 if "sqlite" not in db_url else 10,
        connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
    )
except Exception as e:
    logger.warning(f"PostgreSQL connection failed ({str(e)}). Falling back to SQLite database engine.")
    db_url = "sqlite:///./drift_detector.db"
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to provide SQLAlchemy database session per request.
    Ensures session is closed cleanly upon request completion.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {str(e)}")
        raise
    finally:
        db.close()
