# Amplify Advisors App Hub

Monorepo with a **FastAPI** backend and **React + Vite** frontend.

## Project Structure

```
JoeProject/
├── backend/          # Python FastAPI
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, lifespan
│   │   ├── config.py         # Settings (env vars)
│   │   ├── db.py             # asyncpg pool + pgvector
│   │   ├── routers/
│   │   │   ├── health.py     # GET /api/health/db
│   │   │   └── chat.py       # POST /api/chat (Claude streaming)
│   │   └── sql/
│   │       └── schema.sql    # PostgreSQL DDL
│   ├── requirements.txt
│   └── .env
├── frontend/         # Vite + React + TypeScript
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx           # React Router setup
│   │   ├── index.css         # Tailwind v4 + design tokens
│   │   ├── components/       # ThemeProvider
│   │   └── pages/
│   │       ├── AppHub.tsx
│   │       ├── amplify-os/   # Amplify OS wizard pages
│   │       └── amplify-chat/ # Amplify Chat (ChatGPT-like UI)
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` requests to `http://localhost:8000`.

### Database

**Local**: `psql -d amplified_os -f backend/app/sql/schema.sql`

**Production (Supabase)**: See [Deploying to Vercel + Supabase](docs/DEPLOY_VERCEL_SUPABASE.md) for pgvector and env setup.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase direct: port 5432) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `CORS_ORIGINS` | Comma-separated allowed origins (include Vercel URL in prod) |

### Frontend (production on Vercel)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `https://your-api.railway.app`) so chat calls the deployed API |

## Tech Stack

- **Backend**: FastAPI, asyncpg, pgvector, Anthropic Python SDK
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7
- **Chat**: Vercel AI SDK (`@ai-sdk/react`) with UI Message Stream Protocol
- **Database**: PostgreSQL with pgvector extension
