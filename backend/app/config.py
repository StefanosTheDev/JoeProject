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

    @property
    def google_service_account_path(self) -> Path:
        return BACKEND_DIR / self.google_service_account_file


settings = Settings()
