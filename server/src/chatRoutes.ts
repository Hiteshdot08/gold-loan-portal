import { Router } from "express";
import { z } from "zod";
import { fromZod } from "./errors";
import { runAgent, resolveSubmission } from "./agent";

export const chatRouter = Router();

const historySchema = z
  .array(
    z.object({
      role: z.enum(["user", "model"]),
      parts: z.array(z.any()),
    })
  )
  .max(60);

const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: historySchema.default([]),
});

const confirmSchema = z.object({
  history: historySchema,
  application: z.record(z.string(), z.unknown()),
  confirmed: z.boolean(),
});

chatRouter.post("/", async (req, res, next) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) throw fromZod(parsed.error);
    const { message, history } = parsed.data;
    const result = await runAgent([
      ...history,
      { role: "user", parts: [{ text: message }] },
    ]);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

chatRouter.post("/confirm", async (req, res, next) => {
  try {
    const parsed = confirmSchema.safeParse(req.body);
    if (!parsed.success) throw fromZod(parsed.error);
    const { history, application, confirmed } = parsed.data;
    res.json(await resolveSubmission(history, application, confirmed));
  } catch (e) {
    next(e);
  }
});
