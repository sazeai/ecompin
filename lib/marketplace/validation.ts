import { z } from "zod"

const email = z.string().trim().email("Enter a valid email address.").max(254)
const honeypot = z.string().max(0).optional().default("")

export const opportunitySchema = z.object({
  leavingProduct: z.string().trim().min(1, "Enter the SaaS you're leaving.").max(80, "Keep the product name under 80 characters."),
  monthlySpend: z.coerce.number().int("Monthly spend must be a whole dollar amount.").positive("Monthly spend must be greater than $0.").max(10_000_000, "Enter a realistic monthly spend."),
  reason: z.string().trim().min(3, "Tell competitors why you're leaving.").max(280, "Keep your reason under 280 characters."),
  email,
  website: honeypot,
})

export const offerSchema = z.object({
  opportunityId: z.string().uuid("This listing could not be found."),
  productName: z.string().trim().min(1, "Enter your product name.").max(80, "Keep the product name under 80 characters."),
  productUrl: z.string().trim().url("Enter a valid product URL.").max(2048).refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol)
    } catch {
      return false
    }
  }, "Product URL must use HTTP or HTTPS."),
  offerText: z.string().trim().min(3, "Tell the customer what you're offering.").max(280, "Keep your offer under 280 characters."),
  email,
  website: honeypot,
})

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message || "Check the form and try again."
}
