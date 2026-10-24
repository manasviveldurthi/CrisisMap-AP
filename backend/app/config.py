import os
from pathlib import Path
from typing import List
from urllib.parse import quote_plus
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for backend (where .env is expected)
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    SERVER_HOST: str = "127.0.0.1"
    SERVER_PORT: int = 8000
    ENVIRONMENT: str = "development"

    # Database Configuration
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = Field(default="", description="MySQL Username")
    DB_PASSWORD: str = Field(default="", description="MySQL Password")
    DB_NAME: str = Field(default="crisismap_db", description="MySQL Database Name")

    # Allowed CORS Origins (comma-separated string in .env)
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # API Metadata
    API_TITLE: str = "CrisisMap AP Backend API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = (
        "Backend REST API for CrisisMap AP: Real-Time Disaster Awareness and Response."
    )

    # Security & Authentication
    JWT_SECRET: str = Field(
        default="crisismap-ap-insecure-dev-secret-key-change-in-production",
        description="JWT HMAC Secret Key"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    model_config = SettingsConfigDict(
        env_file=(BASE_DIR / ".env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list of strings, with default dev hosts."""
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:5176",
            "http://127.0.0.1:5176",
            "http://localhost:5177",
            "http://127.0.0.1:5177",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000"
        ]
        for d in defaults:
            if d not in origins:
                origins.append(d)
        return origins

    @property
    def is_db_configured(self) -> bool:
        """
        Verify whether database connection parameters are present and not placeholders.
        """
        if not self.DB_USER or self.DB_USER.lower() in ("your_mysql_username", "placeholder"):
            return False
        if not self.DB_NAME:
            return False
        return True

    @property
    def database_url(self) -> str:
        """
        Builds the PyMySQL connection string.
        Safely URL-encodes the password to support symbols (@, #, :, etc.).
        """
        escaped_password = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""
        return (
            f"mysql+pymysql://{self.DB_USER}:{escaped_password}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )


settings = Settings()
