import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, contractName } = body

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 })
    }

    // Generate PDF using a simple text-to-PDF approach
    // We'll create a downloadable HTML document that can be printed/saved as PDF
    const htmlContent = generatePDFHtml(content, contractName)

    return NextResponse.json({
      success: true,
      html: htmlContent,
      filename: `${contractName?.replace(/\s+/g, "_") || "contract"}_${Date.now()}.html`,
    })
  } catch (error) {
    console.error("[v0] PDF generation error:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}

function generatePDFHtml(content: string, contractName: string): string {
  // Convert markdown-style formatting to HTML
  const formattedContent = content
    // Convert headers
    .replace(
      /^### (.+)$/gm,
      '<h3 style="font-size: 14pt; font-weight: bold; margin-top: 16px; margin-bottom: 8px;">$1</h3>',
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 style="font-size: 16pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">$1</h2>',
    )
    .replace(
      /^# (.+)$/gm,
      '<h1 style="font-size: 18pt; font-weight: bold; margin-top: 24px; margin-bottom: 12px; text-align: center;">$1</h1>',
    )
    // Convert bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Convert italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Convert line breaks
    .replace(/\n\n/g, '</p><p style="margin-bottom: 12px; line-height: 1.6;">')
    .replace(/\n/g, "<br>")
    // Convert horizontal rules
    .replace(/---/g, '<hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">')
    // Convert underscores for signature lines
    .replace(
      /_{10,}/g,
      '<span style="display: inline-block; border-bottom: 1px solid #000; min-width: 200px;">&nbsp;</span>',
    )

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contractName || "Contract"}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20mm; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: white;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    .header h1 {
      font-size: 24pt;
      margin: 0 0 10px 0;
      text-transform: uppercase;
    }
    .content {
      text-align: justify;
    }
    .content p {
      margin-bottom: 12px;
    }
    .signature-block {
      margin-top: 50px;
      page-break-inside: avoid;
    }
    .signature-line {
      display: inline-block;
      border-bottom: 1px solid #000;
      min-width: 250px;
      margin-right: 50px;
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-family: system-ui, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .print-button:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>
  
  <div class="header">
    <h1>${contractName || "CONTRACT"}</h1>
    <p>Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>
  
  <div class="content">
    <p style="margin-bottom: 12px; line-height: 1.6;">${formattedContent}</p>
  </div>
</body>
</html>`
}
