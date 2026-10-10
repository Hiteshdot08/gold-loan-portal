import { Router } from "express";
import rateLimit from "express-rate-limit";
import { fromZod } from "./errors";
import { leadRequestSchema } from "./schemas";
import { createLead, listLeads } from "./leadService";

export const leadRouter = Router();

const createLeadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (_req, res) => {
    res.status(429).json({
      error: { code: "RATE_LIMITED", message: "Too many applications. Please wait a minute and try again.", fields: [] },
    });
  },
});

leadRouter.post("/", createLeadLimiter, async (req, res, next) => {
  try {
    const parsed = leadRequestSchema.safeParse(req.body);
    if (!parsed.success) throw fromZod(parsed.error);
    const lead = await createLead(parsed.data);
    res.status(201).json(lead);
  } catch (e) {
    next(e);
  }
});

leadRouter.get("/", async (req, res, next) => {
  try {
    const planId = typeof req.query.planId === "string" ? req.query.planId : undefined;
    res.json(await listLeads(planId));
  } catch (e) {
    next(e);
  }
});
