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
    # SendBlue (iMessage / SMS — Phase 1)
    sendblue_api_key_id: str = field(
        default_factory=lambda: os.environ.get("SENDBLUE_API_KEY_ID", "").strip()
    )
    sendblue_api_secret: str = field(
        default_factory=lambda: os.environ.get("SENDBLUE_API_SECRET", "").strip()
    )
    sendblue_from_number: str = field(
        default_factory=lambda: os.environ.get("SENDBLUE_FROM_NUMBER", "").strip()
    )
    # Resend (email — Phase 1)
    resend_api_key: str = field(
        default_factory=lambda: os.environ.get("RESEND_API_KEY", "").strip()
    )
    # Calendly (Phase 3)
    calendly_client_id: str = field(
        default_factory=lambda: os.environ.get("CALENDLY_CLIENT_ID", "").strip()
    )
    calendly_client_secret: str = field(
        default_factory=lambda: os.environ.get("CALENDLY_CLIENT_SECRET", "").strip()
    )
    calendly_redirect_uri: str = field(
        default_factory=lambda: os.environ.get(
            "CALENDLY_REDIRECT_URI", "http://localhost:8000/api/calendly/oauth/callback"
        ).strip()
    )
    calendly_webhook_signing_key: str = field(
        default_factory=lambda: os.environ.get("CALENDLY_WEBHOOK_SIGNING_KEY", "").strip()
    )
    # Zoom (Phase 3)
    zoom_account_id: str = field(
        default_factory=lambda: os.environ.get("ZOOM_ACCOUNT_ID", "").strip()
    )
    zoom_client_id: str = field(
        default_factory=lambda: os.environ.get("ZOOM_CLIENT_ID", "").strip()
    )
    zoom_client_secret: str = field(
        default_factory=lambda: os.environ.get("ZOOM_CLIENT_SECRET", "").strip()
    )
    # Mux (Phase 4)
    mux_access_token_id: str = field(
        default_factory=lambda: os.environ.get("MUX_ACCESS_TOKEN_ID", "").strip()
    )
    mux_secret_key: str = field(
        default_factory=lambda: os.environ.get("MUX_SECRET_KEY", "").strip()
    )
    # Optional: default firm_id for messaging webhooks when contact is unknown
    messaging_default_firm_id: str = field(
        default_factory=lambda: os.environ.get("MESSAGING_DEFAULT_FIRM_ID", "").strip()
    )
    # BYOD: base domain for platform subdomains (e.g. yourplatform.com). If set,
    # host advisor1.yourplatform.com resolves to firm_id=advisor1.
    platform_base_domain: str = field(
        default_factory=lambda: os.environ.get("PLATFORM_BASE_DOMAIN", "").strip()
    )
    # BYOD: Vercel API to add/verify custom domains programmatically.
    vercel_api_token: str = field(
        default_factory=lambda: os.environ.get("VERCEL_API_TOKEN", "").strip()
    )
    vercel_project_id: str = field(
        default_factory=lambda: os.environ.get("VERCEL_PROJECT_ID", "").strip()
    )
    vercel_team_id: str = field(
        default_factory=lambda: os.environ.get("VERCEL_TEAM_ID", "").strip()
    )
    # Supabase Auth (MVP auth lab)
    supabase_url: str = field(
        default_factory=lambda: os.environ.get("SUPABASE_URL", "").strip()
    )
    supabase_jwt_secret: str = field(
        default_factory=lambda: os.environ.get("SUPABASE_JWT_SECRET", "").strip()
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
