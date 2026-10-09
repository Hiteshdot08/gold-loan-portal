export type Karat = 18 | 22 | 24;

export interface Plan {
  maxLtv: number; // e.g. 0.7 or 0.75
}

export function calculateQuote(input: {
  netWeightGrams: number;
  karat: Karat;
  plan: Plan;
  rate24kPerGram?: number; // rupees
}) {
  const { netWeightGrams, karat, plan, rate24kPerGram = 7000 } = input;

  const netMg = BigInt(Math.round(netWeightGrams * 1000));
  const ratePaise = BigInt(Math.round(rate24kPerGram * 100));
  const ltvBps = BigInt(Math.round(Math.min(plan.maxLtv, 0.75) * 10000));
  const k = BigInt(karat);

  const pureGoldGrams = Number((netMg * k) / 24n) / 1000;
  const goldValuePaise = (netMg * k * ratePaise) / 24000n;
  const goldValue = Number(goldValuePaise) / 100;

  // floor to whole rupees, exactly
  const eligibleLoan = Number(
    (netMg * k * ratePaise * ltvBps) / (24000n * 10000n * 100n)
  );

  return { pureGoldGrams, goldValue, eligibleLoan };
}
