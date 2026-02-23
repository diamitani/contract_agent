import { NextResponse } from "next/server"
import { consumeContractCredit, getUserProfile, isCosmosConfigured } from "@/lib/cosmos/store"
import { getCurrentUser } from "@/lib/auth/current-user"

export async function POST() {
  try {
    if (!isCosmosConfigured()) {
      return NextResponse.json({ error: "Cosmos DB is not configured" }, { status: 500 })
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await getUserProfile(user.id)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const result = await consumeContractCredit(user.id)
    if (result.success) {
      return NextResponse.json({ success: true, contractsRemaining: result.contractsRemaining })
    }

    return NextResponse.json({ error: "No credits available. Please purchase a plan." }, { status: 403 })
  } catch (error) {
    console.error("Use credit error:", error)
    return NextResponse.json({ error: "Failed to use credit" }, { status: 500 })
  }
}
