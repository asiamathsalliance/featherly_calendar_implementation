# Featherly — Calendar & matching (MVP)

Next.js app with Google sign-in, PostgreSQL, FullCalendar job listings, screening quizzes (template by default; optional Ollama), and provider application review.

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker — see `docker-compose.yml`)
- Optional: [Ollama](https://ollama.com/) only if you set `OLLAMA_ENABLED=true` in `.env`; otherwise quizzes use built-in template questions (no LLM).

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — PostgreSQL connection string
   - `AUTH_SECRET` — run `openssl rand -base64 32`
   - `AUTH_URL` — e.g. `http://localhost:3000`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — [Google OAuth credentials](https://console.cloud.google.com/apis/credentials) with authorized redirect URI `http://localhost:3000/api/auth/callback/google` (use the same host/port you run `npm run dev` on, e.g. `3001` if Next chose another port)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — set to the **same value** as `GOOGLE_CLIENT_ID`. Middleware runs on Edge, which often cannot read non-`NEXT_PUBLIC_` env vars; without this, Google may show “Missing required parameter: client_id”.
   - Optional: `PROVIDER_EMAILS` — comma-separated emails that should get the `PROVIDER` role on sign-in (otherwise users default to support workers)
   - Optional: `OLLAMA_ENABLED=true`, plus `OLLAMA_HOST`, `OLLAMA_MODEL` to generate quizzes via local Ollama (default is off; template questions only)

3. **Database**

   ```bash
   docker compose up -d   # if using bundled Postgres
   npm run db:push
   ```

4. **Seed demo jobs (optional)**

   Sign in once with a Google account whose email is listed in `PROVIDER_EMAILS`, then:

   ```bash
   npm run db:seed
   ```

   This creates sample job listings for the first provider user in the database.

5. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Roles & flows

- **Support worker (default):** Sign in with Google → onboarding (bio / fun fact) → **Calendar** → open a job → **Apply** (quiz) → track status on **Worker dashboard**.
- **Provider:** Add your email to `PROVIDER_EMAILS`, sign in → **Provider dashboard** → post jobs → **View applicants** → accept / reject / request interview.

## API (MVP)

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/jobs` | List (filters: `from`, `to`, `tags`) / create (provider) |
| GET | `/api/jobs/[id]` | Job detail |
| GET/POST | `/api/applications` | Worker: list mine / create draft |
| GET/PATCH | `/api/applications/[id]` | Get application / submit quiz answers (`PENDING`) |
| PATCH | `/api/applications/[id]/decision` | Provider decision |
| POST | `/api/quiz/generate` | Generate/store quiz for an application |
| PATCH | `/api/user/profile` | Profile + complete onboarding |

Auth routes are handled by Auth.js at `/api/auth/*`.

## Scripts

- `npm run db:generate` — Prisma client
- `npm run db:push` — sync schema to DB
- `npm run db:seed` — seed demo jobs (requires a provider user)

## Tech notes

- Prisma ORM with PostgreSQL; Prisma 7 uses the `@prisma/adapter-pg` driver.
- Auth.js (NextAuth v5) with the Prisma adapter and Google provider.
- FullCalendar for the worker job calendar.
- Quiz generation calls Ollama’s HTTP API (`/api/generate`); JSON is validated with Zod; failures use static fallback questions.
