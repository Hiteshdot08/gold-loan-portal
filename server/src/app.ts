import express, { type NextFunction, type Request, type Response } from "express";
import { leadRouter } from "./leadRoutes";
import { chatRouter } from "./chatRoutes";
import { AppError, fromZod, toErrorBody } from "./errors";
import { quoteRequestSchema } from "./schemas";
import { getLoanSchemes, getQuotes } from "./planService";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/leads", leadRouter);
  app.use("/api/v1/chat", chatRouter);

  app.get("/api/v1/loan-schemes", async (_req, res, next) => {
    try {
      res.json(await getLoanSchemes());
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/v1/quotes", async (req, res, next) => {
    try {
      const parsed = quoteRequestSchema.safeParse(req.body);
      if (!parsed.success) throw fromZod(parsed.error);
      const { netWeightGrams, karat } = parsed.data;
      res.json(await getQuotes({ netWeightGrams, karat }));
    } catch (e) {
      next(e);
    }
  });

  // unknown routes -> JSON 404
  app.use((_req, _res, next) => {
    next(new AppError(404, "NOT_FOUND", "Route not found"));
  });

  // central error handler: always JSON, never a stack trace
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      return res.status(err.status).json(toErrorBody(err));
    }
    // malformed JSON body from express.json()
    if (err instanceof SyntaxError && "body" in err) {
      return res
        .status(400)
        .json(toErrorBody(new AppError(400, "INVALID_JSON", "Request body is not valid JSON")));
    }
    console.error("Unhandled error:", err instanceof Error ? err.message : err);
    res
      .status(500)
      .json(toErrorBody(new AppError(500, "INTERNAL_ERROR", "Something went wrong")));
  });

  return app;
}
