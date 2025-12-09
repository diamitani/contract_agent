import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const OPENAI_API_KEY =
  "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"

export async function POST(request: NextRequest) {
  try {
    const { fileId, storagePath } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update status to analyzing
    await supabase
      .from("uploaded_files")
      .update({ analysis_status: "analyzing" })
      .eq("id", fileId)
      .eq("user_id", user.id)

    // Fetch the file content
    let extractedText = ""

    try {
      const response = await fetch(storagePath)
      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("text") || storagePath.endsWith(".txt")) {
        extractedText = await response.text()
      } else {
        // For PDFs and other formats, we'll use a simple extraction
        // In production, you'd want to use a proper PDF parsing library
        const buffer = await response.arrayBuffer()
        const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
        // Extract readable text portions
        extractedText = text
          .replace(/[^\x20-\x7E\n\r\t]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 15000) // Limit for API
      }
    } catch (fetchError) {
      console.error("Error fetching file:", fetchError)
      extractedText = "Unable to extract text from file."
    }

    // Analyze with OpenAI
    const analysisResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a contract analysis expert. Analyze the following contract and provide:
1. A brief summary (2-3 sentences)
2. Key terms and definitions found
3. Potential risks or concerns
4. Key obligations for each party
5. Important dates or deadlines mentioned

Respond in JSON format:
{
  "summary": "...",
  "key_terms": ["term1", "term2"],
  "risks": ["risk1", "risk2"],
  "obligations": ["obligation1", "obligation2"],
  "dates": ["date1", "date2"]
}`,
          },
          {
            role: "user",
            content: `Analyze this contract:\n\n${extractedText.slice(0, 12000)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    const analysisData = await analysisResponse.json()
    let analysis = {
      summary: "Analysis could not be completed.",
      key_terms: [],
      risks: [],
      obligations: [],
      dates: [],
    }

    try {
      const content = analysisData.choices?.[0]?.message?.content || ""
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("Error parsing analysis:", parseError)
    }

    // Save analysis results
    await supabase
      .from("uploaded_files")
      .update({
        analysis_status: "completed",
        analysis_result: analysis,
        extracted_text: extractedText.slice(0, 50000),
      })
      .eq("id", fileId)
      .eq("user_id", user.id)

    return NextResponse.json({ analysis, extractedText: extractedText.slice(0, 5000) })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}
