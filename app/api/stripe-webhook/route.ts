import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

// Use service role for webhook handler
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  let event: Stripe.Event

  try {
    // In production, verify webhook signature
    // For now, parse the event directly
    event = JSON.parse(body) as Stripe.Event
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

        if (!userId) break

        // Update payment status
        await supabaseAdmin
          .from("payments")
          .update({
            status: "completed",
            stripe_payment_id: session.payment_intent as string,
          })
          .eq("stripe_session_id", session.id)

        // Update user profile based on product type
        if (productType === "unlimited") {
          await supabaseAdmin
            .from("user_profiles")
            .update({
              subscription_status: "unlimited",
              subscription_id: session.subscription as string,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
        } else if (productType === "per_contract") {
          // Add one contract credit
          const { data: profile } = await supabaseAdmin
            .from("user_profiles")
            .select("contracts_remaining")
            .eq("user_id", userId)
            .single()

          await supabaseAdmin
            .from("user_profiles")
            .update({
              subscription_status: "per_contract",
              contracts_remaining: (profile?.contracts_remaining || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by Stripe customer ID
        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (profile) {
          await supabaseAdmin
            .from("user_profiles")
            .update({
              subscription_status: "free",
              subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", profile.user_id)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (profile) {
          // Could send email notification here
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
