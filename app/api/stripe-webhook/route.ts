import { type NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { APP_ID } from "@/lib/constants"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import {
  findPaymentBySessionId,
  findUserProfileByStripeCustomerId,
  getUserProfile,
  isCosmosConfigured,
  upsertPayment,
  upsertUserProfile,
} from "@/lib/cosmos/store"

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 })
  }

  if (!isCosmosConfigured()) {
    return NextResponse.json({ error: "Cosmos DB is not configured" }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret")
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const productType = session.metadata?.product_type
        const appId = session.metadata?.app_id || APP_ID

        if (!userId) break

        // Update payment status
        const existingPayment = await findPaymentBySessionId(session.id)
        await upsertPayment({
          id: existingPayment?.id,
          user_id: userId,
          stripe_session_id: session.id,
          stripe_payment_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          amount: existingPayment?.amount || session.amount_total || 0,
          product_type: (productType as string) || existingPayment?.product_type || "per_contract",
          status: "completed",
          app_id: appId,
          created_at: existingPayment?.created_at,
        })

        // Update user profile based on product type
        if (productType === "unlimited") {
          await upsertUserProfile(userId, {
            subscription_status: "unlimited",
            subscription_id: typeof session.subscription === "string" ? session.subscription : null,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            email: session.customer_details?.email || null,
            platform: APP_ID,
          })
        } else if (productType === "per_contract") {
          const profile = await getUserProfile(userId)
          await upsertUserProfile(userId, {
            subscription_status: "per_contract",
            contracts_remaining: (profile?.contracts_remaining || 0) + 1,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            email: session.customer_details?.email || null,
            platform: APP_ID,
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const profile = await findUserProfileByStripeCustomerId(customerId)

        if (profile) {
          await upsertUserProfile(profile.user_id, {
            subscription_status: "free",
            subscription_id: null,
          })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const profile = await findUserProfileByStripeCustomerId(customerId)

        if (profile) {
          console.log("Payment failed for user:", profile.user_id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
