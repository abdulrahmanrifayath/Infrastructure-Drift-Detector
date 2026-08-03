import logging
import sys
from typing import Any, List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings configuration using Pydantic BaseSettings.
    Automatically reads environment variables and defaults.
    """
    PROJECT_NAME: str = "Infrastructure Drift Detector"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = "dev-secret-key-infrastructure-drift-detector-jwt-auth"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    BACKEND_CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "drift_detector_db"
    DATABASE_URL: Union[str, None] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Union[str, None], values: Any) -> Any:
        if isinstance(v, str) and v.strip():
            return v
        # Build default from components if not provided
        server = values.data.get("POSTGRES_SERVER", "localhost")
        port = values.data.get("POSTGRES_PORT", 5432)
        user = values.data.get("POSTGRES_USER", "postgres")
        password = values.data.get("POSTGRES_PASSWORD", "postgres")
        db = values.data.get("POSTGRES_DB", "drift_detector_db")
        return f"postgresql://{user}:{password}@{server}:{port}/{db}"

    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Union[str, None] = None
    AWS_SECRET_ACCESS_KEY: Union[str, None] = None

    AI_ENGINE_PROVIDER: str = "rule_engine"
    OPENAI_API_KEY: Union[str, None] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
