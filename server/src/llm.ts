import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { timeout: 60000 }, // fail after 30s instead of hanging
});

type GenerateParams = Parameters<typeof ai.models.generateContent>[0];

function isRetryable(e: unknown): boolean {
  const status = (e as { status?: number })?.status;
  if (status === 503 || status === 429 || status === 500 || status === 504) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /"code":\s*(503|429|500|504)|UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED/.test(msg);
}

// Gemini tells us how long to wait on a 429 ("Please retry in 15.5s" or "retryDelay":"15s").
function retryDelayMs(e: unknown, fallbackMs: number): number {
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.match(/retry in ([\d.]+)s/i) ?? msg.match(/"retryDelay":\s*"(\d+)s"/);
  if (m) return Math.ceil(parseFloat(m[1]) * 1000) + 1000;
  return fallbackMs;
}

export async function generateWithRetry(params: GenerateParams) {
  const fallbackDelaysMs = [1000, 2000, 4000, 8000, 16000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (e) {
      if (attempt >= fallbackDelaysMs.length || !isRetryable(e)) throw e;
      const wait = retryDelayMs(e, fallbackDelaysMs[attempt]);
      if (wait > 60000) throw e; // a delay this long means a daily quota, so retrying is pointless
      console.warn(`[llm] retry ${attempt + 1} in ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
