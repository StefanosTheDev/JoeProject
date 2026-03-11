from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings
from app.cors import get_allowed_origins
from app.db import close_pool, init_pool
from app.routers import chat, documents, health, ingest, meta_ads, voices, messaging, funnel, calendly, webinars, tenant, domains


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

# Dynamic CORS: allow origins from CORS_ORIGINS env + verified custom_domains (BYOD). Runs first.
class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        if origin:
            allowed = await get_allowed_origins()
            if origin in allowed:
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
                response = await call_next(request)
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                return response
        return await call_next(request)


allow_origin_regex = None
if any("vercel.app" in o for o in settings.cors_origins):
    allow_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(DynamicCORSMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
