import { NextRequest, NextResponse } from "next/server"
import { generateChat } from "@/lib/ai"

/**
 * AI-powered chat assistant for helping users fill out contract forms
 * Uses conversational AI to guide users through complex legal forms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history, contractType, contractName, currentField, allFields } = body

    if (!message || !contractType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const systemPrompt = `You are an expert contract assistant helping users fill out a ${contractName || contractType} contract.

Your role is to:
- Guide users through filling out contract fields in a friendly, conversational way
- Explain complex legal terms in simple language
- Provide examples when helpful
- Ask clarifying questions if the user's input is unclear
- Suggest reasonable defaults or common practices when appropriate
- Be encouraging and professional
- NEVER provide actual legal advice - remind users to consult an attorney for legal guidance

Current field being discussed: ${currentField?.label || "General questions"}
${currentField?.description ? `Field description: ${currentField.description}` : ""}

Contract fields available: ${allFields?.map((f: any) => f.label).join(", ")}

Keep responses concise (2-3 sentences typically) and action-oriented.`

    const messages = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    messages.push({ role: "user" as const, content: message })

    const responseText = await generateChat({
      systemPrompt,
      messages,
      maxOutputTokens: 300,
      temperature: 0.8,
    })

    return NextResponse.json({
      success: true,
      response: responseText,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Chat Assistant] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate response",
        response:
          "I'm having trouble responding right now. Please try rephrasing your question or proceed with filling out the form.",
      },
      { status: 200 },
    )
  }
}
