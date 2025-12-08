import type { NextRequest } from "next/server"

const OPENAI_API_KEY =
  "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"
const ASSISTANT_ID = "asst_z9YqJ8Vb8zaRuv6PXVoiU3UB"

const SYSTEM_INSTRUCTIONS = `You are a professional legal contract generator. Generate COMPLETE, FULL-LENGTH legal contracts that are ready for execution.

IMPORTANT REQUIREMENTS:
1. Generate contracts that are comprehensive and legally sound
2. Include ALL standard sections for the contract type:
   - Title and Preamble
   - Recitals/Background
   - Definitions
   - Scope of Work/Services
   - Compensation and Payment Terms
   - Term and Termination
   - Confidentiality
   - Intellectual Property Rights
   - Representations and Warranties
   - Indemnification
   - Limitation of Liability
   - Dispute Resolution
   - Force Majeure
   - General Provisions (Entire Agreement, Amendment, Waiver, Severability, Assignment, Notices, Governing Law)
   - Signature Blocks

3. Use proper legal language and formatting
4. Fill in ALL provided information from the form data
5. Use [BLANK] or [TO BE COMPLETED] only for information not provided
6. Number all sections and subsections clearly
7. Make the contract at least 3-5 pages in length when printed
8. Include specific dates, amounts, and parties as provided
9. Do NOT abbreviate or summarize - provide the full legal text`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contract_type, contract_name, fields, timestamp } = body

    console.log("[v0] Contract generation request:", {
      contract_type,
      contract_name,
      timestamp,
      fieldCount: Object.keys(fields).length,
    })

    // Create a thread
    const threadResponse = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
    })

    if (!threadResponse.ok) {
      const errorData = await threadResponse.json()
      console.error("[v0] Thread creation error:", errorData)
      throw new Error("Failed to create thread")
    }

    const thread = await threadResponse.json()
    console.log("[v0] Thread created:", thread.id)

    const messageContent = `${SYSTEM_INSTRUCTIONS}

---

Generate a COMPLETE, FULL-LENGTH legal ${contract_name} document with the following details:

Contract Type: ${contract_type}
Contract Name: ${contract_name}
Generation Date: ${timestamp}

Form Data (use ALL of this information in the contract):
${JSON.stringify(fields, null, 2)}

IMPORTANT: Generate the ENTIRE contract with all sections fully written out. Do not summarize or abbreviate any sections. This must be a complete, executable legal document.`

    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: messageContent,
      }),
    })

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json()
      console.error("[v0] Message creation error:", errorData)
      throw new Error("Failed to add message to thread")
    }

    console.log("[v0] Message added to thread")

    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID,
        stream: true,
      }),
    })

    if (!runResponse.ok) {
      const errorData = await runResponse.json()
      console.error("[v0] Run creation error:", errorData)
      throw new Error("Failed to run assistant")
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = runResponse.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""
        let fullContent = ""
        let runId = ""
        let runCompleted = false

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim()
                if (data === "[DONE]") {
                  runCompleted = true
                  continue
                }

                try {
                  const parsed = JSON.parse(data)

                  // Track run ID
                  if (parsed.id && parsed.object === "thread.run") {
                    runId = parsed.id
                    console.log("[v0] Run started:", runId)
                  }

                  // Handle message delta events for streaming text
                  if (parsed.object === "thread.message.delta") {
                    const delta = parsed.delta?.content?.[0]?.text?.value
                    if (delta) {
                      fullContent += delta
                      // Send delta to client
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`),
                      )
                    }
                  }

                  // Handle completion
                  if (parsed.object === "thread.run" && parsed.status === "completed") {
                    runCompleted = true
                    console.log("[v0] Run completed")
                  }
                } catch {
                  // Skip non-JSON lines
                }
              }
            }
          }

          // If we didn't get content through streaming, fetch the final message
          if (!fullContent && runCompleted) {
            console.log("[v0] Fetching final message...")
            const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "OpenAI-Beta": "assistants=v2",
              },
            })

            const messagesData = await messagesResponse.json()
            const assistantMessage = messagesData.data?.find((msg: { role: string }) => msg.role === "assistant")

            if (assistantMessage?.content?.[0]?.text?.value) {
              fullContent = assistantMessage.content[0].text.value
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: fullContent })}\n\n`))
            }
          }

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                content: fullContent,
                contractName: contract_name,
                fields: fields,
              })}\n\n`,
            ),
          )

          console.log("[v0] Contract generated successfully, length:", fullContent.length)
        } catch (error) {
          console.error("[v0] Stream error:", error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(error) })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return new Response(JSON.stringify({ error: "Failed to generate contract", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
