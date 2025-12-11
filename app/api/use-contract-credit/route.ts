import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_status, contracts_remaining, contracts_generated")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Unlimited users can always generate
    if (profile.subscription_status === "unlimited") {
      await supabase
        .from("user_profiles")
        .update({
          contracts_generated: (profile.contracts_generated || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      return NextResponse.json({ success: true })
    }

    // Per-contract users need credits
    if (profile.subscription_status === "per_contract" && (profile.contracts_remaining || 0) > 0) {
      await supabase
        .from("user_profiles")
        .update({
          contracts_remaining: (profile.contracts_remaining || 0) - 1,
          contracts_generated: (profile.contracts_generated || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      return NextResponse.json({
        success: true,
        contractsRemaining: (profile.contracts_remaining || 0) - 1,
      })
    }

    return NextResponse.json({ error: "No credits available. Please purchase a plan." }, { status: 403 })
  } catch (error) {
    console.error("Use credit error:", error)
    return NextResponse.json({ error: "Failed to use credit" }, { status: 500 })
  }
}
