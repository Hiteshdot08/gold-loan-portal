import { describe, it, expect } from "vitest";
import { calculateQuote } from "./quote";

const EMI = { maxLtv: 0.75 };
const BULLET = { maxLtv: 0.7 };

describe("calculateQuote", () => {
  it("45g 22K EMI", () => {
    expect(calculateQuote({ netWeightGrams: 45, karat: 22, plan: EMI })).toEqual({
      pureGoldGrams: 41.25,
      goldValue: 288750,
      eligibleLoan: 216562,
    });
  });

  it("45g 22K Bullet", () => {
    const r = calculateQuote({ netWeightGrams: 45, karat: 22, plan: BULLET });
    expect(r.goldValue).toBe(288750);
    expect(r.eligibleLoan).toBe(202125);
  });

  it("10g 18K EMI", () => {
    expect(calculateQuote({ netWeightGrams: 10, karat: 18, plan: EMI })).toEqual({
      pureGoldGrams: 7.5,
      goldValue: 52500,
      eligibleLoan: 39375,
    });
  });

  it("never exceeds 75% LTV even if a plan says higher", () => {
    const r = calculateQuote({ netWeightGrams: 10, karat: 24, plan: { maxLtv: 0.9 } });
    expect(r.eligibleLoan).toBe(52500);
  });
});
