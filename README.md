# Amplified Advisors — Growth OS

Step-locked web app for financial advisors: firm setup → AI ICP discovery → offer selection → iterative AI asset generation (ads, funnel copy, sequences, call prep) → compliance → deployment package.

**Tech stack:** Next.js, Vercel, PostgreSQL, Prisma, OpenAI (server-side for all AI generation). No auth for speed MVP.

## Database (PostgreSQL + Prisma)

1. **PostgreSQL** — Use a local instance or a hosted provider (e.g. [Neon](https://neon.tech), [Vercel Postgres](https://vercel.com/storage/postgres), [Railway](https://railway.app), or local Docker).
2. **Connection string** — Format: `postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME`
3. **Env:** Copy `.env.example` to `.env.local` and set:
   - `DATABASE_URL` = your PostgreSQL connection string.
4. **Apply schema:** From the project root run:
   - `npm run db:generate` — generate Prisma client
   - `npm run db:push` — push schema to the DB (no migrations yet), or `npm run db:migrate` for migrations.
5. **Test the DB:** Run `npm run test:db` (checks connection using `.env.local`). Or start the dev server and open [http://localhost:3000/api/health/db](http://localhost:3000/api/health/db) — you should see `{"ok":true,"database":"connected"}`.

(`.env.local` is gitignored; never commit real credentials.)

## OpenAI (AI generation)

Used for: website analysis, ICP generation, ad/funnel/sequence/call-prep asset generation. All calls run **server-side** (API routes or Server Components) so the key never hits the client.

1. **Get a key:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys) → Create new secret key.
2. **Add to `.env.local`:**
   - `OPENAI_API_KEY` = `sk-...` (no `NEXT_PUBLIC_` — keep it server-only).

**Docs:**

- **[Build plan & milestones](docs/BUILD_PLAN.md)** — What we're building and in what order (single execution view).
- **[Design (UI)](docs/DESIGN.md)** — Monochromatic, Apple-inspired, simplistic style; palette, typography, components.
- [Feature Specification](Amplified_OS_Feature_Specification.docx.md) — Product features and acceptance criteria.
- [MVP Build Specification](Amplified_OS_MVP_Build_Specification.docx.md) — Phases, data model, tech stack, prompt architecture.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
