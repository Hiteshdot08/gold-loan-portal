import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "./app";

const app = createApp();

describe("GET /api/v1/loan-schemes", () => {
  it("returns the two seeded plans, LTV never above 0.75", async () => {
    const res = await request(app).get("/api/v1/loan-schemes");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    for (const p of res.body) expect(p.maxLtv).toBeLessThanOrEqual(0.75);
  });
});

describe("POST /api/v1/quotes", () => {
  const post = (body: unknown) =>
    request(app).post("/api/v1/quotes").send(body as object);

  it("case 1 and 2: 45g 22K gives 216562 (EMI) and 202125 (Bullet)", async () => {
    const res = await post({ netWeightGrams: 45, grossWeightGrams: 50, karat: 22 });
    expect(res.status).toBe(200);
    const byPlan = Object.fromEntries(res.body.quotes.map((q: any) => [q.planId, q]));
    expect(byPlan.PLAN_EMI_01.eligibleLoan).toBe(216562);
    expect(byPlan.PLAN_EMI_01.goldValue).toBe(288750);
    expect(byPlan.PLAN_EMI_01.pureGoldGrams).toBe(41.25);
    expect(byPlan.PLAN_BULLET_01.eligibleLoan).toBe(202125);
  });

  it("case 3: 10g 18K EMI gives 39375", async () => {
    const res = await post({ netWeightGrams: 10, grossWeightGrams: 12, karat: 18 });
    const emi = res.body.quotes.find((q: any) => q.planId === "PLAN_EMI_01");
    expect(emi.pureGoldGrams).toBe(7.5);
    expect(emi.goldValue).toBe(52500);
    expect(emi.eligibleLoan).toBe(39375);
  });

  it("case 4: net > gross returns 400 with a field error on netWeightGrams", async () => {
    const res = await post({ netWeightGrams: 52, grossWeightGrams: 50, karat: 22 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.fields[0].field).toBe("netWeightGrams");
  });

  it("returns 400 JSON for a malformed body", async () => {
    const res = await request(app)
      .post("/api/v1/quotes")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});

describe("unknown routes", () => {
  it("returns a JSON 404", async () => {
    const res = await request(app).get("/api/v1/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
