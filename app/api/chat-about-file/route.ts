import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

const OPENAI_API_KEY =
  "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"
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""

const openai = createOpenAI({ apiKey: OPENAI_API_KEY })
const google = createGoogleGenerativeAI({ apiKey: GOOGLE_API_KEY })

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
      { role: "system" as const, content: systemPrompt },
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ]

    try {
      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages,
        maxTokens: 1500,
        temperature: 0.7,
      })

      console.log("[AI] Chat using OpenAI")
      return result.toTextStreamResponse()
    } catch (openaiError) {
      console.log("[AI] OpenAI failed, trying Gemini:", openaiError)

      if (GOOGLE_API_KEY) {
        const result = streamText({
          model: google("gemini-2.0-flash"),
          messages,
          maxTokens: 1500,
          temperature: 0.7,
        })

        console.log("[AI] Chat using Gemini")
        return result.toTextStreamResponse()
      }

      throw openaiError
    }
  } catch (error) {
    console.error("Chat error:", error)
    return new Response("Chat failed: " + (error instanceof Error ? error.message : "Unknown error"), { status: 500 })
  }
}
