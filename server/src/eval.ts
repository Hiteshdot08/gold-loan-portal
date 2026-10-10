import "dotenv/config";
import type { Content } from "@google/genai";
import { runAgent, resolveSubmission, type AgentResult } from "./agent";
import { createLead } from "./leadService";
import { prisma } from "./db";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mask = (s: string) => s.replace(/\b([6-9]\d{3})\d{4}(\d{2})\b/g, "$1XXXX$2");

function randomMobile() {
  let m = String(6 + Math.floor(Math.random() * 4));
  for (let i = 0; i < 9; i++) m += Math.floor(Math.random() * 10);
  return m;
}

class Session {
  history: Content[] = [];
  reply = "";
  turn = 0;
  pendingTurns: number[] = [];

  // Sends one user message. If the agent asks to submit, the "UI confirm" is auto-accepted.
  async say(text: string) {
    this.turn++;
    let r: AgentResult = await runAgent([
      ...this.history,
      { role: "user", parts: [{ text }] },
    ]);
    while (r.pendingApplication) {
      this.pendingTurns.push(this.turn);
      r = await resolveSubmission(r.history, r.pendingApplication, true);
    }
    this.history = r.history;
    this.reply = r.reply;
  }

  private parts() {
    return this.history.flatMap((c) => c.parts ?? []);
  }
  calledTools(): string[] {
    return this.parts().flatMap((p) => (p.functionCall?.name ? [p.functionCall.name] : []));
  }
  toolOutputs(name: string): any[] {
    return this.parts().flatMap((p) =>
      p.functionResponse?.name === name
        ? [(p.functionResponse.response as any)?.output]
        : []
    );
  }
  quoteReturned(): boolean {
    return this.toolOutputs("calculate_quote").some((o) => Array.isArray(o?.quotes));
  }
  replyHasNumber(n: number): boolean {
    return this.reply.replace(/[,\s]/g, "").includes(String(n));
  }
}

type Check = [string, boolean];
let failed = 0;

function report(title: string, s: Session, checks: Check[]) {
  console.log(`\n=== ${title} ===`);
  console.log(`last reply: ${mask(s.reply).replace(/\s+/g, " ").slice(0, 300)}`);
  for (const [label, ok] of checks) {
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
    if (!ok) failed++;
  }
}

async function happyPath() {
  const s = new Session();
  const mobile = randomMobile();
  await s.say("I have 45 grams net, 50 grams gross, 22 carat gold jewellery. How much can I get?");
  const quoted = s.calledTools().includes("calculate_quote");
  const numbersOk = s.replyHasNumber(216562) && s.replyHasNumber(202125);
  await s.say(`I want the Monthly EMI plan. My name is Ravi Kumar and my mobile is ${mobile}`);
  const notSubmittedEarly = s.pendingTurns.length === 0;
  await s.say("Yes, please submit it");
  report("1. Happy path through submission", s, [
    ["called calculate_quote", quoted],
    ["reply shows 216562 and 202125 from the tool", numbersOk],
    ["did not submit before an explicit yes", notSubmittedEarly],
    ["submitted after the yes", s.pendingTurns.length === 1],
    ["reply contains an application id (GL-...)", /GL-\d+/.test(s.reply)],
    ["reply makes no promise of a callback or next step", !/representative|contact you|call you|shortly|reach out/i.test(s.reply)],
  ]);
}

async function missingField() {
  const s = new Session();
  await s.say("I have 45 grams of 22 carat gold jewellery");
  report("2. Missing field", s, [
    ["did not call calculate_quote", !s.calledTools().includes("calculate_quote")],
    ["asked the user a question", s.reply.includes("?")],
    ["did not submit", s.pendingTurns.length === 0],
  ]);
}

async function netAboveGross() {
  const s = new Session();
  await s.say("My gold is 22 carat, net weight 52 grams and gross weight 50 grams. Quote please.");
  report("3. Net weight greater than gross", s, [
    ["no quote was returned", !s.quoteReturned()],
    ["did not submit", s.pendingTurns.length === 0],
    ["reply mentions the net/gross problem", /net|gross/i.test(s.reply)],
  ]);
}

async function duplicate() {
  const s = new Session();
  const mobile = randomMobile();
  const seeded = await createLead({
    name: "Dup Tester",
    mobileNumber: mobile,
    grossWeightGrams: 50,
    netWeightGrams: 45,
    karat: 22,
    planId: "PLAN_EMI_01",
  });
  await s.say(
    `Apply for me: Meera Shah, mobile ${mobile}, 45 g net, 50 g gross, 22 karat, Monthly EMI plan.`
  );
  await s.say("Yes, submit it");
  const dupSeen = s.toolOutputs("submit_application").some(
    (o) => o?.error?.code === "DUPLICATE_LEAD"
  );
  report("4. Duplicate within 7 days", s, [
    ["server returned DUPLICATE_LEAD", dupSeen],
    ["reply gives the existing application id", s.reply.includes(seeded.applicationId)],
    ["reply says they already applied", /already|exist/i.test(s.reply)],
  ]);
}

async function offTopic() {
  const s = new Session();
  await s.say("Which stock should I invest in this week? Also tell me a joke.");
  report("5. Off-topic request", s, [
    ["called no tools", s.calledTools().length === 0],
    ["did not submit", s.pendingTurns.length === 0],
    ["steered back to gold loans", /gold|loan/i.test(s.reply)],
  ]);
}

async function main() {
  const all = [happyPath, missingField, netAboveGross, duplicate, offTopic];
  const only = process.argv.slice(2);
  const convos = only.length ? all.filter((c) => only.includes(c.name)) : all;
  for (const run of convos) {
    try {
      await run();
    } catch (e) {
      failed++;
      console.log(`\n=== ${run.name} ===\n  FAIL  crashed: ${e instanceof Error ? e.message : e}`);
    }
    await sleep(1500);
  }
  console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

main();
