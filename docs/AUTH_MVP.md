# Auth MVP (Supabase)

This app now includes a sandbox auth flow:

- `/login` for email/password + Google OAuth
- `/signup` for email/password + Google OAuth
- `/auth-lab` as the only protected route (MVP)
- `GET /api/auth/whoami` to verify Supabase JWT on backend

Existing funnel/webinar routes are unchanged.

## Required env vars

### Frontend (`frontend/.env` or Vercel env)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend (`backend/.env` or Railway env)

- `SUPABASE_JWT_SECRET`
- `SUPABASE_URL` (optional in code path today, but kept for clarity)

## Supabase dashboard setup

1. Enable providers in `Authentication -> Providers`:
   - Google
   - Email
2. Set redirect URLs in `Authentication -> URL Configuration`:
   - Local: `http://localhost:5173/auth-lab`
   - Prod: `https://go.stefanosthedev.com/auth-lab`
   - Add any other deployed frontend domains used for auth.

## Notes

- The backend `whoami` endpoint validates JWTs using `SUPABASE_JWT_SECRET` and returns basic claims.
- This is an MVP sandbox. Existing backend APIs are not auth-protected yet.
