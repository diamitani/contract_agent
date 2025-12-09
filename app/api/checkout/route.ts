import { type NextRequest, NextResponse } from "next/server"
import { stripe, PRODUCTS, type ProductType, type Stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

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
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Update profile with Stripe customer ID
      await supabase.from("user_profiles").upsert({
        user_id: user.id,
        email: user.email,
        stripe_customer_id: customerId,
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000"

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card"],
      mode: productType === "unlimited" ? "subscription" : "payment",
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}${contractSlug ? `&contract=${contractSlug}` : ""}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        user_id: user.id,
        product_type: productType,
        contract_slug: contractSlug || "",
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

    // Record pending payment
    await supabase.from("payments").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      amount: product.price,
      product_type: productType,
      status: "pending",
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
