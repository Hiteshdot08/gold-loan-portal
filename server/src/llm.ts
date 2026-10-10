import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type GenerateParams = Parameters<typeof ai.models.generateContent>[0];

function isRetryable(e: unknown): boolean {
  const status = (e as { status?: number })?.status;
  if (status === 503 || status === 429 || status === 500) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /"code":\s*(503|429|500)|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(msg);
}

export async function generateWithRetry(params: GenerateParams) {
  const delaysMs = [1000, 2000, 4000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (e) {
      if (attempt >= delaysMs.length || !isRetryable(e)) throw e;
      await new Promise((r) => setTimeout(r, delaysMs[attempt]));
    }
  }
}
