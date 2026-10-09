import { Router } from "express";
import { fromZod } from "./errors";
import { leadRequestSchema } from "./schemas";
import { createLead, listLeads } from "./leadService";

export const leadRouter = Router();

leadRouter.post("/", async (req, res, next) => {
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
