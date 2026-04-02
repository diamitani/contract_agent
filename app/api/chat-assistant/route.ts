import { NextRequest, NextResponse } from "next/server"
import { generateChat } from "@/lib/ai"

/**
 * AI-powered chat assistant for helping users fill out contract forms
 * Uses conversational AI to guide users through complex legal forms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history, contractType, contractName, currentField, allFields, formData } = body

    if (!message || !contractType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Build a summary of what the user has already filled in
    const filledEntries = allFields
      ?.filter((f: any) => formData?.[f.id])
      .map((f: any) => `- ${f.label}: ${formData[f.id]}`)
      .join("\n") || ""

    const emptyFields = allFields
      ?.filter((f: any) => !formData?.[f.id])
      .map((f: any) => f.label)
      .join(", ") || ""

    const systemPrompt = `You are an expert contract assistant helping a user fill out a ${contractName || contractType} contract.

CONTRACT DATA SO FAR:
${filledEntries || "(Nothing filled in yet)"}

FIELDS STILL NEEDED: ${emptyFields || "All fields complete"}

CURRENT FIELD: ${currentField?.label || "General questions"}${currentField?.description ? ` — ${currentField.description}` : ""}

Your job:
- Answer questions by referencing the ACTUAL data already entered above — use real names, dates, and amounts, never placeholders
- When the user provides a value, confirm it clearly and note which field it fills
- Suggest what to enter for the current field based on context from already-filled fields
- Explain legal terms in plain language
- If a field is unclear, ask one focused clarifying question
- Keep responses to 2-3 sentences unless more detail is genuinely needed
- Do NOT give legal advice — recommend an attorney for legal questions`

    const messages = (history || []).map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    messages.push({ role: "user" as const, content: message })

    const responseText = await generateChat({
      systemPrompt,
      messages,
      maxOutputTokens: 600,
      temperature: 0.7,
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
