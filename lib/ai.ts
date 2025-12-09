import { generateText, streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

const OPENAI_API_KEY =
  "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"

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || ""

// Create OpenAI provider with your API key
const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
})

// Create Google provider with Gemini API key
const google = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
})

export type AIModel = "openai" | "gemini"

interface GenerateOptions {
  systemPrompt: string
  userPrompt: string
  maxOutputTokens?: number
  temperature?: number
}

interface StreamOptions extends GenerateOptions {
  onChunk?: (chunk: string) => void
}

export async function generateWithFallback(options: GenerateOptions): Promise<{
  text: string
  model: AIModel
}> {
  const { systemPrompt, userPrompt, maxOutputTokens = 2000, temperature = 0.7 } = options

  // Try Gemini first (primary)
  if (GEMINI_API_KEY) {
    try {
      const result = await generateText({
        model: google("gemini-1.5-flash"),
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: maxOutputTokens,
        temperature,
      })
      return { text: result.text, model: "gemini" }
    } catch (geminiError) {
      console.log("[AI] Gemini failed, falling back to OpenAI:", geminiError)
    }
  }

  // Fallback to OpenAI
  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: maxOutputTokens,
      temperature,
    })
    return { text: result.text, model: "openai" }
  } catch (openaiError) {
    console.error("[AI] OpenAI also failed:", openaiError)
    throw new Error("All AI providers failed")
  }
}

export async function streamWithFallback(options: StreamOptions): Promise<{
  stream: ReadableStream
  model: AIModel
}> {
  const { systemPrompt, userPrompt, maxOutputTokens = 2000, temperature = 0.7 } = options

  // Try Gemini first (primary)
  if (GEMINI_API_KEY) {
    try {
      const result = streamText({
        model: google("gemini-1.5-flash"),
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: maxOutputTokens,
        temperature,
      })
      return { stream: result.toDataStream(), model: "gemini" }
    } catch (geminiError) {
      console.log("[AI] Gemini streaming failed, falling back to OpenAI:", geminiError)
    }
  }

  // Fallback to OpenAI
  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: maxOutputTokens,
      temperature,
    })
    return { stream: result.toDataStream(), model: "openai" }
  } catch (openaiError) {
    console.error("[AI] OpenAI streaming also failed:", openaiError)
    throw new Error("All AI providers failed")
  }
}

// Chat completion with messages and fallback
export async function chatWithFallback(options: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
  maxOutputTokens?: number
  temperature?: number
  stream?: boolean
}): Promise<{ text?: string; stream?: ReadableStream; model: AIModel }> {
  const { messages, maxOutputTokens = 1000, temperature = 0.7, stream = false } = options

  const systemMessage = messages.find((m) => m.role === "system")?.content || ""
  const otherMessages = messages.filter((m) => m.role !== "system")

  // Build prompt from messages
  const prompt = otherMessages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n")

  if (stream) {
    return streamWithFallback({
      systemPrompt: systemMessage,
      userPrompt: prompt,
      maxOutputTokens,
      temperature,
    })
  }

  return generateWithFallback({
    systemPrompt: systemMessage,
    userPrompt: prompt,
    maxOutputTokens,
    temperature,
  })
}

// Direct OpenAI API call (for Assistants API which isn't in AI SDK)
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

// Direct Gemini API call as fallback for complex operations
export async function callGeminiDirect(options: {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
}): Promise<string> {
  const { prompt, systemPrompt, maxTokens = 2000 } = options

  const result = await generateText({
    model: google("gemini-1.5-flash"),
    system: systemPrompt,
    prompt,
    maxTokens: maxTokens,
  })

  return result.text
}
