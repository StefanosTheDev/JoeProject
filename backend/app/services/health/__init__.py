"""Health service — DB liveness check."""
from app.services.health.health import check_db

__all__ = ["check_db"]
