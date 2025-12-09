import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        canGenerate: false,
        status: "free",
        contractsRemaining: 0,
      })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_status, contracts_remaining, contracts_generated")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      // Create profile if it doesn't exist
      await supabase.from("user_profiles").insert({
        user_id: user.id,
        email: user.email,
      })

      return NextResponse.json({
        canGenerate: false,
        status: "free",
        contractsRemaining: 0,
      })
    }

    const canGenerate =
      profile.subscription_status === "unlimited" ||
      (profile.subscription_status === "per_contract" && profile.contracts_remaining > 0)

    return NextResponse.json({
      canGenerate,
      status: profile.subscription_status,
      contractsRemaining: profile.contracts_remaining || 0,
      contractsGenerated: profile.contracts_generated || 0,
    })
  } catch (error) {
    console.error("Check subscription error:", error)
    return NextResponse.json(
      {
        canGenerate: false,
        status: "free",
        contractsRemaining: 0,
      },
      { status: 500 },
    )
  }
}
