import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, contractName, watermark = false } = body

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 })
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Split content into lines
    const lines = content.split("\n")
    const pageHeight = 792 // Letter size
    const pageWidth = 612
    const margin = 50
    const lineHeight = 14
    let yPosition = pageHeight - margin

    let page = pdfDoc.addPage([pageWidth, pageHeight])

    // Add watermark if requested
    if (watermark) {
      const watermarkText = "PREVIEW COPY - NOT FOR OFFICIAL USE"
      const watermarkSize = 48

      // Add diagonal watermark
      for (let i = 0; i < 3; i++) {
        page.drawText(watermarkText, {
          x: pageWidth / 2 - watermarkText.length * 8,
          y: pageHeight / 2 + (i * 100) - 100,
          size: watermarkSize,
          font: boldFont,
          color: rgb(0.9, 0.9, 0.9),
          rotate: degrees(45),
          opacity: 0.2,
        })
      }
    }

    // Add header
    const headerText = contractName || "CONTRACT"
    const headerSize = 18
    page.drawText(headerText.toUpperCase(), {
      x: pageWidth / 2 - (headerText.length * headerSize) / 4,
      y: yPosition,
      size: headerSize,
      font: boldFont,
      color: rgb(0, 0, 0),
    })

    yPosition -= lineHeight * 2

    // Add date
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    page.drawText(`Generated on: ${date}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPosition -= lineHeight * 3

    // Add content
    for (const line of lines) {
      if (yPosition < margin + 50) {
        // Add new page
        page = pdfDoc.addPage([pageWidth, pageHeight])
        yPosition = pageHeight - margin

        // Add watermark to new page
        if (watermark) {
          const watermarkText = "PREVIEW COPY - NOT FOR OFFICIAL USE"
          const watermarkSize = 48

          for (let i = 0; i < 3; i++) {
            page.drawText(watermarkText, {
              x: pageWidth / 2 - watermarkText.length * 8,
              y: pageHeight / 2 + (i * 100) - 100,
              size: watermarkSize,
              font: boldFont,
                color: rgb(0.9, 0.9, 0.9),
            rotate: degrees(45),
                opacity: 0.2,
            })
          }
        }
      }

      const trimmedLine = line.trim()
      if (!trimmedLine) {
        yPosition -= lineHeight
        continue
      }

      // Detect headers (lines starting with # or all caps)
      const isHeader =
        trimmedLine.startsWith("#") ||
        (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 100 && trimmedLine.length > 3)

      const displayLine = trimmedLine.replace(/^#+\s*/, "")
      const currentFont = isHeader ? boldFont : font
      const fontSize = isHeader ? 12 : 10

      // Word wrap
      const words = displayLine.split(" ")
      let currentLine = ""

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const testWidth = currentFont.widthOfTextAtSize(testLine, fontSize)

        if (testWidth > pageWidth - margin * 2) {
          if (currentLine) {
            page.drawText(currentLine, {
              x: margin,
              y: yPosition,
              size: fontSize,
              font: currentFont,
              color: rgb(0, 0, 0),
            })
            yPosition -= lineHeight
            currentLine = word
          } else {
            // Word is too long, split it
            page.drawText(word, {
              x: margin,
              y: yPosition,
              size: fontSize,
              font: currentFont,
              color: rgb(0, 0, 0),
            })
            yPosition -= lineHeight
          }
        } else {
          currentLine = testLine
        }
      }

      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: currentFont,
          color: rgb(0, 0, 0),
        })
        yPosition -= lineHeight
      }

      if (isHeader) {
        yPosition -= lineHeight / 2 // Extra space after headers
      }
    }

    // Add footer with watermark text if applicable
    if (watermark) {
      const pages = pdfDoc.getPages()
      pages.forEach((p, index) => {
        p.drawText("PREVIEW ONLY - Purchase to remove watermark", {
          x: margin,
          y: 30,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        })
        p.drawText(`Page ${index + 1} of ${pages.length}`, {
          x: pageWidth - margin - 50,
          y: 30,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
        })
      })
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save()

    // Convert to base64
    const base64 = Buffer.from(pdfBytes).toString("base64")

    return NextResponse.json({
      success: true,
      pdf: base64,
      filename: `${contractName?.replace(/\s+/g, "_") || "contract"}_${Date.now()}.pdf`,
      watermarked: watermark,
    })
  } catch (error) {
    console.error("[PDF] Generation error:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
