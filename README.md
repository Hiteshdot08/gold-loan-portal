# Gold Loan Portal with an AI Agent

A gold-loan intake portal. Borrowers can apply through a guided 3-step form or chat with a Loan Assist agent. Both paths use the same backend, service layer and quote maths.

Stack: Node.js, Express, TypeScript, Zod, PostgreSQL (Prisma 6), React (Vite), Gemini or Groq (free tiers) for the agent, chosen with the LLM_PROVIDER variable.

## Live demo

- App: https://gold-loan-portal-drab.vercel.app/
- API: https://gold-loan-portal.onrender.com/api/v1/loan-schemes

The app opens on a landing page. Click **Check my offer** (or **Open portal**) to reach the application form, Loan Assist and the admin table.

The API runs on Render's free tier and the database on Neon's free tier, so the first request after a period of inactivity can take 30 to 60 seconds. If the page looks stuck on first load, wait a minute and refresh.

## Setup

Requires Node 20+ and Docker.

1. Start Postgres (port 5433):

        docker run -d --name goldloan-db -e POSTGRES_USER=goldloan -e POSTGRES_PASSWORD=goldloan -e POSTGRES_DB=goldloan -p 5433:5432 postgres:16

2. Server:

        cd server
        cp .env.example .env     # then put your Gemini or Groq API key in .env
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
- LLM_PROVIDER: gemini (default) or groq
- GROQ_API_KEY: key for Groq, used when LLM_PROVIDER=groq (never committed)
- GROQ_MODEL: defaults to llama-3.3-70b-versatile in code, but I use openai/gpt-oss-120b (the first one was not available on my Groq account)
- PORT: defaults to 4000

## Deployment

- Database: Neon (PostgreSQL). Migration and seed were run against it with `DATABASE_URL` set to the Neon connection string.
- Server: Render Web Service, root directory `server`, build command `npm install --include=dev && npx prisma generate`, start command `npx tsx src/server.ts`. Environment variables set on Render: `DATABASE_URL`, `NODE_ENV=production`, and the LLM settings (`LLM_PROVIDER`, plus `GEMINI_API_KEY` and `GEMINI_MODEL`, or `GROQ_API_KEY` and `GROQ_MODEL`). Values are entered without quotes.
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
- LLM calls (src/llm.ts) have a 60-second timeout and retry on 500/503/504/429 with backoff. On a 429 they wait for the delay Gemini suggests, and give up straight away if that delay is over 60 seconds (a daily quota), so a request never hangs for hours.
- The model provider is swappable. src/llm.ts converts the app's message history to the OpenAI-style format for Groq and back, so agent.ts, the tools, the routes and the UI do not change. Switching is one environment variable (LLM_PROVIDER). Models used: gemini-3.7-flash (Gemini) and openai/gpt-oss-120b (Groq). Groq is called with plain fetch, so no extra package is needed.

## Tests

- Unit and API tests (npm test, 30 tests in 6 files): quote maths including the brief's cases 1 to 4, Zod schemas (cases 4 and 5), error contract, lead utilities, 404 and invalid JSON, and the leads endpoint (201 on success with server-side recomputation, 409 for a duplicate mobile).
- Agent conversations (npm run eval in server): 5 scripted conversations: happy path, missing field, net above gross, duplicate within 7 days, off-topic.

Eval status:

- Groq, openai/gpt-oss-120b (1 Nov 2026): conversations 1 (happy path), 2 (missing field), 3 (net above gross) and 5 (off-topic) passed. In conversation 4 (duplicate) the agent answered correctly and named the existing application, but the check failed because the model wrote the id with a non-breaking hyphen (GL-1029 with a different dash character). The check now normalises Unicode hyphens before matching.
- The same run showed the model saying "We'll process your request and update you on the next steps" after submitting, which the original no-promise check did not catch. I widened that check and tightened rule 4 in the system prompt (see AI_LOG).
- Gemini (10 Oct 2026): conversations 1, 2, 4 and 5 passed on gemini-3.7-flash, and conversation 3 passed on gemini-3.8-flash.
- Run one conversation alone by function name: npm run eval -- netAboveGross (names: happyPath, missingField, netAboveGross, duplicate, offTopic).
- Free tiers are rate limited per model and sometimes return 503 when a model is busy, so a full run can need retries.

## Bonus

B4 (Ops Ready), partly done:

- Rate limit on POST /leads: 10 per minute per IP, returns 429 in the standard error shape
- GitHub Actions CI (.github/workflows/ci.yml): server type-check and tests against a Postgres service, plus the client build
- ARCHITECTURE.md
- Deployed live: Neon (database), Render (API), Vercel (client)

Not done: docker compose up and the demo video.

## Known limitations

- Loan Assist runs on a free LLM tier (Gemini, or Groq). Gemini allows about 20 requests per model per day; Groq limits requests per minute. When a limit is hit, or the model is busy, the chat can show "Something went wrong" until the limit clears. The form, quotes, leads and admin table do not depend on the LLM and keep working.
- The API runs on Render's free tier, so the first request after a period of inactivity can take 30 to 60 seconds.

## With more time

- Idempotency-Key on POST /leads and a database-level guard against simultaneous duplicate requests
- Stream agent replies, and pause between eval conversations to stay under the per-minute limit
- More automated evals: prompt injection, Hinglish, the user changing their mind
- Pagination for the leads list and Docker Compose
