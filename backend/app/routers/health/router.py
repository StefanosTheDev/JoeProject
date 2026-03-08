"""Health router — DB liveness. HTTP only; delegates to health service."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app import db
from app.models.health_models import HealthDbResponse
from app.services.health import check_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health/db", response_model=HealthDbResponse)
async def health_db():
    """Check that the database pool is initialised and a simple query succeeds."""
    try:
        result = await check_db(db.pool)
        return HealthDbResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("health_db failed: %s", e)
        raise HTTPException(500, "Internal server error")
