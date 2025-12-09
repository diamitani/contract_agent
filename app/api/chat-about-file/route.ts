import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { streamGeminiChat } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const { fileId, message, context, history, analysis } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const analysisContext = analysis
      ? `
    
CONTRACT ANALYSIS SUMMARY:
- Contract Type: ${analysis.contract_type || "Unknown"}
- Parties: ${analysis.parties?.map((p: any) => `${p.name} (${p.role})`).join(", ") || "Not identified"}
- Summary: ${analysis.summary || "Not available"}
- Duration: ${analysis.duration || "Not specified"}
- Key Terms: ${analysis.key_terms?.join("; ") || "None identified"}
- Risks: ${analysis.risks?.join("; ") || "None identified"}
`
      : ""

    const systemPrompt = `You are an expert contract assistant helping users understand their legal documents. You have access to a contract document and its analysis. Answer questions clearly, accurately, and helpfully.

When answering:
- Be specific and reference actual content from the contract when possible
- Explain legal terms in plain language
- Point out relevant sections or clauses
- If something isn't clear in the contract, say so
- Warn about potential issues or things to watch out for
- Suggest questions they might want to ask a lawyer for complex issues

CONTRACT CONTENT:
${context?.slice(0, 8000) || "No contract content available."}
${analysisContext}

Remember: You are helping them understand their contract, not providing legal advice. For important decisions, always recommend consulting with a qualified attorney.`

    const messages = [
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    const stream = await streamGeminiChat({
      systemPrompt,
      messages,
      maxTokens: 1500,
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("Chat error:", error)
    return new Response("Chat failed: " + (error instanceof Error ? error.message : "Unknown error"), { status: 500 })
  }
}
