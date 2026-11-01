import "dotenv/config";
import { GoogleGenAI, type Content, type GenerateContentParameters } from "@google/genai";

type GenerateParams = GenerateContentParameters;

export interface LlmFunctionCall {
  name?: string;
  args?: Record<string, unknown>;
}
export interface LlmResponse {
  candidates?: { content?: Content }[];
  functionCalls?: LlmFunctionCall[];
  text?: string;
}

// ---------- Gemini ----------
let _ai: GoogleGenAI | undefined;
function gemini() {
  if (!_ai) {
    _ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: 60000 },
    });
  }
  return _ai;
}

// ---------- Groq (OpenAI-compatible API) ----------
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function toJsonSchema(s: unknown): unknown {
  if (Array.isArray(s)) return s.map(toJsonSchema);
  if (s && typeof s === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(s as Record<string, unknown>)) {
      out[k] = k === "type" && typeof v === "string" ? v.toLowerCase() : toJsonSchema(v);
    }
    return out;
  }
  return s;
}

function groqTools(params: GenerateParams) {
  const tools = (params.config?.tools ?? []) as { functionDeclarations?: unknown[] }[];
  const decls = tools.flatMap((t) => t.functionDeclarations ?? []) as {
    name: string;
    description?: string;
    parameters?: unknown;
  }[];
  return decls.map((d) => ({
    type: "function",
    function: {
      name: d.name,
      description: d.description,
      parameters: toJsonSchema(d.parameters ?? { type: "object", properties: {} }),
    },
  }));
}

type GroqMessage = Record<string, unknown>;

// Converts the app's Gemini-style history into OpenAI-style messages.
function toGroqMessages(params: GenerateParams): GroqMessage[] {
  const messages: GroqMessage[] = [];
  const sys = params.config?.systemInstruction;
  if (typeof sys === "string") messages.push({ role: "system", content: sys });

  const contents = (Array.isArray(params.contents) ? params.contents : []) as Content[];
  let counter = 0;
  let pending: { id: string; name: string }[] = [];

  // Every tool call needs an answer before the next message, or Groq rejects the request.
  const flushPending = () => {
    for (const p of pending) {
      messages.push({
        role: "tool",
        tool_call_id: p.id,
        content: JSON.stringify({ error: { code: "NOT_COMPLETED", message: "This step was not completed." } }),
      });
    }
    pending = [];
  };

  for (const c of contents) {
    const parts = c.parts ?? [];
    if (c.role === "model") {
      flushPending();
      const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("");
      const calls = parts.filter((p) => p.functionCall);
      const msg: GroqMessage = { role: "assistant", content: text || null };
      if (calls.length) {
        msg.tool_calls = calls.map((p) => {
          const id = `call_${counter++}`;
          const name = p.functionCall!.name ?? "";
          pending.push({ id, name });
          return {
            id,
            type: "function",
            function: { name, arguments: JSON.stringify(p.functionCall!.args ?? {}) },
          };
        });
      }
      messages.push(msg);
    } else {
      for (const p of parts.filter((x) => x.functionResponse)) {
        const name = p.functionResponse!.name ?? "";
        const i = pending.findIndex((x) => x.name === name);
        if (i < 0) continue;
        const { id } = pending.splice(i, 1)[0];
        const r = p.functionResponse!.response as { output?: unknown } | undefined;
        messages.push({ role: "tool", tool_call_id: id, content: JSON.stringify(r?.output ?? r ?? {}) });
      }
      const text = parts.filter((x) => x.text).map((x) => x.text).join("");
      if (text) {
        flushPending();
        messages.push({ role: "user", content: text });
      }
    }
  }
  flushPending();
  return messages;
}

async function groqGenerate(params: GenerateParams): Promise<LlmResponse> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");

  const body = {
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    messages: toGroqMessages(params),
    tools: groqTools(params),
    tool_choice: "auto",
    temperature: 0,
  };

  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    throw new Error(`{"error":{"code":504,"message":"Groq request failed or timed out: ${e instanceof Error ? e.message : e}"}}`);
  }

  if (!res.ok) {
    const text = await res.text();
    const retryAfter = res.headers.get("retry-after");
    const hint = retryAfter ? ` Please retry in ${retryAfter}s.` : "";
    throw Object.assign(
      new Error(`{"error":{"code":${res.status},"message":${JSON.stringify(text.slice(0, 500))}}}${hint}`),
      { status: res.status }
    );
  }

  const data = (await res.json()) as {
    choices?: {
      message?: { content?: string | null; tool_calls?: { function: { name: string; arguments: string } }[] };
    }[];
  };
  const msg = data.choices?.[0]?.message;
  const text = msg?.content ?? "";
  const calls: LlmFunctionCall[] = (msg?.tool_calls ?? []).map((tc) => {
    let args: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(tc.function.arguments || "{}");
      if (parsed && typeof parsed === "object") args = parsed;
    } catch {
      // malformed arguments: pass empty args, the Zod check will report what is missing
    }
    return { name: tc.function.name, args };
  });

  const parts = [
    ...(text ? [{ text }] : []),
    ...calls.map((c) => ({ functionCall: { name: c.name, args: c.args } })),
  ];
  return {
    candidates: msg ? [{ content: { role: "model", parts } }] : [],
    functionCalls: calls,
    text: text || undefined,
  };
}

// ---------- Retry wrapper (same for both providers) ----------
function isRetryable(e: unknown): boolean {
  const status = (e as { status?: number })?.status;
  if (status === 503 || status === 429 || status === 500 || status === 504) return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /"code":\s*(503|429|500|504)|UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|tool_use_failed/.test(msg);
}

// Providers say how long to wait on a 429 ("Please retry in 15.5s" or "retryDelay":"15s").
function retryDelayMs(e: unknown, fallbackMs: number): number {
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.match(/retry in ([\d.]+)s/i) ?? msg.match(/"retryDelay":\s*"(\d+)s"/);
  if (m) return Math.ceil(parseFloat(m[1]) * 1000) + 1000;
  return fallbackMs;
}

async function callOnce(params: GenerateParams): Promise<LlmResponse> {
  if ((process.env.LLM_PROVIDER ?? "gemini").toLowerCase() === "groq") {
    return groqGenerate(params);
  }
  const res = await gemini().models.generateContent(params);
  return {
    get candidates() {
      return res.candidates;
    },
    get functionCalls() {
      return res.functionCalls;
    },
    get text() {
      return res.text;
    },
  };
}

export async function generateWithRetry(params: GenerateParams): Promise<LlmResponse> {
  const fallbackDelaysMs = [1000, 2000, 4000, 8000, 16000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await callOnce(params);
    } catch (e) {
      if (attempt >= fallbackDelaysMs.length || !isRetryable(e)) throw e;
      const wait = retryDelayMs(e, fallbackDelaysMs[attempt]);
      if (wait > 60000) throw e; // a delay this long means a daily quota, so retrying is pointless
      console.warn(`[llm] retry ${attempt + 1} in ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
