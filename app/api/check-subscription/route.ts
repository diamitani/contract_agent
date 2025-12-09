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
        freeContractAvailable: false,
      })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_status, contracts_remaining, contracts_generated, last_free_contract_at")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      // Create profile if it doesn't exist
      await supabase.from("user_profiles").insert({
        user_id: user.id,
        email: user.email,
      })

      return NextResponse.json({
        canGenerate: true,
        status: "free",
        contractsRemaining: 0,
        freeContractAvailable: true,
      })
    }

    const now = new Date()
    const lastFreeContract = profile.last_free_contract_at ? new Date(profile.last_free_contract_at) : null

    // Check if it's a new month since last free contract
    const isNewMonth =
      !lastFreeContract ||
      lastFreeContract.getMonth() !== now.getMonth() ||
      lastFreeContract.getFullYear() !== now.getFullYear()

    const freeContractAvailable = isNewMonth

    const canGenerate =
      profile.subscription_status === "unlimited" ||
      (profile.subscription_status === "per_contract" && profile.contracts_remaining > 0) ||
      freeContractAvailable

    return NextResponse.json({
      canGenerate,
      status: profile.subscription_status || "free",
      contractsRemaining: profile.contracts_remaining || 0,
      contractsGenerated: profile.contracts_generated || 0,
      freeContractAvailable,
    })
  } catch (error) {
    console.error("Check subscription error:", error)
    return NextResponse.json(
      {
        canGenerate: false,
        status: "free",
        contractsRemaining: 0,
        freeContractAvailable: false,
      },
      { status: 500 },
    )
  }
}
