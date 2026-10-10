import "dotenv/config";
import { type Content, type Part } from "@google/genai";
import { generateWithRetry } from "./llm";
import { SYSTEM_PROMPT, FUNCTION_DECLARATIONS } from "./agentConfig";
import { runReadOnlyTool, submitConfirmedApplication } from "./agentTools";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.7-flash";
const MAX_STEPS = 6;

export interface AgentResult {
  reply: string;
  history: Content[];
  pendingApplication?: Record<string, unknown>;
}

export async function runAgent(startHistory: Content[]): Promise<AgentResult> {
  let history = startHistory;

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await generateWithRetry({
      model: MODEL,
      contents: history,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0,
        tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
      },
    });

    const content = res.candidates?.[0]?.content;
    if (!content) {
      return { reply: "Sorry, I could not respond. Please try again.", history };
    }

    const calls = res.functionCalls ?? [];
    if (calls.length === 0) {
      return { reply: res.text ?? "", history: [...history, content] };
    }

    // The model wants to file the application: stop and ask the user to confirm.
    const submit = calls.find((c) => c.name === "submit_application");
    if (submit) {
      const parts = (content.parts ?? []).filter(
        (p) => !p.functionCall || p.functionCall.name === "submit_application"
      );
      return {
        reply: res.text ?? "Please review the summary and confirm your application.",
        history: [...history, { ...content, parts }],
        pendingApplication: (submit.args ?? {}) as Record<string, unknown>,
      };
    }

    // Read-only tools: run them and feed the results back to the model.
    const responseParts: Part[] = [];
    for (const call of calls) {
      const output = await runReadOnlyTool(call.name ?? "", call.args);
      responseParts.push({
        functionResponse: { name: call.name, response: { output } },
      });
    }
    history = [...history, content, { role: "user", parts: responseParts }];
  }

  return { reply: "Sorry, that took too many steps. Please try again.", history };
}

// Called only after the user clicks Confirm (or Cancel) in the UI.
export async function resolveSubmission(
  history: Content[],
  application: unknown,
  confirmed: boolean
): Promise<AgentResult> {
  const output = confirmed
    ? await submitConfirmedApplication(application)
    : { error: { code: "USER_CANCELLED", message: "The user chose not to submit." } };

  const next: Content[] = [
    ...history,
    {
      role: "user",
      parts: [{ functionResponse: { name: "submit_application", response: { output } } }],
    },
  ];
  return runAgent(next);
}
