"""Auth router (MVP): verify Supabase JWT and return basic claims."""
from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
import jwt
from jwt import InvalidTokenError

from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/whoami")
async def whoami(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(401, "Missing bearer token")

    if not settings.supabase_jwt_secret:
        raise HTTPException(503, "SUPABASE_JWT_SECRET is not configured")

    try:
        claims = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except InvalidTokenError as e:
        raise HTTPException(401, f"Invalid token: {e}")

    return {
        "sub": claims.get("sub"),
        "email": claims.get("email"),
        "role": claims.get("role"),
        "aud": claims.get("aud"),
        "exp": claims.get("exp"),
        "iat": claims.get("iat"),
    }

