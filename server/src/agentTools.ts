import { AppError, fromZod, toErrorBody } from "./errors";
import { leadRequestSchema, quoteRequestSchema } from "./schemas";
import { getLoanSchemes, getQuotes } from "./planService";
import { createLead } from "./leadService";

function toToolError(e: unknown) {
  if (e instanceof AppError) return toErrorBody(e);
  console.error("Tool error:", e instanceof Error ? e.message : e);
  return toErrorBody(new AppError(500, "INTERNAL_ERROR", "Something went wrong"));
}

// Tools the LLM may run on its own (no side effects).
export async function runReadOnlyTool(name: string, args: unknown) {
  try {
    if (name === "get_loan_schemes") return await getLoanSchemes();

    if (name === "calculate_quote") {
      const parsed = quoteRequestSchema.safeParse(args);
      if (!parsed.success) throw fromZod(parsed.error);
      const { netWeightGrams, karat } = parsed.data;
      return await getQuotes({ netWeightGrams, karat });
    }

    throw new AppError(400, "UNKNOWN_TOOL", `Unknown tool: ${name}`);
  } catch (e) {
    return toToolError(e);
  }
}

// Called by the server only after the user confirms in the UI.
export async function submitConfirmedApplication(args: unknown) {
  try {
    const parsed = leadRequestSchema.safeParse(args);
    if (!parsed.success) throw fromZod(parsed.error);
    return await createLead(parsed.data);
  } catch (e) {
    return toToolError(e);
  }
}
