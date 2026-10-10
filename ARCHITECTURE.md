# Architecture

## Overview

    React client (Vite)  --->  Express API  --->  PostgreSQL (Prisma)
                                   |
                                   +--->  Gemini (agent only, via src/llm.ts)

The client never talks to Gemini. All LLM calls go through the backend, so no API key reaches the browser.

## Backend layers (server/src)

- app.ts: Express app, routes for loan-schemes and quotes, JSON 404 and the central error handler.
- schemas.ts: Zod schemas, shared by the API routes and the agent tools.
- quote.ts: pure BigInt maths (milligrams and paise). Loan is floored to whole rupees, LTV is capped at 75%.
- leadService.ts: createLead and listLeads. Recomputes the quote server-side, rejects the same mobile within 7 days (409), masks mobiles in listings.
- leadRoutes.ts: POST and GET /api/v1/leads, with a rate limit of 10 submissions per minute per IP on POST.
- errors.ts: AppError and one error shape for everything: { error: { code, message, fields[] } }.

## Agent (server/src)

- agent.ts: the tool-calling loop. Calls Gemini, runs tools, feeds results back.
- agentTools.ts: get_loan_schemes, calculate_quote, submit_application. Arguments are validated with the same Zod schemas as the API.
- agentConfig.ts: system prompt (gold loans only, no advice, no promises).
- llm.ts: Gemini client with retry on 500, 503 and 429.
- chatRoutes.ts: POST /api/v1/chat and /api/v1/chat/confirm.

## Same truth, two paths

The web form and the agent both end in createLead. A lead filed by the agent is identical to one filed through the form, with the same validation, quote recomputation and duplicate check.

## Confirmation flow

1. The model calls submit_application.
2. The server does not run it. It returns pendingApplication to the client with the history.
3. The UI shows a summary card.
4. Only when the user clicks Confirm does /chat/confirm run createLead, then the model writes the final reply.

## Data

- Money is stored as integers: weights in milligrams, gold value in paise, loan in whole rupees.
- Loan plans are seeded from prisma/seed.ts. Interest and LTV are stored in basis points.

## CI

GitHub Actions (.github/workflows/ci.yml) runs the server type-check and tests against a Postgres service, and builds the client.
