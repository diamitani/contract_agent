import Stripe from "stripe"

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ||
    "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",
  {
    apiVersion: "2025-05-28.basil",
  },
)

export const PRODUCTS = {
  per_contract: {
    id: "prod_TaBqQcgKUGl22A", // Single Contract Generation
    name: "Single Contract",
    price: 1999, // $19.99 in cents
    description: "Generate one AI-powered contract",
  },
  unlimited: {
    id: "prod_TZS3I9e38MLwr1", // Unlimited Contracts Pro (reusing existing)
    name: "Unlimited Pro",
    price: 999, // $9.99/month in cents
    description: "Unlimited contract generation + analysis",
  },
} as const

export type ProductType = keyof typeof PRODUCTS
