import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateWithFallback } from "@/lib/ai"
import JSZip from "jszip"

async function extractTextFromFile(buffer: ArrayBuffer, contentType: string, fileName: string): Promise<string> {
  const fileNameLower = fileName.toLowerCase()

  // Handle DOCX files (ZIP containing XML)
  if (fileNameLower.endsWith(".docx") || contentType.includes("openxmlformats-officedocument")) {
    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(buffer)

      // Get the main document content
      const documentXml = await zipContent.file("word/document.xml")?.async("string")
      if (documentXml) {
        // Extract text from XML, removing all tags
        const text = documentXml
          // Remove XML declaration and processing instructions
          .replace(/<\?[^?]*\?>/g, "")
          // Extract text from w:t tags (Word text elements)
          .replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, "$1")
          // Handle paragraph breaks
          .replace(/<\/w:p>/g, "\n\n")
          // Handle line breaks
          .replace(/<w:br[^>]*\/>/g, "\n")
          // Remove all remaining XML tags
          .replace(/<[^>]+>/g, "")
          // Decode HTML entities
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          // Clean up whitespace
          .replace(/\n{3,}/g, "\n\n")
          .trim()

        return text
      }
    } catch (zipError) {
      console.error("[v0] DOCX extraction failed:", zipError)
    }
  }

  // Handle DOC files (older Word format) - basic text extraction
  if (fileNameLower.endsWith(".doc") || contentType.includes("msword")) {
    try {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
      // Try to extract readable text from binary
      const cleanText = text
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
        .replace(/[^\x20-\x7E\n\r\t\u00A0-\u024F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      return cleanText
    } catch (docError) {
      console.error("[v0] DOC extraction failed:", docError)
    }
  }

  // Handle PDF files - use pdf-parse style extraction
  if (fileNameLower.endsWith(".pdf") || contentType.includes("pdf")) {
    try {
      const uint8Array = new Uint8Array(buffer)
      const text = new TextDecoder("utf-8", { fatal: false }).decode(uint8Array)

      // Extract text between BT and ET markers (text objects in PDF)
      const textParts: string[] = []

      // Method 1: Look for text in parentheses after text operators
      const parenMatches = text.matchAll(/$$([^)\\]*(?:\\.[^)\\]*)*)$$/g)
      for (const match of parenMatches) {
        const content = match[1]
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\\\\/g, "\\")

        // Only keep if it has readable content
        if (content.length > 1 && /[a-zA-Z]{2,}/.test(content)) {
          textParts.push(content)
        }
      }

      // Method 2: Look for hex strings
      const hexMatches = text.matchAll(/<([0-9A-Fa-f]+)>/g)
      for (const match of hexMatches) {
        try {
          const hex = match[1]
          if (hex.length % 2 === 0 && hex.length >= 4) {
            let decoded = ""
            for (let i = 0; i < hex.length; i += 2) {
              const charCode = Number.parseInt(hex.substr(i, 2), 16)
              if (charCode >= 32 && charCode <= 126) {
                decoded += String.fromCharCode(charCode)
              }
            }
            if (decoded.length > 2 && /[a-zA-Z]{2,}/.test(decoded)) {
              textParts.push(decoded)
            }
          }
        } catch {}
      }

      if (textParts.length > 0) {
        // Join and clean up the extracted text
        return textParts
          .join(" ")
          .replace(/\s+/g, " ")
          .replace(/([.!?])\s*/g, "$1\n\n")
          .trim()
      }

      // Fallback: just extract any printable ASCII
      return text
        .replace(/[^\x20-\x7E\n\r]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 15000)
    } catch (pdfError) {
      console.error("[v0] PDF extraction failed:", pdfError)
    }
  }

  // Handle plain text files
  if (fileNameLower.endsWith(".txt") || contentType.includes("text")) {
    return new TextDecoder("utf-8").decode(buffer)
  }

  // Fallback: try to extract any readable text
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000)
}

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

    // Get file info for the filename
    const { data: fileInfo } = await supabase
      .from("uploaded_files")
      .select("file_name, file_type")
      .eq("id", fileId)
      .single()

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
      const buffer = await response.arrayBuffer()

      extractedText = await extractTextFromFile(buffer, contentType, fileInfo?.file_name || storagePath)

      console.log(`[v0] Extracted ${extractedText.length} characters from ${fileInfo?.file_name}`)
    } catch (fetchError) {
      console.error("Error fetching file:", fetchError)
      extractedText = "Unable to extract text from file."
    }

    const systemPrompt = `You are an expert legal contract analyst. Analyze the following contract thoroughly and provide a comprehensive breakdown.

Your analysis MUST include:
1. **Contract Type**: What kind of contract is this? (e.g., Employment Agreement, NDA, Recording Contract, Production Agreement, etc.)
2. **Parties Involved**: List ALL parties mentioned with their roles. Look for names, company names, "Party A", "Party B", "Artist", "Producer", "Label", etc.
3. **Summary**: A clear 3-4 sentence overview of what this contract is about, its main purpose, and what it accomplishes
4. **Key Terms**: Important definitions, percentages, payment amounts, royalty rates, or specific terms defined in the contract
5. **Obligations**: What each party is required to do under this agreement
6. **Rights Granted**: What rights are being transferred, licensed, or retained by each party
7. **Compensation**: Any payment terms, advances, royalties, percentages, or financial arrangements
8. **Duration**: Contract length, term, renewal provisions, or expiration dates
9. **Termination**: How can the contract be ended? What are the exit clauses?
10. **Risks & Concerns**: Potential red flags, unfavorable terms, or areas that might need negotiation
11. **Important Dates**: Any deadlines, effective dates, or time-sensitive provisions

IMPORTANT: If you cannot find specific information, provide your best interpretation based on the document type. Do NOT leave fields empty.

Respond ONLY in this exact JSON format:
{
  "contract_type": "Type of contract",
  "parties": [
    {"name": "Party name or description", "role": "Their role in the contract"}
  ],
  "summary": "Comprehensive 3-4 sentence summary of the contract",
  "key_terms": ["term1: explanation", "term2: explanation"],
  "obligations": [
    {"party": "Party name", "obligation": "What they must do"}
  ],
  "rights_granted": ["Right 1", "Right 2"],
  "compensation": {
    "description": "Overview of payment structure",
    "details": ["Specific payment detail 1", "Detail 2"]
  },
  "duration": "Contract term and renewal info",
  "termination": ["Termination clause 1", "Clause 2"],
  "risks": ["Risk or concern 1", "Risk 2"],
  "dates": ["Important date 1", "Date 2"]
}`

    const { text: analysisText, model } = await generateWithFallback({
      systemPrompt,
      userPrompt: `Analyze this contract document thoroughly. Extract all relevant information about parties, terms, obligations, and potential concerns:\n\n${extractedText.slice(0, 12000)}`,
      maxOutputTokens: 3000,
      temperature: 0.2,
    })

    console.log(`[AI] Analysis completed using ${model}`)

    let analysis = {
      contract_type: "Unknown",
      parties: [],
      summary: "Analysis could not be completed.",
      key_terms: [],
      obligations: [],
      rights_granted: [],
      compensation: { description: "", details: [] },
      duration: "Not specified",
      termination: [],
      risks: [],
      dates: [],
    }

    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
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

    return NextResponse.json({ analysis, extractedText: extractedText.slice(0, 5000), model })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      { error: "Analysis failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
