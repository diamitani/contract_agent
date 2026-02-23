import { type NextRequest, NextResponse } from "next/server"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { APP_ID } from "@/lib/constants"
import { getCurrentUser } from "@/lib/auth/current-user"
import { findPaymentBySessionId, getUserProfile, isCosmosConfigured, upsertPayment, upsertUserProfile } from "@/lib/cosmos/store"

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 })
    }

    if (!isCosmosConfigured()) {
      return NextResponse.json({ error: "Cosmos DB is not configured" }, { status: 500 })
    }

    const { sessionId, userId } = (await request.json()) as {
      sessionId?: string
      userId?: string
    }

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (currentUser.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const stripe = getStripe()
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
      const existingProfile = await getUserProfile(userId)

      profileData.subscription_status = "per_contract"
      profileData.contracts_remaining = (existingProfile?.contracts_remaining || 0) + 1
    }

    await upsertUserProfile(userId, {
      stripe_customer_id: customerId,
      email: (checkoutSession.customer_details?.email || null) as string | null,
      subscription_status: (profileData.subscription_status as "free" | "per_contract" | "unlimited") || "free",
      subscription_id: (profileData.subscription_id as string | null | undefined) || null,
      contracts_remaining: Number(profileData.contracts_remaining || 0),
      platform: APP_ID,
      registered_app_id: APP_ID,
    })

    // Record payment if session ID provided
    if (sessionId) {
      try {
        const existingPayment = await findPaymentBySessionId(sessionId)
        await upsertPayment({
          id: existingPayment?.id,
          user_id: userId,
          stripe_session_id: sessionId,
          stripe_payment_id: typeof checkoutSession.payment_intent === "string" ? checkoutSession.payment_intent : null,
          amount: checkoutSession.amount_total || 0,
          product_type: productType,
          status: "completed",
          app_id: APP_ID,
          created_at: existingPayment?.created_at,
        })
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
