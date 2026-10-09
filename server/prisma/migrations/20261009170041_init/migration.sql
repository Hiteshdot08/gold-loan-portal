-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "LoanScheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "annualInterestBps" INTEGER NOT NULL,
    "maxLtvBps" INTEGER NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "repaymentType" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LoanScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "grossWeightMg" INTEGER NOT NULL,
    "netWeightMg" INTEGER NOT NULL,
    "karat" INTEGER NOT NULL,
    "planId" TEXT NOT NULL,
    "goldValuePaise" BIGINT NOT NULL,
    "eligibleLoan" INTEGER NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_mobileNumber_createdAt_idx" ON "Lead"("mobileNumber", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_planId_fkey" FOREIGN KEY ("planId") REFERENCES "LoanScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
