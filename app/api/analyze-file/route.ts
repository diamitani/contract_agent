import { type NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"
import { getCurrentUser } from "@/lib/auth/current-user"
import { getUploadedFileById, getUserProfile, updateUploadedFile } from "@/lib/cosmos/store"
import { generateWithFallback } from "@/lib/ai"

async function extractTextFromFile(buffer: ArrayBuffer, contentType: string, fileName: string): Promise<string> {
  const fileNameLower = fileName.toLowerCase()

  // Handle DOCX files
  if (fileNameLower.endsWith(".docx") || contentType.includes("openxmlformats-officedocument")) {
    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(buffer)
      const documentXml = await zipContent.file("word/document.xml")?.async("string")
      if (documentXml) {
        const text = documentXml
          .replace(/<\?[^?]*\?>/g, "")
          .replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, "$1 ")
          .replace(/<\/w:p>/g, "\n\n")
          .replace(/<w:br[^>]*\/>/g, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
        if (text.length > 100) return text
      }
    } catch (e) {
      console.error("[v0] DOCX extraction failed:", e)
    }
  }

  // Handle PDF - basic extraction
  if (fileNameLower.endsWith(".pdf") || contentType.includes("pdf")) {
    try {
      const uint8Array = new Uint8Array(buffer)
      const text = new TextDecoder("latin1").decode(uint8Array)
      const extractedParts: string[] = []

      const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g
      let match
      while ((match = btEtRegex.exec(text)) !== null) {
        const textBlock = match[1]
        const tjMatches = textBlock.match(/$$([^)]+)$$\s*Tj/g) || []
        for (const tj of tjMatches) {
          const content = tj.match(/$$([^)]+)$$/)?.[1] || ""
          if (content && content.length > 1 && /[a-zA-Z]/.test(content)) {
            extractedParts.push(content)
          }
        }
      }

      if (extractedParts.length > 10) {
        return extractedParts.join(" ").replace(/\s+/g, " ").trim()
      }
    } catch (e) {
      console.error("[v0] PDF extraction failed:", e)
    }
  }

  // Handle plain text
  if (fileNameLower.endsWith(".txt") || contentType.includes("text")) {
    return new TextDecoder("utf-8").decode(buffer)
  }

  // Fallback
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
  return text
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000)
}

export async function POST(request: NextRequest) {
  try {
    const { fileId, storagePath } = await request.json()

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check subscription
    const profile = await getUserProfile(user.id)

    if (profile?.subscription_status !== "unlimited") {
      return NextResponse.json(
        {
          error: "AI Contract Analysis requires an Unlimited Contracts subscription",
          requiresSubscription: true,
        },
        { status: 403 },
      )
    }

    // Get file info
    const fileInfo = await getUploadedFileById(user.id, fileId)
    if (!fileInfo) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Update status
    await updateUploadedFile(user.id, fileId, { analysis_status: "analyzing" })

    // Extract text from document
    let extractedText = fileInfo?.extracted_text || ""

    if (!extractedText || extractedText.length < 100) {
      try {
        const response = await fetch(storagePath)
        const contentType = response.headers.get("content-type") || ""
        const buffer = await response.arrayBuffer()
        extractedText = await extractTextFromFile(buffer, contentType, fileInfo?.file_name || "document")
        console.log(`[v0] Extracted ${extractedText.length} characters`)
      } catch (e) {
        console.error("Error fetching file:", e)
      }
    }

    const analysisPrompt = `You are a contract analysis expert. Analyze the following contract document and provide a comprehensive overview.

CONTRACT TEXT:
${extractedText.slice(0, 12000)}

Provide your analysis as a JSON object with this structure:
{
  "contract_type": "specific type of contract (e.g., Recording Agreement, Management Contract, Licensing Agreement)",
  "parties": [
    {"name": "exact name from document", "role": "their role (e.g., Artist, Label, Manager)"}
  ],
  "summary": "A clear 3-4 sentence executive summary explaining what this contract is about, who it's between, and its main purpose",
  "key_terms": ["list of 5-8 important terms, clauses, or provisions"],
  "obligations": [
    {"party": "party name", "obligation": "specific obligation they must fulfill"}
  ],
  "rights_granted": ["specific rights being granted, transferred, or licensed"],
  "compensation": {
    "description": "overview of payment structure",
    "details": ["specific payment terms, rates, royalties, advances, etc."]
  },
  "duration": "contract term length and any renewal provisions",
  "termination": ["conditions under which the contract can be terminated"],
  "risks": ["potential concerns or areas that may need attention"],
  "dates": ["important dates, deadlines, or timeframes mentioned"]
}

IMPORTANT:
- Extract ACTUAL names, amounts, and dates from the document
- Be specific - don't use placeholders like "Party A" if real names are available
- Respond with ONLY the JSON object, no markdown code blocks or explanations`

    let analysis = {
      contract_type: "Document",
      parties: [] as Array<{ name: string; role: string }>,
      summary: "Analysis pending",
      key_terms: [] as string[],
      obligations: [] as Array<{ party: string; obligation: string }>,
      rights_granted: [] as string[],
      compensation: { description: "", details: [] as string[] },
      duration: "Not specified",
      termination: [] as string[],
      risks: [] as string[],
      dates: [] as string[],
    }

    let usedModel = "unknown"
    try {
      const { text, model } = await generateWithFallback({
        systemPrompt: "You are a contract analysis expert. Always respond with valid JSON only.",
        userPrompt: analysisPrompt,
        maxOutputTokens: 3000,
        temperature: 0.2,
      })
      usedModel = model

      const cleaned = text.trim().replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim()
      const firstBrace = cleaned.indexOf("{")
      const lastBrace = cleaned.lastIndexOf("}")

      if (firstBrace !== -1 && lastBrace > firstBrace) {
        analysis = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
        console.log(`[analyze-file] Parsed successfully via ${model}`)
      }
    } catch (err) {
      console.error("[analyze-file] AI error:", err)
      analysis.summary = `Document contains ${extractedText.length} characters. Manual review recommended.`
      analysis.risks = ["Automated analysis failed — please review manually"]
    }

    // Ensure all fields exist
    analysis = {
      contract_type: analysis.contract_type || "Unknown",
      parties: Array.isArray(analysis.parties) ? analysis.parties : [],
      summary: analysis.summary || "No summary available",
      key_terms: Array.isArray(analysis.key_terms) ? analysis.key_terms : [],
      obligations: Array.isArray(analysis.obligations) ? analysis.obligations : [],
      rights_granted: Array.isArray(analysis.rights_granted) ? analysis.rights_granted : [],
      compensation: analysis.compensation || { description: "", details: [] },
      duration: analysis.duration || "Not specified",
      termination: Array.isArray(analysis.termination) ? analysis.termination : [],
      risks: Array.isArray(analysis.risks) ? analysis.risks : [],
      dates: Array.isArray(analysis.dates) ? analysis.dates : [],
    }

    // Save results
    await updateUploadedFile(user.id, fileId, {
      analysis_status: "completed",
      analysis_result: analysis,
      extracted_text: extractedText.slice(0, 50000),
    })

    return NextResponse.json({ analysis, model: usedModel })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      { error: "Analysis failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
