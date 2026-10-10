# Gold Loan Portal with an AI Agent

A gold-loan intake portal. Borrowers can apply through a guided 3-step form or chat with a Loan Assist agent. Both paths use the same backend, service layer and quote maths.

Stack: Node.js, Express, TypeScript, Zod, PostgreSQL (Prisma 6), React (Vite), Gemini (free tier) for the agent.

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
- LLM calls retry on 503/500 with backoff (src/llm.ts).

## Tests

- Unit and API tests (npm test): quote maths including the brief's cases 1 to 4, Zod schemas (cases 4 and 5), error contract, lead utilities, 404 and invalid JSON.
- Agent conversations (npm run eval in server): 5 scripted conversations: happy path, missing field, net above gross, duplicate within 7 days, off-topic.

Eval status: the free Gemini tier allows 20 requests per day per model. Conversations 1 and 2 passed in an earlier run. Conversations 3 to 5 were blocked by the daily quota (HTTP 429) and have not been verified yet.

## Bonus

None attempted.

## With more time

- Idempotency-Key on POST /leads and a database-level guard against simultaneous duplicate requests
- Do not retry daily-quota 429s in the LLM wrapper, and stream agent replies
- More automated evals: prompt injection, Hinglish, the user changing their mind
- Pagination for the leads list, Docker Compose and CI
