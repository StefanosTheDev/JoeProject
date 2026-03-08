# Backend architecture (MVC-style)

The API follows a clear **Router → Service → DB** flow. Routers handle HTTP only; services hold business logic and database access; Pydantic **models** define request/response contracts.

## Layout

```
app/
├── main.py              # FastAPI app, CORS, lifespan, router registration
├── config.py            # Settings (env)
├── db.py                # Database pool (asyncpg); no business logic
├── models/              # Pydantic request/response models (API contracts)
│   ├── ingest_models.py
│   ├── meta_ads_models.py
│   └── ...
├── prompts/             # Prompt content only (no logic); e.g. chat system prompt
│   ├── chat.py
│   └── ...
├── routers/             # One subfolder per integration; each has router.py
│   ├── health/
│   │   ├── __init__.py   # exports router
│   │   └── router.py
│   ├── chat/
│   ├── documents/
│   ├── ingest/
│   ├── meta_ads/
│   ├── ghl/
│   ├── heygen/
│   └── ...
├── services/            # Business logic + DB access; subfolders mirror routers
│   ├── chat/
│   ├── documents/
│   ├── ghl/
│   ├── health/
│   ├── heygen/
│   ├── ingest/
│   ├── meta_ads/
│   └── shared/         # Used by multiple domains (e.g. blob_storage, embeddings)
└── sql/
    └── schema.sql       # Table definitions (run separately or via migrations)
```

## Conventions

1. **Routers** (`app/routers/<integration>/`)
   - One **subfolder per integration** (e.g. `meta_ads`, `ingest`, `ghl`). Makes it explicit that each integration has its own router.
   - Inside each folder: **`router.py`** holds the FastAPI `APIRouter` and route handlers; **`__init__.py`** exports `router` so `main.py` can do `from app.routers.meta_ads import router`.
   - Use **Pydantic models from `app.models`** (e.g. `app.models.meta_ads_models`, `app.models.ingest_models`) for request bodies and typed responses.
   - **Do not** run raw SQL or `db.pool.acquire()` in routers. Call **services** instead.
   - Return service results or raise `HTTPException` (e.g. 503 for DB unavailable, 404 for not found).

2. **Models** (`app/models/`)
   - **Request/response contracts** for the API. File names: **`<domain>_models.py`** (e.g. `ingest_models.py`, `meta_ads_models.py`).
   - Request bodies: e.g. `LaunchPayloadBody`, `CAPIEventBody` (used in route signatures).
   - Response shapes: e.g. `SyncResponse`, `DocumentListItem` for consistent API docs and validation.
   - Kept separate from services so API contracts are in one place and can evolve independently.

3. **Prompts** (`app/prompts/`)
   - **Content only**: system prompts, pattern strings (e.g. regex lists for RAG skip/how-to). No routing, no DB, no business logic.
   - Services import from here (e.g. `app.prompts.chat`). Keeps prompt text and patterns in one place and easy to edit.

4. **Services** (`app/services/`)
   - **Subfolders mirror routers**: `chat/`, `documents/`, `ghl/`, `health/`, `heygen/`, `ingest/`, `meta_ads/`. Each has an `__init__.py` that re-exports the public API so routers do `from app.services.<domain> import ...`.
   - **`shared/`** holds code used by more than one domain (e.g. `blob_storage`, `embeddings` used by ingest and chat/retrieval).
   - Contain business logic and all **database access** (asyncpg via `pool` passed in or `app.db.pool`).
   - Accept `pool` (or conn) as argument when called from routers so they stay testable.
   - Return domain-friendly structures or stream (e.g. chat service yields SSE). No HTTP concerns.

5. **DB layer** (`app/db.py`)
   - Exposes a single asyncpg **pool**. No table creation or query logic here.
   - Table DDL lives in `app/sql/schema.sql` (and optional migration tools). Some routers (e.g. GHL) may still run `CREATE TABLE IF NOT EXISTS` for optional integrations; prefer moving those to schema/migrations when possible.

## Request flow (example)

- **POST /api/ingest/sync**  
  Router validates query/headers → calls `sync_google_drive(pool, ...)` → returns `SyncResponse` (from `app.models.ingest_models`).

- **GET /api/ingest/documents**  
  Router checks `db.pool` → calls `list_documents(pool, status=...)` in service → returns list from service.

- **POST /api/meta/launch**  
  Router receives `LaunchPayloadBody` (from `app.models.meta_ads_models`) → calls `launch_svc.create_paused_campaign_stack(...)` → returns dict from service.

## Routes

- All API routes are mounted under **`/api`** in `main.py`.
- **Path style**: Each integration uses its name as the first path segment (e.g. `/api/chat`, `/api/connect/oauth/url`, `/api/heygen/verify`, `/api/ingest/sync`, `/api/meta/connection`). Routers do **not** set `prefix` on `APIRouter`; the full path is in each decorator (e.g. `@router.get("/heygen/verify", ...)`).
- **Registration order** in `main.py` is alphabetical by integration: chat, documents, ghl, health, heygen, ingest, meta_ads.
- Use `response_model` for JSON responses; omit for streaming or redirects.

## Naming

- **Routers**: one subfolder per integration; the folder name is the integration (`meta_ads`, `ingest`, `ghl`, `heygen`, `chat`, `documents`, `health`). The router lives in `router.py` inside that folder.
- **Models**: `<domain>_models.py` (e.g. `ingest_models.py`, `meta_ads_models.py`).
- **Services**: one subfolder per integration (same names as routers), plus `shared/`; module names within each folder match the domain (e.g. `meta_ads_oauth`, `ingest.ingest`).

This keeps the codebase organized, testable, and easy to extend without changing existing behavior.
