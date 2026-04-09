import { type NextRequest, NextResponse } from "next/server"
import { generateWithFallback } from "@/lib/ai"

export async function POST(request: NextRequest) {
  try {
    const { contractName, contractType, description, fields } = await request.json()

    if (!contractName || !contractType) {
      return NextResponse.json({ error: "Missing contractName or contractType" }, { status: 400 })
    }

    const fieldsList = Array.isArray(fields)
      ? fields.map((f: { label: string; description?: string }) => `- ${f.label}${f.description ? `: ${f.description}` : ""}`).join("\n")
      : ""

    const prompt = `You are an expert contract attorney and legal analyst. Analyze the following contract type and provide a comprehensive educational breakdown.

Contract Name: ${contractName}
Contract Type: ${contractType}
Description: ${description || ""}
${fieldsList ? `\nKey Fields in This Contract:\n${fieldsList}` : ""}

Respond with a JSON object in this exact structure:
{
  "overview": "A clear 3-4 sentence explanation of what this contract is, who uses it, and why it matters. Write in plain English for non-lawyers.",
  "sections": [
    {
      "title": "Section name (e.g. Parties & Purpose, Compensation, Term & Termination)",
      "content": "1-2 sentences describing what this section covers in this specific contract type.",
      "analysis": "1-2 sentences of practical AI insight — what to watch for, negotiate, or ensure is included. Be specific to this contract type."
    }
  ]
}

Include 5-7 sections that are most relevant to a ${contractType}. Be specific to the music/entertainment industry context. Respond with ONLY the JSON object — no markdown, no code blocks, no extra text.`

    const { text, model } = await generateWithFallback({
      systemPrompt: "You are a legal contract expert. Always respond with valid JSON only.",
      userPrompt: prompt,
      maxOutputTokens: 1500,
      temperature: 0.3,
    })

    // Parse JSON from response
    let analysis: { overview: string; sections: Array<{ title: string; content: string; analysis: string }> }

    try {
      const cleaned = text
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim()
      const start = cleaned.indexOf("{")
      const end = cleaned.lastIndexOf("}")
      analysis = JSON.parse(cleaned.slice(start, end + 1))
    } catch {
      // Fallback structure if JSON parsing fails
      analysis = {
        overview: text.slice(0, 500),
        sections: [],
      }
    }

    return NextResponse.json({ analysis, model })
  } catch (error) {
    console.error("[analyze-template] Error:", error)
    return NextResponse.json(
      { error: "Analysis failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
