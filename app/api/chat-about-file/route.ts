import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { streamText } from "ai"

// Models with fallback
const MODELS = {
  primary: "openai/gpt-4o-mini",
  fallback: "google/gemini-2.0-flash",
} as const

const OPENAI_API_KEY =
  "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"

export async function POST(request: NextRequest) {
  try {
    const { fileId, message, context, history } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const systemPrompt = `You are a helpful contract analysis assistant. You have access to a contract document and should answer questions about it clearly and accurately. If you're unsure about something, say so. Here is the contract content for reference:\n\n${context?.slice(0, 10000) || "No contract content available."}`

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ]

    let result
    let modelUsed = "openai"

    try {
      result = streamText({
        model: MODELS.primary,
        messages,
        maxOutputTokens: 1000,
        temperature: 0.7,
      })
    } catch (openaiError) {
      console.log("[AI] OpenAI failed, falling back to Gemini:", openaiError)
      modelUsed = "gemini"
      result = streamText({
        model: MODELS.fallback,
        messages,
        maxOutputTokens: 1000,
        temperature: 0.7,
      })
    }

    console.log(`[AI] Chat using ${modelUsed}`)

    // Return streaming response
    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat error:", error)
    return new Response("Chat failed", { status: 500 })
  }
}
