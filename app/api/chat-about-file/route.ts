import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateChat } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const { fileId, message, context, history, analysis } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_status")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile?.subscription_status !== "active") {
      return NextResponse.json(
        {
          error: "Contract chat assistant requires an Unlimited Contracts subscription",
          requiresSubscription: true,
        },
        { status: 403 },
      )
    }

    const analysisContext = analysis
      ? `
CONTRACT ANALYSIS SUMMARY:
- Contract Type: ${analysis.contract_type || "Unknown"}
- Parties: ${analysis.parties?.map((p: any) => `${p.name} (${p.role})`).join(", ") || "Not identified"}
- Summary: ${analysis.summary || "Not available"}
- Duration: ${analysis.duration || "Not specified"}
- Compensation: ${analysis.compensation?.description || "Not specified"}
- Key Terms: ${analysis.key_terms?.slice(0, 5).join("; ") || "None identified"}
- Risks: ${analysis.risks?.slice(0, 5).join("; ") || "None identified"}
- Rights Granted: ${analysis.rights_granted?.slice(0, 5).join("; ") || "None specified"}
`
      : ""

    const systemPrompt = `You are an expert contract assistant helping users understand their legal documents. You have access to a contract document and its analysis.

When answering:
- Be specific and reference actual content from the contract
- Explain legal terms in plain language
- Point out relevant sections or clauses when applicable
- If something isn't clear in the contract, say so honestly
- Warn about potential issues or things to watch out for
- For complex legal questions, recommend consulting with a qualified attorney

CONTRACT CONTENT:
${context?.slice(0, 10000) || "No contract content available."}
${analysisContext}

Provide helpful, accurate, and clear answers about this contract.`

    const messages = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    // Add the current user message
    messages.push({ role: "user" as const, content: message })

    const responseText = await generateChat({
      systemPrompt,
      messages,
      maxOutputTokens: 1500,
      temperature: 0.7,
    })

    return NextResponse.json({ response: responseText })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: "Chat failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
