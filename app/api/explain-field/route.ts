import { NextRequest, NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fieldName, fieldLabel, fieldDescription, contractType } = body

    if (!fieldLabel) {
      return NextResponse.json({ error: "No field information provided" }, { status: 400 })
    }

    const systemPrompt = `You are a helpful legal assistant explaining contract form fields in simple, easy-to-understand language.

Your explanations should:
- Be concise (2-3 sentences maximum)
- Use plain language, not legal jargon
- Explain WHY this information is important
- Give a practical example when helpful
- Be encouraging and helpful in tone`

    const userPrompt = `Explain this contract field in simple terms:

Field Name: ${fieldLabel}
${fieldDescription ? `Description: ${fieldDescription}` : ""}
Contract Type: ${contractType}

Provide a brief, friendly explanation of what this field is for and why it matters.`

    const result = await generateWithFallback({
      systemPrompt,
      userPrompt,
      maxOutputTokens: 150,
      temperature: 0.7,
    })

    return NextResponse.json({
      success: true,
      explanation: result.text,
      field: fieldLabel,
    })
  } catch (error) {
    console.error("[Explain Field] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate explanation",
        explanation:
          "This field helps define important details in your contract. Fill it out with accurate information for the best results.",
      },
      { status: 200 },
    )
  }
}
