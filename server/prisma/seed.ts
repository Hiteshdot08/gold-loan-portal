import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.loanScheme.upsert({
    where: { id: "PLAN_BULLET_01" },
    update: {},
    create: { id: "PLAN_BULLET_01", name: "Bullet Repayment", annualInterestBps: 1200,
              maxLtvBps: 7000, tenureMonths: 12, repaymentType: "BULLET" },
  });
  await prisma.loanScheme.upsert({
    where: { id: "PLAN_EMI_01" },
    update: {},
    create: { id: "PLAN_EMI_01", name: "Monthly EMI", annualInterestBps: 1050,
              maxLtvBps: 7500, tenureMonths: 12, repaymentType: "EMI" },
  });
}

main().finally(() => prisma.$disconnect());
