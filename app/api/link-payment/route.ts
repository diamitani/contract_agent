import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { stripe } from "@/lib/stripe"
import { APP_ID } from "@/lib/constants"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = (await request.json()) as {
      sessionId?: string
      userId?: string
    }

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.status !== "complete" || checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Checkout session is not paid" }, { status: 400 })
    }

    const productType = checkoutSession.metadata?.product_type
    const customerId = typeof checkoutSession.customer === "string" ? checkoutSession.customer : null

    if (!productType || (productType !== "per_contract" && productType !== "unlimited")) {
      return NextResponse.json({ error: "Invalid or missing product type" }, { status: 400 })
    }

    const sessionUserId = checkoutSession.metadata?.user_id
    if (sessionUserId && sessionUserId !== userId) {
      return NextResponse.json({ error: "Session user mismatch" }, { status: 403 })
    }

    // Create or update user profile with subscription info
    const profileData: Record<string, unknown> = {
      user_id: userId,
      stripe_customer_id: customerId,
      email: checkoutSession.customer_details?.email,
      updated_at: new Date().toISOString(),
    }

    if (productType === "unlimited") {
      profileData.subscription_status = "unlimited"
      profileData.subscription_id = typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : null
    } else if (productType === "per_contract") {
      // Get existing contracts_remaining
      const { data: existingProfile } = await supabaseAdmin
        .from("user_profiles")
        .select("contracts_remaining")
        .eq("user_id", userId)
        .maybeSingle()

      profileData.subscription_status = "per_contract"
      profileData.contracts_remaining = (existingProfile?.contracts_remaining || 0) + 1
    }

    await supabaseAdmin.from("user_profiles").upsert(profileData, { onConflict: "user_id" })

    // Record payment if session ID provided
    if (sessionId) {
      try {
        await supabaseAdmin.from("payments").upsert(
          {
            user_id: userId,
            stripe_session_id: sessionId,
            stripe_payment_id: typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : null,
            amount: checkoutSession.amount_total || 0,
            product_type: productType,
            status: "completed",
            app_id: APP_ID,
          },
          { onConflict: "stripe_session_id" },
        )
      } catch (e) {
        console.error("Failed to record payment:", e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Link payment error:", error)
    return NextResponse.json({ error: "Failed to link payment" }, { status: 500 })
  }
}
