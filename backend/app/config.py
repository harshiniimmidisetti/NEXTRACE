"""Application settings, read once from environment variables (see `.env.example`)."""

import os
from dataclasses import dataclass

try:  # optional: lets `uvicorn app.main:app` pick up backend/.env
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

MIN_SECRET_LENGTH = 32


@dataclass(frozen=True)
class Settings:
    """Immutable runtime configuration."""

    database_url: str
    jwt_secret: str
    cors_origins: tuple[str, ...]
    upload_dir: str
    app_mode: str
    anthropic_api_key: str
    nexa_model: str
    nexa_max_tokens: int
    nexa_daily_limit: int

    @classmethod
    def from_env(cls) -> "Settings":
        origins = os.getenv("CORS_ORIGINS", "http://localhost:8080")
        return cls(
            database_url=os.getenv("DATABASE_URL", "sqlite:///./nextrace.db"),
            jwt_secret=os.getenv("JWT_SECRET", ""),  # required: no default on purpose
            cors_origins=tuple(o.strip() for o in origins.split(",") if o.strip()),
            upload_dir=os.getenv("UPLOAD_DIR", "./evidence_store"),
            app_mode=os.getenv("APP_MODE", "demo"),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
            nexa_model=os.getenv("NEXA_MODEL", "claude-sonnet-5-5"),
            nexa_max_tokens=int(os.getenv("NEXA_MAX_TOKENS", "800")),
            nexa_daily_limit=int(os.getenv("NEXA_DAILY_LIMIT", "50")),
        )

    def validate(self) -> None:
        """Fail fast at start-up when a required secret is missing or weak."""
        if len(self.jwt_secret) < MIN_SECRET_LENGTH:
            raise RuntimeError(
                f"Set JWT_SECRET to a random string of {MIN_SECRET_LENGTH}+ characters "
                "(see .env.example)."
            )


settings = Settings.from_env()
