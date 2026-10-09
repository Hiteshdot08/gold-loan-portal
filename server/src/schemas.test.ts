import { describe, it, expect } from "vitest";
import { quoteRequestSchema, leadRequestSchema } from "./schemas";

const validLead = {
  name: "Ravi Kumar",
  mobileNumber: "9876543210",
  grossWeightGrams: 50,
  netWeightGrams: 45,
  karat: 22,
  planId: "PLAN_EMI_01",
};

describe("quoteRequestSchema", () => {
  it("accepts a valid request", () => {
    expect(
      quoteRequestSchema.safeParse({ netWeightGrams: 45, grossWeightGrams: 50, karat: 22 }).success
    ).toBe(true);
  });

  it("rejects net weight greater than gross, with error on netWeightGrams", () => {
    const r = quoteRequestSchema.safeParse({ netWeightGrams: 52, grossWeightGrams: 50, karat: 22 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["netWeightGrams"]);
  });

  it("rejects an invalid karat", () => {
    expect(
      quoteRequestSchema.safeParse({ netWeightGrams: 10, grossWeightGrams: 12, karat: 20 }).success
    ).toBe(false);
  });

  it("rejects weight above 1000 g or zero", () => {
    expect(
      quoteRequestSchema.safeParse({ netWeightGrams: 1001, grossWeightGrams: 1001, karat: 22 }).success
    ).toBe(false);
    expect(
      quoteRequestSchema.safeParse({ netWeightGrams: 0, grossWeightGrams: 10, karat: 22 }).success
    ).toBe(false);
  });
});

describe("leadRequestSchema", () => {
  it("accepts a valid lead", () => {
    expect(leadRequestSchema.safeParse(validLead).success).toBe(true);
  });

  it("rejects mobile numbers 5876543210 and 98765, with error on mobileNumber", () => {
    for (const mobileNumber of ["5876543210", "98765"]) {
      const r = leadRequestSchema.safeParse({ ...validLead, mobileNumber });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].path).toEqual(["mobileNumber"]);
    }
  });

  it("rejects bad names", () => {
    for (const name of ["A", "Ravi123", "R".repeat(61)]) {
      expect(leadRequestSchema.safeParse({ ...validLead, name }).success).toBe(false);
    }
  });
});
