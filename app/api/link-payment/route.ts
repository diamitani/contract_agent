import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, customerId, productType } = await request.json()

    if (!userId || !productType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create or update user profile with subscription info
    const profileData: Record<string, unknown> = {
      user_id: userId,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    }

    if (productType === "unlimited") {
      profileData.subscription_status = "unlimited"
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
            product_type: productType,
            status: "completed",
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
