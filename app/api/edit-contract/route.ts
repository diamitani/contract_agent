import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/ai"
import { getCurrentUser } from "@/lib/auth/current-user"

export async function POST(request: NextRequest) {
  try {
    const { contractText, instruction, history } = await request.json()

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!contractText || !instruction) {
      return NextResponse.json({ error: "Missing contractText or instruction" }, { status: 400 })
    }

    // Build conversation context from prior edits
    const historyContext =
      history && history.length > 0
        ? `\nPREVIOUS EDIT INSTRUCTIONS AND RESULTS:\n` +
          history
            .map((h: { instruction: string; result: string }) => `User: ${h.instruction}\nResult: (applied)`)
            .join("\n") +
          "\n"
        : ""

    const prompt = `You are an expert contract editor. You will receive a contract document and an edit instruction. Apply the instruction precisely and return the COMPLETE updated contract text.

EDIT INSTRUCTION: ${instruction}
${historyContext}
CONTRACT TEXT:
${contractText}

Rules:
- Return the COMPLETE contract text with the edit applied — do not truncate or summarize
- Only change what the instruction asks for; preserve all other language exactly
- If the instruction asks to add a clause, insert it in the most logical location
- If the instruction is ambiguous, make the most reasonable interpretation and note it briefly at the top in a comment like: [EDIT NOTE: ...]
- Do not wrap the output in markdown code blocks
- Return ONLY the contract text (with optional EDIT NOTE at top)`

    const { text } = await generateWithFallback({
      systemPrompt:
        "You are a precise contract editor. You return complete, untruncated contract text with edits applied. Never summarize or shorten the contract.",
      userPrompt: prompt,
      maxOutputTokens: 8000,
      temperature: 0.2,
    })

    return NextResponse.json({ editedText: text.trim() })
  } catch (error) {
    console.error("[edit-contract] Error:", error)
    return NextResponse.json(
      { error: "Edit failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
