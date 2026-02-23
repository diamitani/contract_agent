import { NextResponse } from "next/server"
import { ensureUserProfile, isCosmosConfigured } from "@/lib/cosmos/store"
import { getCurrentUser } from "@/lib/auth/current-user"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({
        canGenerate: false,
        status: "free",
        contractsRemaining: 0,
      })
    }

    if (!isCosmosConfigured()) {
      return NextResponse.json({
        canGenerate: false,
        status: "free",
        contractsRemaining: 0,
      })
    }

    const profile = await ensureUserProfile(user)

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
