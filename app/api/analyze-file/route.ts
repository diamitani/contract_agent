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

        if (text.length > 100) {
          return text
        }
      }
    } catch (zipError) {
      console.error("[v0] DOCX extraction failed:", zipError)
    }
  }

  // Handle PDF files - improved extraction
  if (fileNameLower.endsWith(".pdf") || contentType.includes("pdf")) {
    try {
      const uint8Array = new Uint8Array(buffer)
      const text = new TextDecoder("latin1").decode(uint8Array)

      const extractedParts: string[] = []

      // Method 1: Extract text between BT and ET markers (text objects)
      const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g
      let match
      while ((match = btEtRegex.exec(text)) !== null) {
        const textBlock = match[1]
        // Extract text from Tj and TJ operators
        const tjMatches = textBlock.match(/$$([^)]+)$$\s*Tj/g) || []
        for (const tj of tjMatches) {
          const content = tj.match(/$$([^)]+)$$/)?.[1] || ""
          if (content && content.length > 1 && /[a-zA-Z]/.test(content)) {
            extractedParts.push(content)
          }
        }
      }

      // Method 2: Look for readable strings
      const stringRegex = /$$([A-Za-z][A-Za-z0-9\s,.'"-]{3,})$$/g
      while ((match = stringRegex.exec(text)) !== null) {
        const content = match[1].trim()
        if (content.length > 3 && /[a-zA-Z]{2,}/.test(content)) {
          extractedParts.push(content)
        }
      }

      if (extractedParts.length > 10) {
        return extractedParts.join(" ").replace(/\s+/g, " ").trim()
      }

      // Method 3: Just find any readable text sequences
      const readableText =
        text
          .replace(/[^\x20-\x7E\n]/g, " ")
          .replace(/\s+/g, " ")
          .match(/[A-Za-z][A-Za-z0-9\s,.'"-]{10,}/g) || []

      if (readableText.length > 5) {
        return readableText.join(" ").trim()
      }
    } catch (pdfError) {
      console.error("[v0] PDF extraction failed:", pdfError)
    }
  }

  // Handle plain text files
  if (fileNameLower.endsWith(".txt") || contentType.includes("text")) {
    return new TextDecoder("utf-8").decode(buffer)
  }

  // Handle DOC files (older Word format)
  if (fileNameLower.endsWith(".doc") || contentType.includes("msword")) {
    try {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
      const cleanText =
        text
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ")
          .replace(/[^\x20-\x7E\n\r\t\u00A0-\u024F]/g, " ")
          .match(/[A-Za-z][A-Za-z0-9\s,.'"-]{5,}/g) || []

      return cleanText.join(" ").replace(/\s+/g, " ").trim()
    } catch (docError) {
      console.error("[v0] DOC extraction failed:", docError)
    }
  }

  // Fallback: extract any readable text
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
  const readable = text
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return readable.slice(0, 15000)
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

    // Get file info
    const { data: fileInfo } = await supabase
      .from("uploaded_files")
      .select("file_name, file_type")
      .eq("id", fileId)
      .single()

    // Update status
    await supabase
      .from("uploaded_files")
      .update({ analysis_status: "analyzing" })
      .eq("id", fileId)
      .eq("user_id", user.id)

    // Fetch and extract text
    let extractedText = ""

    try {
      const response = await fetch(storagePath)
      const contentType = response.headers.get("content-type") || ""
      const buffer = await response.arrayBuffer()

      extractedText = await extractTextFromFile(buffer, contentType, fileInfo?.file_name || storagePath)

      console.log(`[v0] Extracted ${extractedText.length} characters from ${fileInfo?.file_name}`)

      // If extraction failed or got gibberish, note it
      if (extractedText.length < 100 || !/[a-zA-Z]{3,}/.test(extractedText)) {
        extractedText =
          "Unable to extract readable text from this file format. The document may be scanned or use a format that requires OCR."
      }
    } catch (fetchError) {
      console.error("Error fetching file:", fetchError)
      extractedText = "Unable to fetch file content."
    }

    const systemPrompt = `You are an expert legal contract analyst specializing in entertainment, music, and business contracts. Analyze the contract text thoroughly and extract ALL specific details.

IMPORTANT: Extract ACTUAL names, dates, amounts, and terms from the document - do not use placeholders like "Party A" unless the contract itself uses those terms.

Your analysis MUST include specific details from the contract:

1. **Contract Type**: Identify the exact type (Recording Agreement, Producer Contract, Management Agreement, NDA, etc.)

2. **Parties**: List EVERY party with their ACTUAL names as written in the contract and their role:
   - Look for signature blocks, "between" clauses, "hereinafter referred to as" phrases
   - Extract company names, individual names, and their designated roles

3. **Summary**: Write a clear 3-4 sentence summary explaining:
   - What this contract is for
   - Who the main parties are
   - What the key exchange/deal is (what each party gives/gets)

4. **Key Terms**: Extract specific numbers, percentages, and defined terms:
   - Royalty rates (e.g., "15% of net receipts")
   - Payment amounts (e.g., "$5,000 advance")
   - Specific definitions from the contract

5. **Obligations**: What SPECIFIC actions must each party take?

6. **Rights Granted**: What specific rights are being transferred or licensed?

7. **Compensation**: Extract ALL financial terms:
   - Advances, royalties, fees, percentages
   - Payment schedules and conditions

8. **Duration**: Exact term length, start date, renewal options

9. **Termination**: How can the contract end? What are the exit conditions?

10. **Risks**: Identify concerning clauses, one-sided terms, or missing protections

11. **Important Dates**: Any deadlines, effective dates, or milestones mentioned

Respond ONLY in valid JSON format:
{
  "contract_type": "Specific type of contract",
  "parties": [
    {"name": "Actual name from contract", "role": "Their specific role"}
  ],
  "summary": "3-4 sentence summary with actual details from the contract",
  "key_terms": ["Specific term: exact definition/value from contract"],
  "obligations": [
    {"party": "Party name", "obligation": "Specific obligation"}
  ],
  "rights_granted": ["Specific right being granted"],
  "compensation": {
    "description": "Overview of the deal structure",
    "details": ["$X advance", "Y% royalty", etc.]
  },
  "duration": "Exact term with any renewal provisions",
  "termination": ["Specific termination clause"],
  "risks": ["Specific concern with explanation"],
  "dates": ["Specific date and what it's for"]
}`

    const { text: analysisText, model } = await generateWithFallback({
      systemPrompt,
      userPrompt: `Analyze this contract and extract all specific details. Do not use generic placeholders - extract actual names, amounts, and terms:\n\n${extractedText.slice(0, 15000)}`,
      maxOutputTokens: 4000,
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
      // Find JSON in response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("Error parsing analysis:", parseError)
      // Try to extract what we can from the response
      analysis.summary = analysisText.slice(0, 500)
    }

    // Save results
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
