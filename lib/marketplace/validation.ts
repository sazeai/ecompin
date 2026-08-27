import { z } from "zod"
import { PROBLEM_CATEGORIES } from "@/lib/marketplace/helpers"

const email = z.string().trim().email("Enter a valid email address.").max(254)
const honeypot = z.string().max(0).optional().default("")

export const problemSchema = z.object({
  statement: z.string().trim().min(20, "Describe the problem in at least 20 characters.").max(280),
  category: z.enum(PROBLEM_CATEGORIES),
  origin: z.enum(["user", "founder"]).default("user"),
  email: z.union([email, z.literal("")]).optional().default(""),
  turnstileToken: z.string().optional().default(""),
  website: honeypot,
})

export const supportSchema = z.object({
  detail: z.string().trim().max(280).optional().default("").refine((value) => !value || value.length >= 3, "Add a little more detail."),
  email: z.union([email, z.literal("")]).optional().default(""),
  turnstileToken: z.string().optional().default(""),
  website: honeypot,
})

export const bidSchema = z.object({
  problemId: z.string().uuid(),
  productName: z.string().trim().min(1).max(80),
  productTagline: z.string().trim().min(3).max(180),
  destinationUrl: z.string().trim().url().max(2048),
  email,
  amountCents: z.coerce.number().int().min(500).max(10_000_000),
  turnstileToken: z.string().optional().default(""),
  website: honeypot,
})

export const productEditSchema = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().min(3).max(180),
  destinationUrl: z.string().trim().url().max(2048),
})

export function firstZodError(error: z.ZodError) { return error.issues[0]?.message || "Check the form and try again." }

export function assessUserContent(value: string) {
  if (/https?:\/\/|www\.|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(value)) return { safe: false, reason: "Links and contact details are not allowed." }
  const promotional = /\b(best|number one|#1|leading|buy now|sign up|use my|my product|guaranteed)\b/i.test(value)
  const dangerous = /\b(kill yourself|terrorist threat)\b/i.test(value)
  if (dangerous) return { safe: false, reason: "This content requires moderation." }
  return { safe: !promotional, reason: promotional ? "Promotional language requires moderation." : null }
}
