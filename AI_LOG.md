# AI Log

## Tools used

- **Claude**: step-by-step guidance for building the project (backend, tests, form, agent, README, CI) and for reviewing the output I pasted back from my terminal.
- **Gemini (gemini-3.7-flash, free tier)**: the model behind the Loan Assist agent, called only from the backend through function calling.

## Prompt 1: validation

> I'm building a gold loan intake API in Node + Express + TypeScript. Write Zod schemas for a quote request and a lead request. Rules: name 2-60 letters and spaces only; mobile is an Indian 10-digit number matching ^[6-9]\d{9}$; 0 < net <= gross <= 1000 g; karat must be 18, 22 or 24; planId is required. Net > gross must give a field error on netWeightGrams. Reuse the same base schema for both, and write vitest tests for each rule.

Result: `server/src/schemas.ts` and `server/src/schemas.test.ts`.

## Prompt 2: agent tools

> Build a Loan Assist agent using Gemini function calling with three tools: get_loan_schemes(), calculate_quote(net, gross, karat) and submit_application(payload). The model must never do arithmetic; every number comes from calculate_quote. Validate tool arguments with the same Zod schemas as the API and return validation errors to the model so it asks the user to fix them. submit_application must only run after the user explicitly confirms a summary. Stay on gold loans, give no investment advice, and make no promises of approval.

Result: `server/src/agent.ts`, `agentTools.ts`, `agentConfig.ts`, plus the confirm step in the chat UI.

## Where the AI got it wrong

**Mistake:** the prompt said "make no promises of approval", and the agent followed that literally. But after a successful submission it still wrote "Our representative will contact you shortly to complete the verification and final loan processing." No tool returns that. The model invented a promise about a callback and a next step, which breaks the brief's no-promises rule.

**How I spotted it:** I read the replies myself. It showed up in the command-line chat (after submitting GL-1008) and again in the web chat UI after clicking Confirm and submit (GL-1013). The submission itself and every number were correct, so none of the earlier checks would have flagged it.

**Fix:** I tightened rule 4 in the system prompt (`server/src/agentConfig.ts`). It now forbids promising approval, callbacks, contact from a representative, timelines or any next step, and tells the agent to report only the application id, status and loan amount from the tool result after submitting.

**Test that now catches it:** the happy-path conversation in `server/src/eval.ts` has a check, "reply makes no promise of a callback or next step". It fails if the final reply matches `representative|contact you|call you|shortly|reach out`. This check was added after the free-tier Gemini quota ran out. It has since been run in the happy-path conversation on gemini-3.7-flash and passes.

## Note

The prompts above are the original ones. I may change them later.
