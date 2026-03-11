"""Tenant service — resolve request base URL for BYOD (links stay on client domain)."""
from __future__ import annotations

from urllib.parse import urlparse

from fastapi import Request

from app import db
from app.config import settings


async def get_request_base_url(request: Request) -> str:
    """
    Return the base URL (origin) for the current request when the host is an allowed
    custom domain or platform subdomain; otherwise return settings.frontend_origin.
    Use this for webinar_join_url and any other links so they stay on the client's domain.
    """
    host, scheme = _host_and_scheme_from_request(request)
    if not host:
        return settings.frontend_origin
    if not db.pool:
        return settings.frontend_origin
    async with db.pool.acquire() as conn:
        if not await _is_allowed_host(conn, host):
            return settings.frontend_origin
    return f"{scheme}://{host}"


def _host_and_scheme_from_request(request: Request) -> tuple[str | None, str]:
    """Extract hostname and scheme from Origin or X-Forwarded-* headers."""
    origin = request.headers.get("origin") or request.headers.get("Origin")
    if origin:
        origin = origin.strip()
        if origin and origin.lower().startswith(("http://", "https://")):
            try:
                parsed = urlparse(origin)
                host = (parsed.hostname or "").strip().lower()
                if host:
                    scheme = parsed.scheme or "https"
                    return host, scheme
            except Exception:
                pass
    forwarded_host = request.headers.get("x-forwarded-host") or request.headers.get("X-Forwarded-Host")
    forwarded_proto = request.headers.get("x-forwarded-proto") or request.headers.get("X-Forwarded-Proto")
    if forwarded_host:
        host = forwarded_host.split(",")[0].strip().lower()
        if host:
            scheme = (forwarded_proto or "https").strip().lower() if forwarded_proto else "https"
            if scheme not in ("http", "https"):
                scheme = "https"
            return host, scheme
    return None, "https"


async def _is_allowed_host(conn, host: str) -> bool:
    """True if host is a verified custom domain or a platform subdomain."""
    if not host:
        return False
    row = await conn.fetchrow(
        "SELECT 1 FROM custom_domains WHERE hostname = $1 AND status = 'verified' LIMIT 1",
        host,
    )
    if row:
        return True
    base = settings.platform_base_domain
    if base and host.endswith("." + base) and host != base:
        slug = host[: -len(base) - 1].strip().lower()
        if slug and "." not in slug:
            row = await conn.fetchrow("SELECT 1 FROM firm WHERE id = $1 LIMIT 1", slug)
            if row:
                return True
    return False
