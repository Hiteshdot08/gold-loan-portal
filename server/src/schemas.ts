import { z } from "zod";

export const karatSchema = z.union([
  z.literal(18),
  z.literal(22),
  z.literal(24),
]);

const baseWeights = z.object({
  netWeightGrams: z.number().positive().max(1000),
  grossWeightGrams: z.number().positive().max(1000),
  karat: karatSchema,
});

const netNotAboveGross = {
  message: "Net weight cannot be greater than gross weight",
  path: ["netWeightGrams"],
};

export const quoteRequestSchema = baseWeights.refine(
  (d) => d.netWeightGrams <= d.grossWeightGrams,
  netNotAboveGross
);

export const leadRequestSchema = baseWeights
  .extend({
    name: z
      .string()
      .trim()
      .regex(/^[A-Za-z ]{2,60}$/, "Name must be 2-60 letters and spaces only"),
    mobileNumber: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    planId: z.string().min(1),
  })
  .refine((d) => d.netWeightGrams <= d.grossWeightGrams, netNotAboveGross);

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type LeadRequest = z.infer<typeof leadRequestSchema>;
