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

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("subscription_status, contracts_remaining, contracts_generated")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Error fetching profile:", error)
    }

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

    // Only paying users can generate
    const canGenerate =
      profile.subscription_status === "unlimited" ||
      (profile.subscription_status === "per_contract" && (profile.contracts_remaining || 0) > 0)

    return NextResponse.json({
      canGenerate,
      status: profile.subscription_status || "free",
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
      { status: 200 },
    )
  }
}
