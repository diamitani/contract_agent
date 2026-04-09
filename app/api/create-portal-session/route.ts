import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getStripe, isStripeConfigured } from "@/lib/stripe"
import { getUserProfile, isCosmosConfigured } from "@/lib/cosmos/store"

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const returnUrl = body.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile`

  let stripeCustomerId: string | null = null

  if (isCosmosConfigured()) {
    const profile = await getUserProfile(user.id)
    stripeCustomerId = profile?.stripe_customer_id || null
  }

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Please make a purchase first." },
      { status: 400 },
    )
  }

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[portal] Stripe portal session error:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
