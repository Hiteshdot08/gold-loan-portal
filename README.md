# Gold Loan Portal with an AI Agent

A gold-loan intake portal. Borrowers can apply through a guided 3-step form or chat with a Loan Assist agent. Both paths use the same backend, service layer and quote maths.

Stack: Node.js, Express, TypeScript, Zod, PostgreSQL (Prisma 6), React (Vite), Gemini (free tier) for the agent.

## Live demo

- App: https://gold-loan-portal-drab.vercel.app/
- API: https://gold-loan-portal.onrender.com/api/v1/loan-schemes

The API runs on Render's free tier and the database on Neon's free tier, so the first request after a period of inactivity can take 30 to 60 seconds. If the page looks stuck on first load, wait a minute and refresh.

## Setup

Requires Node 20+ and Docker.

1. Start Postgres (port 5433):

        docker run -d --name goldloan-db -e POSTGRES_USER=goldloan -e POSTGRES_PASSWORD=goldloan -e POSTGRES_DB=goldloan -p 5433:5432 postgres:16

2. Server:

        cd server
        cp .env.example .env     # then put your Gemini API key in .env
        npm install
        npm run db:migrate
        npm run seed
        npm run dev              # http://localhost:4000

3. Client (second terminal):

        cd client
        npm install
        npm run dev              # http://localhost:5173

4. Tests (Postgres must be running and seeded, the API tests use the database):

        cd server
        npm test

## Environment variables (server/.env)

- DATABASE_URL: Postgres connection string
- GEMINI_API_KEY: key for the agent (never committed, all LLM calls go through the backend)
- GEMINI_MODEL: defaults to gemini-3.7-flash
- PORT: defaults to 4000

## Deployment

- Database: Neon (PostgreSQL). Migration and seed were run against it with `DATABASE_URL` set to the Neon connection string.
- Server: Render Web Service, root directory `server`, build command `npm install --include=dev && npx prisma generate`, start command `npx tsx src/server.ts`. Environment variables set on Render: `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `NODE_ENV=production`.
- Client: Vercel, root directory `client`, Vite preset. `client/vercel.json` rewrites `/api/*` to the Render service, so the browser only talks to Vercel and no CORS setup is needed.

## API

- GET /api/v1/loan-schemes: active plans from the DB
- POST /api/v1/quotes: pure calculation, no DB write
- POST /api/v1/leads: validates, recomputes the quote server-side, rejects the same mobile within 7 days (409 with the existing applicationId), stores the lead and returns 201
- GET /api/v1/leads: newest first, mobile numbers masked (9876XXXX10), optional ?planId= filter
- POST /api/v1/chat and POST /api/v1/chat/confirm: the agent

All errors use one shape: { error: { code, message, fields[] } }, including 404 and 500, with no stack traces.

## Design decisions

- Money is exact: quote maths uses BigInt (milligrams, paise), the loan is floored to whole rupees, and LTV is capped at 75% in code even if a plan says more. Amounts are stored as integers.
- The server never trusts client numbers. Leads are recomputed from weight, karat and plan.
- The form and the agent both call the same createLead service.
- Agent: three tools (get_loan_schemes, calculate_quote, submit_application). The model never does arithmetic, tool arguments are validated with the same Zod schemas as the API, and submit_application only runs after the user clicks Confirm on a summary card in the UI. The system prompt keeps it on gold loans, with no investment advice and no promises of approval, callbacks or next steps.
- LLM calls retry on 503/500/429 (src/llm.ts). On a 429 it waits for the delay Gemini suggests, and gives up straight away if that delay is over 60 seconds (a daily quota), so a request never hangs for hours.

## Tests

- Unit and API tests (npm test, 30 tests in 6 files): quote maths including the brief's cases 1 to 4, Zod schemas (cases 4 and 5), error contract, lead utilities, 404 and invalid JSON, and the leads endpoint (201 on success with server-side recomputation, 409 for a duplicate mobile).
- Agent conversations (npm run eval in server): 5 scripted conversations: happy path, missing field, net above gross, duplicate within 7 days, off-topic.

Eval status (10 Oct 2026, Gemini free tier). All 5 conversations pass:

- Conversations 1 (happy path), 2 (missing field), 4 (duplicate within 7 days) and 5 (off-topic) passed on gemini-3.7-flash. Conversation 1 includes the check that the reply makes no promise of a callback or next step.
- Conversation 3 (net weight above gross) passed on gemini-3.8-flash. It was run separately because gemini-3.7-flash had hit its free-tier quota, so it was not re-run on 3.7.
- Run one conversation alone by function name: npm run eval -- netAboveGross (names: happyPath, missingField, netAboveGross, duplicate, offTopic).
- The free tier is rate limited per model and sometimes returns 503 when a model is busy, so a full run can need retries or a second model.

## Bonus

B4 (Ops Ready), partly done:

- Rate limit on POST /leads: 10 per minute per IP, returns 429 in the standard error shape
- GitHub Actions CI (.github/workflows/ci.yml): server type-check and tests against a Postgres service, plus the client build
- ARCHITECTURE.md
- Deployed live: Neon (database), Render (API), Vercel (client)

Not done: docker compose up and the demo video.

## With more time

- Idempotency-Key on POST /leads and a database-level guard against simultaneous duplicate requests
- Stream agent replies, and pause between eval conversations to stay under the per-minute limit
- More automated evals: prompt injection, Hinglish, the user changing their mind
- Pagination for the leads list and Docker Compose
