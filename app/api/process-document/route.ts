import type { NextRequest } from "next/server"
import { generateWithFallback } from "@/lib/ai"
import JSZip from "jszip"

const DOCUMENT_ASSISTANT_ID = "asst_z9YqJ8Vb8zaRuv6PXVoiU3UB"

async function extractRawText(buffer: ArrayBuffer, fileName: string): Promise<string> {
  const fileNameLower = fileName.toLowerCase()

  // Handle DOCX files (ZIP containing XML)
  if (fileNameLower.endsWith(".docx")) {
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

        if (text.length > 100) {
          return text
        }
      }
    } catch (e) {
      console.error("[v0] DOCX extraction error:", e)
    }
  }

  // Handle PDF files
  if (fileNameLower.endsWith(".pdf")) {
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

      // Fallback: find readable sequences
      const readable =
        text
          .replace(/[^\x20-\x7E\n]/g, " ")
          .replace(/\s+/g, " ")
          .match(/[A-Za-z][A-Za-z0-9\s,.'"-]{10,}/g) || []

      return readable.join(" ").trim()
    } catch (e) {
      console.error("[v0] PDF extraction error:", e)
    }
  }

  // Handle plain text
  if (fileNameLower.endsWith(".txt")) {
    return new TextDecoder("utf-8").decode(buffer)
  }

  // Fallback
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
  return text
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    let buffer: ArrayBuffer
    let fileName = "document"

    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      const fileUrl = formData.get("fileUrl") as string | null

      if (file && file.size > 0) {
        // File uploaded directly
        fileName = file.name
        buffer = await file.arrayBuffer()
      } else if (fileUrl) {
        // File URL provided
        fileName = (formData.get("fileName") as string) || "document"
        const response = await fetch(fileUrl)
        if (!response.ok) {
          throw new Error("Failed to fetch file from URL")
        }
        buffer = await response.arrayBuffer()
      } else {
        return Response.json({ error: "No file or file URL provided" }, { status: 400 })
      }
    } else {
      let body: { fileUrl?: string; fileName?: string }
      try {
        body = await request.json()
      } catch (e) {
        return Response.json({ error: "Invalid request body" }, { status: 400 })
      }

      if (!body.fileUrl) {
        return Response.json({ error: "No file URL provided" }, { status: 400 })
      }

      fileName = body.fileName || "document"
      const response = await fetch(body.fileUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch file from URL")
      }
      buffer = await response.arrayBuffer()
    }

    console.log("[v0] Processing document:", fileName, "Size:", buffer.byteLength)

    // Extract raw text
    const rawText = await extractRawText(buffer, fileName)
    console.log("[v0] Extracted raw text length:", rawText.length)

    if (rawText.length < 50) {
      return Response.json(
        {
          error: "Could not extract text from document. The file may be scanned or in an unsupported format.",
          content: "",
          fileName,
        },
        { status: 400 },
      )
    }

    // Use AI to format the extracted text nicely
    try {
      const result = await generateWithFallback({
        systemPrompt: `You are a document formatter. Your job is to take extracted raw text from a document and format it cleanly with proper structure.

Rules:
- Use ## for main section headings
- Use ### for subsections
- Use bullet points (- ) for lists
- Keep all original content - do not summarize or remove anything
- Fix obvious OCR/extraction errors if you notice them
- Preserve all names, dates, numbers, and legal language exactly
- Add paragraph breaks where appropriate
- Do NOT add any commentary or analysis`,
        userPrompt: `Format this extracted document text:\n\n${rawText.slice(0, 15000)}`,
        maxOutputTokens: 4000,
        temperature: 0.1,
      })

      console.log("[v0] Formatted content length:", result.text.length)

      return Response.json({
        success: true,
        content: result.text,
        rawText: rawText.slice(0, 5000),
        fileName,
      })
    } catch (aiError) {
      console.error("[v0] AI formatting failed:", aiError)
      // Return raw text if AI fails
      return Response.json({
        success: true,
        content: rawText,
        rawText: rawText.slice(0, 5000),
        fileName,
        note: "AI formatting unavailable, showing raw extracted text",
      })
    }
  } catch (error) {
    console.error("[v0] Document processing error:", error)
    return Response.json(
      {
        error: "Failed to process document",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
