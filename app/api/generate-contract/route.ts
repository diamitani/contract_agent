import type { NextRequest } from "next/server"
import { callOpenAI, callGeminiDirect } from "@/lib/ai"

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

    const messageContent = `${SYSTEM_INSTRUCTIONS}

---

Generate a COMPLETE, FULL-LENGTH legal ${contract_name} document with the following details:

Contract Type: ${contract_type}
Contract Name: ${contract_name}
Generation Date: ${timestamp}

Form Data (use ALL of this information in the contract):
${JSON.stringify(fields, null, 2)}

IMPORTANT: Generate the ENTIRE contract with all sections fully written out. Do not summarize or abbreviate any sections. This must be a complete, executable legal document.`

    let useGeminiFallback = false

    try {
      // Create a thread
      const threadResponse = await callOpenAI("/threads", {
        method: "POST",
        headers: { "OpenAI-Beta": "assistants=v2" },
      })

      if (!threadResponse.ok) {
        throw new Error("Failed to create thread")
      }

      const thread = await threadResponse.json()
      console.log("[v0] Thread created:", thread.id)

      // Add message to thread
      const messageResponse = await callOpenAI(`/threads/${thread.id}/messages`, {
        method: "POST",
        headers: { "OpenAI-Beta": "assistants=v2" },
        body: JSON.stringify({
          role: "user",
          content: messageContent,
        }),
      })

      if (!messageResponse.ok) {
        throw new Error("Failed to add message to thread")
      }

      console.log("[v0] Message added to thread")

      // Run the assistant with streaming
      const runResponse = await callOpenAI(`/threads/${thread.id}/runs`, {
        method: "POST",
        headers: { "OpenAI-Beta": "assistants=v2" },
        body: JSON.stringify({
          assistant_id: ASSISTANT_ID,
          stream: true,
        }),
      })

      if (!runResponse.ok) {
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

                    if (parsed.object === "thread.message.delta") {
                      const delta = parsed.delta?.content?.[0]?.text?.value
                      if (delta) {
                        fullContent += delta
                        controller.enqueue(
                          encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`),
                        )
                      }
                    }

                    if (parsed.object === "thread.run" && parsed.status === "completed") {
                      runCompleted = true
                    }
                  } catch {
                    // Skip non-JSON lines
                  }
                }
              }
            }

            // Fetch final message if needed
            if (!fullContent && runCompleted) {
              const messagesResponse = await callOpenAI(`/threads/${thread.id}/messages`, {
                headers: { "OpenAI-Beta": "assistants=v2" },
              })

              const messagesData = await messagesResponse.json()
              const assistantMessage = messagesData.data?.find((msg: { role: string }) => msg.role === "assistant")

              if (assistantMessage?.content?.[0]?.text?.value) {
                fullContent = assistantMessage.content[0].text.value
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "delta", content: fullContent })}\n\n`),
                )
              }
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  content: fullContent,
                  contractName: contract_name,
                  fields: fields,
                  model: "openai",
                })}\n\n`,
              ),
            )

            console.log("[v0] Contract generated with OpenAI, length:", fullContent.length)
          } catch (error) {
            console.error("[v0] OpenAI stream error:", error)
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
    } catch (openaiError) {
      console.log("[v0] OpenAI failed, using Gemini fallback:", openaiError)
      useGeminiFallback = true
    }

    if (useGeminiFallback) {
      console.log("[v0] Using Gemini fallback for contract generation")

      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const geminiContent = await callGeminiDirect({
              systemPrompt: SYSTEM_INSTRUCTIONS,
              prompt: `Generate a COMPLETE, FULL-LENGTH legal ${contract_name} document with the following details:

Contract Type: ${contract_type}
Contract Name: ${contract_name}
Generation Date: ${timestamp}

Form Data (use ALL of this information in the contract):
${JSON.stringify(fields, null, 2)}

IMPORTANT: Generate the ENTIRE contract with all sections fully written out. Do not summarize or abbreviate any sections. This must be a complete, executable legal document.`,
              maxTokens: 8000,
            })

            // Send content in chunks for streaming effect
            const chunkSize = 100
            for (let i = 0; i < geminiContent.length; i += chunkSize) {
              const chunk = geminiContent.slice(i, i + chunkSize)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`))
              // Small delay for streaming effect
              await new Promise((resolve) => setTimeout(resolve, 10))
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  content: geminiContent,
                  contractName: contract_name,
                  fields: fields,
                  model: "gemini",
                })}\n\n`,
              ),
            )

            console.log("[v0] Contract generated with Gemini, length:", geminiContent.length)
          } catch (error) {
            console.error("[v0] Gemini error:", error)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "error", message: "All AI providers failed" })}\n\n`),
            )
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
    }

    // This shouldn't be reached, but just in case
    return new Response(JSON.stringify({ error: "Failed to generate contract" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    return new Response(JSON.stringify({ error: "Failed to generate contract", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
