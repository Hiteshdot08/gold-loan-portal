import { prisma } from "./db";
import { AppError } from "./errors";
import { calculateQuote } from "./quote";
import type { LeadRequest } from "./schemas";
import { DUPLICATE_WINDOW_MS, gramsToMg, maskMobile, toApplicationId } from "./leadUtils";

export async function createLead(input: LeadRequest) {
  const plan = await prisma.loanScheme.findUnique({ where: { id: input.planId } });
  if (!plan || !plan.active) {
    throw new AppError(404, "PLAN_NOT_FOUND", "Loan plan not found", [
      { field: "planId", message: "Plan not found" },
    ]);
  }

  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const existing = await prisma.lead.findFirst({
    where: { mobileNumber: input.mobileNumber, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    const day = existing.createdAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    });
    const applicationId = toApplicationId(existing.id);
    throw new AppError(
      409,
      "DUPLICATE_LEAD",
      `You already applied on ${day}, application ${applicationId}`,
      [],
      { applicationId, appliedAt: existing.createdAt.toISOString() }
    );
  }

  // never trust client numbers: recompute here
  const q = calculateQuote({
    netWeightGrams: input.netWeightGrams,
    karat: input.karat,
    plan: { maxLtv: plan.maxLtvBps / 10000 },
  });

  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      mobileNumber: input.mobileNumber,
      grossWeightMg: gramsToMg(input.grossWeightGrams),
      netWeightMg: gramsToMg(input.netWeightGrams),
      karat: input.karat,
      planId: plan.id,
      goldValuePaise: BigInt(Math.round(q.goldValue * 100)),
      eligibleLoan: q.eligibleLoan,
    },
  });

  return {
    applicationId: toApplicationId(lead.id),
    status: lead.status,
    planId: plan.id,
    netWeightGrams: input.netWeightGrams,
    grossWeightGrams: input.grossWeightGrams,
    karat: input.karat,
    pureGoldGrams: q.pureGoldGrams,
    goldValue: q.goldValue,
    eligibleLoan: q.eligibleLoan,
    createdAt: lead.createdAt.toISOString(),
  };
}

export async function listLeads(planId?: string) {
  const leads = await prisma.lead.findMany({
    where: planId ? { planId } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return leads.map((l) => ({
    applicationId: toApplicationId(l.id),
    name: l.name,
    mobileNumber: maskMobile(l.mobileNumber),
    netWeightGrams: l.netWeightMg / 1000,
    grossWeightGrams: l.grossWeightMg / 1000,
    karat: l.karat,
    planId: l.planId,
    goldValue: Number(l.goldValuePaise) / 100,
    eligibleLoan: l.eligibleLoan,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }));
}
