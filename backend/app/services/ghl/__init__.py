"""GHL service — OAuth and connection management."""
from app.services.ghl import ghl_oauth
from app.services.ghl.ghl import (
    disconnect,
    ensure_ghl_table,
    get_connection_status,
    upsert_connection,
)

__all__ = [
    "ghl_oauth",
    "disconnect",
    "ensure_ghl_table",
    "get_connection_status",
    "upsert_connection",
]
