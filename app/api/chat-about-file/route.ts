import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

const OPENAI_API_KEY =
  "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"

export async function POST(request: NextRequest) {
  try {
    const { fileId, message, context, history } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    const messages = [
      {
        role: "system",
        content: `You are a helpful contract analysis assistant. You have access to a contract document and should answer questions about it clearly and accurately. If you're unsure about something, say so. Here is the contract content for reference:\n\n${context?.slice(0, 10000) || "No contract content available."}`,
      },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
    })

    // Stream the response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n").filter((line) => line.trim() !== "")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ""
                if (content) {
                  controller.enqueue(encoder.encode(content))
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    console.error("Chat error:", error)
    return new Response("Chat failed", { status: 500 })
  }
}
