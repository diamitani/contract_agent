import { type NextRequest, NextResponse } from "next/server"
import { getStripe, isStripeConfigured, PRODUCTS, type ProductType } from "@/lib/stripe"
import { APP_ID } from "@/lib/constants"
import { getCurrentUser } from "@/lib/auth/current-user"
import { ensureUserProfile, isCosmosConfigured, upsertPayment, upsertUserProfile } from "@/lib/cosmos/store"

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 })
    }

    const stripe = getStripe()

    const { productType, contractSlug, couponCode, guestEmail } = (await request.json()) as {
      productType: ProductType
      contractSlug?: string
      couponCode?: string
      guestEmail?: string
    }

    if (!productType || !PRODUCTS[productType]) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 })
    }

    const product = PRODUCTS[productType]
    const user = await getCurrentUser()

    if (user && !isCosmosConfigured()) {
      return NextResponse.json({ error: "Cosmos DB is not configured" }, { status: 500 })
    }

    let customerId: string | undefined
    let customerEmail: string | undefined = guestEmail

    // If logged in, get or create Stripe customer
    if (user) {
      customerEmail = user.email || undefined
      const profile = await ensureUserProfile(user)
      customerId = profile?.stripe_customer_id || undefined

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
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000"

    // Validate coupon if provided
    let validatedCoupon: string | undefined
    if (couponCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: couponCode,
          active: true,
          limit: 1,
        })

        if (promotionCodes.data.length > 0) {
          validatedCoupon = promotionCodes.data[0].id
        } else {
          try {
            const coupon = await stripe.coupons.retrieve(couponCode)
            if (coupon && coupon.valid) {
              const promoCode = await stripe.promotionCodes.create({
                coupon: coupon.id,
                code: `${couponCode}_${Date.now()}`,
              })
              validatedCoupon = promoCode.id
            }
          } catch {
            return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 })
          }
        }
      } catch (e) {
        console.error("Coupon validation error:", e)
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 })
      }
    }

    const sessionConfig: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      payment_method_types: ["card"],
      mode: productType === "unlimited" ? "subscription" : "payment",
      ui_mode: "embedded",
      return_url: `${baseUrl}/checkout/complete?session_id={CHECKOUT_SESSION_ID}${contractSlug ? `&contract=${contractSlug}&return_generate=true` : ""}`,
      metadata: {
        user_id: user?.id || "",
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
      allow_promotion_codes: !validatedCoupon,
      ...(validatedCoupon && {
        discounts: [{ promotion_code: validatedCoupon }],
      }),
    }

    // Add customer if logged in, otherwise Stripe will collect email
    if (customerId) {
      sessionConfig.customer = customerId
    } else {
      if (productType !== "unlimited") {
        sessionConfig.customer_creation = "if_required"
      }
      if (customerEmail) {
        sessionConfig.customer_email = customerEmail
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Record pending payment if user is logged in
    if (user) {
      try {
        await upsertPayment({
          user_id: user.id,
          stripe_session_id: session.id,
          amount: product.price,
          product_type: productType,
          status: "pending",
          app_id: APP_ID,
        })
      } catch (e) {
        console.error("Failed to record payment:", e)
      }
    }

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error) {
    console.error("Checkout session error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
