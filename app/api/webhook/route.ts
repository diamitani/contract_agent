import { type NextRequest, NextResponse } from "next/server"

// This endpoint receives webhook responses from n8n/Make.com
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Webhook response received:", body)

    // Handle the webhook response
    // This could include:
    // - Generated contract content
    // - Download URL for PDF
    // - Error messages

    const { content, downloadUrl, error, requestId } = body

    if (error) {
      return NextResponse.json({ error: error.message || "Contract generation failed" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      content,
      downloadUrl,
      requestId,
    })
  } catch (error) {
    console.error("[v0] Webhook handler error:", error)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const challenge = searchParams.get("challenge")

  // Return challenge for webhook verification
  if (challenge) {
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({ status: "Webhook endpoint active" })
}
