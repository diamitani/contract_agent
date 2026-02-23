import { type NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { getStripe, isStripeConfigured, PRODUCTS, type ProductType } from "@/lib/stripe"
import { APP_ID } from "@/lib/constants"
import { getCurrentUser } from "@/lib/auth/current-user"
import { ensureUserProfile, isCosmosConfigured, upsertPayment, upsertUserProfile } from "@/lib/cosmos/store"

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 })
    }

    if (!isCosmosConfigured()) {
      return NextResponse.json({ error: "Cosmos DB is not configured" }, { status: 500 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productType, contractSlug, couponCode } = (await request.json()) as {
      productType: ProductType
      contractSlug?: string
      couponCode?: string
    }

    if (!productType || !PRODUCTS[productType]) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 })
    }

    const product = PRODUCTS[productType]
    const stripe = getStripe()

    const profile = await ensureUserProfile(user)
    let customerId = profile?.stripe_customer_id || null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          user_id: user.id,
          app_id: APP_ID,
        },
      })
      customerId = customer.id

      await upsertUserProfile(user.id, {
        email: user.email || null,
        full_name: user.name || null,
        stripe_customer_id: customerId,
        registered_app_id: APP_ID,
        platform: APP_ID,
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000"

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card"],
      mode: productType === "unlimited" ? "subscription" : "payment",
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}${contractSlug ? `&contract=${contractSlug}` : ""}`,
      cancel_url: `${baseUrl}/pricing`,
      allow_promotion_codes: true,
      ...(couponCode && {
        discounts: [{ coupon: couponCode }],
      }),
      metadata: {
        user_id: user.id,
        product_type: productType,
        contract_slug: contractSlug || "",
        app_id: APP_ID,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: product.id,
            unit_amount: product.price,
            ...(productType === "unlimited" && {
              recurring: {
                interval: "month",
              },
            }),
          },
          quantity: 1,
        },
      ],
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    try {
      await upsertPayment({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: product.price,
        product_type: productType,
        status: "pending",
        app_id: APP_ID,
      })
    } catch (paymentError) {
      console.error("Failed to record payment:", paymentError)
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
