import { prisma } from "./db";
import { calculateQuote, type Karat } from "./quote";

export async function getLoanSchemes() {
  const plans = await prisma.loanScheme.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
  });
  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    annualInterestRate: p.annualInterestBps / 100,
    tenureMonths: p.tenureMonths,
    maxLtv: Math.min(p.maxLtvBps, 7500) / 10000,
    repaymentType: p.repaymentType,
  }));
}

export async function getQuotes(input: { netWeightGrams: number; karat: Karat }) {
  const { netWeightGrams, karat } = input;
  const plans = await prisma.loanScheme.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
  });
  const quotes = plans.map((p) => {
    const q = calculateQuote({
      netWeightGrams,
      karat,
      plan: { maxLtv: p.maxLtvBps / 10000 },
    });
    return { planId: p.id, planName: p.name, ...q };
  });
  return { netWeightGrams, karat, quotes };
}
