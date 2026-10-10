import "dotenv/config";
import readline from "node:readline/promises";
import type { Content } from "@google/genai";
import { runAgent, resolveSubmission, type AgentResult } from "./agent";
import { prisma } from "./db";

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let history: Content[] = [];
  console.log("Loan Assist (type 'exit' to quit)\n");

  while (true) {
    const text = (await rl.question("you> ")).trim();
    if (!text) continue;
    if (text === "exit") break;

    let result: AgentResult = await runAgent([
      ...history,
      { role: "user", parts: [{ text }] },
    ]);

    while (result.pendingApplication) {
      console.log(`\nbot> ${result.reply}\n`);
      console.log("--- Confirm application ---");
      console.log(result.pendingApplication);
      const ans = (await rl.question("Submit this? (y/n) ")).trim().toLowerCase();
      result = await resolveSubmission(
        result.history,
        result.pendingApplication,
        ans === "y"
      );
    }

    history = result.history;
    console.log(`\nbot> ${result.reply}\n`);
  }

  rl.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
