import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "./app";
import { prisma } from "./db";

const app = createApp();
const MOBILES = ["9000000001", "9000000002", "9000000003", "9000000004", "9000000005"];

const body = (over: Record<string, unknown> = {}) => ({
  name: "Test Borrower",
  mobileNumber: "9000000001",
  grossWeightGrams: 50,
  netWeightGrams: 45,
  karat: 22,
  planId: "PLAN_EMI_01",
  ...over,
});

const cleanup = () => prisma.lead.deleteMany({ where: { mobileNumber: { in: MOBILES } } });

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("POST /api/v1/leads", () => {
  let firstId = "";

  it("201: files a lead, server recomputes the numbers (client values ignored)", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send(body({ eligibleLoan: 999999, goldValue: 1 }));
    expect(res.status).toBe(201);
    expect(res.body.applicationId).toMatch(/^GL-\d+$/);
    expect(res.body.status).toBe("SUBMITTED");
    expect(res.body.eligibleLoan).toBe(216562);
    expect(res.body.goldValue).toBe(288750);
    firstId = res.body.applicationId;
  });

  it("409: same mobile again returns the existing applicationId", async () => {
    const res = await request(app).post("/api/v1/leads").send(body());
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("DUPLICATE_LEAD");
    expect(res.body.error.applicationId).toBe(firstId);
  });

  it("400: net > gross has a field error on netWeightGrams", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send(body({ mobileNumber: "9000000002", netWeightGrams: 52 }));
    expect(res.status).toBe(400);
    expect(res.body.error.fields[0].field).toBe("netWeightGrams");
  });

  it("400: bad mobiles have a field error on mobileNumber", async () => {
    for (const mobileNumber of ["5876543210", "98765"]) {
      const res = await request(app).post("/api/v1/leads").send(body({ mobileNumber }));
      expect(res.status).toBe(400);
      expect(res.body.error.fields[0].field).toBe("mobileNumber");
    }
  });

  it("404: unknown plan id", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send(body({ mobileNumber: "9000000003", planId: "PLAN_NOPE" }));
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PLAN_NOT_FOUND");
  });

  it("201: Bullet plan gives 202125", async () => {
    const res = await request(app)
      .post("/api/v1/leads")
      .send(body({ mobileNumber: "9000000004", planId: "PLAN_BULLET_01" }));
    expect(res.status).toBe(201);
    expect(res.body.eligibleLoan).toBe(202125);
  });
});

describe("GET /api/v1/leads", () => {
  it("masks mobiles and lists newest first", async () => {
    const res = await request(app).get("/api/v1/leads");
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain("9000000001");
    const mine = res.body.find((l: any) => l.mobileNumber === "9000XXXX01");
    expect(mine).toBeTruthy();
    const times = res.body.map((l: any) => Date.parse(l.createdAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("filters by planId", async () => {
    const res = await request(app).get("/api/v1/leads?planId=PLAN_BULLET_01");
    expect(res.status).toBe(200);
    for (const l of res.body) expect(l.planId).toBe("PLAN_BULLET_01");
  });
});
