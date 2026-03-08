from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import close_pool, init_pool
from app.routers import chat, documents, health, ingest, meta_ads, ghl, heygen


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

allow_origin_regex = None
if any("vercel.app" in o for o in settings.cors_origins):
    allow_origin_regex = r"https://.*\.vercel\.app"

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
app.include_router(ghl.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(heygen.router, prefix="/api")
app.include_router(ingest.router, prefix="/api")
app.include_router(meta_ads.router, prefix="/api")
