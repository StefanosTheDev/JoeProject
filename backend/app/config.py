from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

BACKEND_DIR = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    database_url: str = field(
        default_factory=lambda: os.environ.get(
            "DATABASE_URL",
            "postgresql://user:password@localhost:5432/amplified_os",
        )
    )
    anthropic_api_key: str = field(
        default_factory=lambda: os.environ.get("ANTHROPIC_API_KEY", "")
    )
    cors_origins: list[str] = field(
        default_factory=lambda: os.environ.get(
            "CORS_ORIGINS", "http://localhost:5173"
        ).split(",")
    )
    google_service_account_file: str = field(
        default_factory=lambda: os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE", "")
    )
    google_service_account_json: str = field(
        default_factory=lambda: os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    )
    voyage_api_key: str = field(
        default_factory=lambda: os.environ.get("VOYAGE_API_KEY", "")
    )
    google_drive_folder_id: str = field(
        default_factory=lambda: os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "")
    )
    blob_read_write_token: str = field(
        default_factory=lambda: os.environ.get("BLOB_READ_WRITE_TOKEN", "")
    )
    # Sync: 0 = no limit; e.g. 30 = cap docs per run to control embedding cost
    max_docs_per_sync: int = field(
        default_factory=lambda: int(os.environ.get("MAX_DOCS_PER_SYNC", "0") or "0")
    )
    # If set, POST /api/ingest/sync must send this in X-Cron-Secret (for scheduled runs)
    cron_secret: str = field(
        default_factory=lambda: os.environ.get("CRON_SECRET", "").strip()
    )
    # DB pool (Supabase direct connections; keep modest for free tier)
    db_pool_min_size: int = field(
        default_factory=lambda: int(os.environ.get("DB_POOL_MIN_SIZE", "1"))
    )
    db_pool_max_size: int = field(
        default_factory=lambda: int(os.environ.get("DB_POOL_MAX_SIZE", "10"))
    )
    # Meta (Facebook) Marketing API — OAuth and Insights
    meta_app_id: str = field(
        default_factory=lambda: os.environ.get("META_APP_ID", "").strip()
    )
    meta_app_secret: str = field(
        default_factory=lambda: os.environ.get("META_APP_SECRET", "").strip()
    )
    meta_redirect_uri: str = field(
        default_factory=lambda: os.environ.get("META_REDIRECT_URI", "").strip()
    )
    meta_api_version: str = field(
        default_factory=lambda: os.environ.get("META_API_VERSION", "v21.0").strip()
    )
    # Optional: if set, Meta insights sync endpoint may require this header (cron)
    meta_cron_secret: str = field(
        default_factory=lambda: os.environ.get("META_CRON_SECRET", "").strip()
    )
    # ElevenLabs API (voice cloning, TTS) — header xi-api-key
    elevenlabs_api_key: str = field(
        default_factory=lambda: os.environ.get("ELEVENLABS_API_KEY", "").strip()
    )

    @property
    def google_service_account_path(self) -> Path:
        return BACKEND_DIR / self.google_service_account_file

    @property
    def frontend_origin(self) -> str:
        """Base URL for OAuth redirects (first CORS origin or localhost)."""
        if self.cors_origins:
            return self.cors_origins[0].strip()
        return "http://localhost:5173"


settings = Settings()
