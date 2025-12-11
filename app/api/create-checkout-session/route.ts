import { type NextRequest, NextResponse } from "next/server"
import { stripe, PRODUCTS, type ProductType } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { APP_ID } from "@/lib/constants"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { productType, contractSlug } = (await request.json()) as {
      productType: ProductType
      contractSlug?: string
    }

    if (!productType || !PRODUCTS[productType]) {
      return NextResponse.json({ error: "Invalid product type" }, { status: 400 })
    }

    const product = PRODUCTS[productType]

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          app_id: APP_ID,
        },
      })
      customerId = customer.id

      await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          email: user.email,
          stripe_customer_id: customerId,
        },
        { onConflict: "user_id" },
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000"

    // Create embedded checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: productType === "unlimited" ? "subscription" : "payment",
      ui_mode: "embedded",
      return_url: `${baseUrl}/checkout/complete?session_id={CHECKOUT_SESSION_ID}${contractSlug ? `&contract=${contractSlug}` : ""}`,
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
    })

    // Record pending payment
    try {
      await supabase.from("payments").insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: product.price,
        product_type: productType,
        status: "pending",
      })
    } catch (e) {
      console.error("Failed to record payment:", e)
    }

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error) {
    console.error("Checkout session error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
