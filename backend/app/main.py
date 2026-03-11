from __future__ import annotations

import re
from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.cors import get_allowed_origins, VERCEL_ORIGIN_REGEX
from app.db import close_pool, init_pool
from app.routers import auth, chat, documents, health, ingest, meta_ads, voices, messaging, funnel, calendly, webinars, tenant, domains


@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    logger = logging.getLogger("uvicorn.error")

    try:
        await init_pool()
        logger.info("Database pool initialised successfully")
    except Exception as e:
        logger.warning(f"Database pool init failed: {e}")
    yield
    await close_pool()


app = FastAPI(title="Amplify Advisors API", lifespan=lifespan)


# Single CORS source: env (your origins only) + verified custom_domains from DB. No client domains in env.
class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        if not origin:
            return await call_next(request)
        allowed = await get_allowed_origins()
        # Allow if in list (env + DB) or matches Vercel preview (*.vercel.app)
        if origin not in allowed and not re.match(VERCEL_ORIGIN_REGEX, origin):
            return await call_next(request)
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "86400",
                },
            )
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
        try:
            response = await call_next(request)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            return response
        except Exception:
            # Route raised (e.g. 500); still send CORS so browser doesn't report CORS error
            return Response(
                status_code=500,
                content='{"detail":"Internal server error"}',
                media_type="application/json",
                headers=cors_headers,
            )


app.add_middleware(DynamicCORSMiddleware)

app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(ingest.router, prefix="/api")
app.include_router(meta_ads.router, prefix="/api")
app.include_router(voices.router, prefix="/api")
app.include_router(messaging.router, prefix="/api")
app.include_router(funnel.router, prefix="/api")
app.include_router(calendly.router, prefix="/api")
app.include_router(webinars.router, prefix="/api")
app.include_router(tenant.router, prefix="/api")
app.include_router(domains.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
