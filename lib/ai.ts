import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { fetch } from "node-fetch" // Ensure fetch is available if not in browser environment
import { ReadableStream, TextDecoder, TextEncoder } from "stream/web" // Ensure these are available if not in browser environment

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || ""
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""

// Create Google provider with Gemini API key
const google = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
})

export type AIModel = "gemini" | "openai"

interface GenerateOptions {
  systemPrompt: string
  userPrompt: string
  maxOutputTokens?: number
  temperature?: number
}

export async function generateWithFallback(options: GenerateOptions): Promise<{
  text: string
  model: AIModel
}> {
  const { systemPrompt, userPrompt, maxOutputTokens = 2000, temperature = 0.7 } = options

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is required")
  }

  try {
    const result = await generateText({
      model: google("gemini-2.5-pro-preview-05-06"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: maxOutputTokens,
      temperature,
    })
    return { text: result.text, model: "gemini" }
  } catch (error) {
    console.error("[AI] Gemini Pro failed:", error)

    // Try flash as fallback
    try {
      const result = await generateText({
        model: google("gemini-2.0-flash"),
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: maxOutputTokens,
        temperature,
      })
      return { text: result.text, model: "gemini" }
    } catch (flashError) {
      console.error("[AI] Gemini Flash also failed:", flashError)
      throw new Error("AI generation failed: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }
}

// Direct Gemini call for chat - returns plain text stream
export async function streamGeminiChat(options: {
  systemPrompt: string
  messages: Array<{ role: string; content: string }>
  maxTokens?: number
}): Promise<ReadableStream<Uint8Array>> {
  const { systemPrompt, messages, maxTokens = 1500 } = options

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required")
  }

  // Build the full prompt from messages
  const conversationHistory = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n")

  const fullPrompt = `${systemPrompt}\n\n${conversationHistory}`

  // Use Gemini REST API directly for simpler streaming
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-05-06:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Gemini API Error]:", errorText)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  // Transform the SSE stream to plain text
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) {
                  controller.enqueue(encoder.encode(text))
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }
      } catch (error) {
        console.error("[Stream error]:", error)
      } finally {
        controller.close()
      }
    },
  })
}

export async function callOpenAI(endpoint: string, options: RequestInit): Promise<Response> {
  const response = await fetch(`https://api.openai.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
  return response
}

export async function callGeminiDirect(options: {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
}): Promise<string> {
  const { prompt, systemPrompt, maxTokens = 4000 } = options

  const result = await generateWithFallback({
    systemPrompt: systemPrompt || "",
    userPrompt: prompt,
    maxOutputTokens: maxTokens,
    temperature: 0.7,
  })

  return result.text
}
