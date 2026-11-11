from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # backend/.env is shared with the Express API (PORT, ADMIN_*, ...), hence extra="ignore".
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Firebase / Firestore — the application database
    firebase_project_id: str = Field(..., alias="FIREBASE_PROJECT_ID")
    firebase_api_key: str = Field(..., alias="FIREBASE_API_KEY")
    admin_emails: str = Field(default="", alias="ADMIN_EMAILS", description="Comma-separated admin emails")

    # Extra CORS origins on top of the localhost dev ones, e.g. the deployed frontend URL.
    cors_origins: str = Field(default="", alias="CORS_ORIGINS", description="Comma-separated allowed origins")

    # Groq — powers the chatbot (gracefully degraded if absent)
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY", description="Groq API Key for chatbot")
    groq_model: str = Field(default="openai/gpt-oss-120b", alias="GROQ_MODEL", description="Groq chat model id")

    # Legacy SQL stack (unmounted modules under app/db, app/api/v1/endpoints/{auth,contracts,...})
    database_url: str = Field(default="sqlite:///./unify_dev.db", alias="DATABASE_URL")
    jwt_secret: str = Field(default="unused-with-firebase-auth", alias="JWT_SECRET")
    pinecone_api_key: str = Field(default="", alias="PINECONE_API_KEY")
    pinecone_index_name: str = Field(default="", alias="PINECONE_INDEX_NAME")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Returns a cached instance of the Settings model."""
    return Settings()
