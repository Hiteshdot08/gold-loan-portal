import { describe, it, expect } from "vitest";
import { quoteRequestSchema } from "./schemas";
import { AppError, fromZod, toErrorBody } from "./errors";

describe("errors", () => {
  it("turns a Zod failure into a 400 with the field path", () => {
    const r = quoteRequestSchema.safeParse({ netWeightGrams: 52, grossWeightGrams: 50, karat: 22 });
    if (r.success) throw new Error("expected failure");
    const err = fromZod(r.error);
    expect(err.status).toBe(400);
    expect(err.fields[0].field).toBe("netWeightGrams");
  });

  it("builds a 409 body that carries the existing applicationId", () => {
    const err = new AppError(409, "DUPLICATE_LEAD", "Already applied", [], { applicationId: "GL-1042" });
    expect(toErrorBody(err)).toEqual({
      error: { code: "DUPLICATE_LEAD", message: "Already applied", fields: [], applicationId: "GL-1042" },
    });
  });
});
