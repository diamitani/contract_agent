import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""

function validateOpenAIKey(key: string): void {
  if (!key) {
    throw new Error("OPENAI_API_KEY environment variable is required")
  }
  if (key.startsWith("AIzaSy")) {
    throw new Error(
      "OPENAI_API_KEY appears to be a Google/Gemini API key. Please set a valid OpenAI API key (starts with 'sk-').",
    )
  }
}

validateOpenAIKey(OPENAI_API_KEY)

const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
})

export type AIModel = "openai" | "gemini"

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
  const { systemPrompt, userPrompt, maxOutputTokens = 4000, temperature = 0.3 } = options

  const models = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]

  let lastError: Error | null = null

  for (const modelName of models) {
    try {
      console.log(`[AI] Trying model: ${modelName}`)
      const result = await generateText({
        model: openai(modelName),
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: maxOutputTokens,
        temperature,
      })

      if (result.text) {
        console.log(`[AI] Success with model: ${modelName}`)
        return { text: result.text, model: "openai" }
      }
    } catch (error) {
      console.error(`[AI] ${modelName} failed:`, error instanceof Error ? error.message : error)
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError || new Error("All OpenAI models failed. Please check your API key.")
}

export async function generateChat(options: {
  systemPrompt: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
  maxOutputTokens?: number
  temperature?: number
}): Promise<string> {
  const { systemPrompt, messages, maxOutputTokens = 2000, temperature = 0.7 } = options

  // Build conversation prompt
  const conversationPrompt = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n")

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    prompt: conversationPrompt + "\n\nAssistant:",
    maxTokens: maxOutputTokens,
    temperature,
  })

  return result.text
}

export async function callOpenAI(endpoint: string, options: RequestInit): Promise<Response> {
  const apiKey = OPENAI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required")
  }

  const response = await fetch(`https://api.openai.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
  const { prompt, systemPrompt, maxTokens = 2000 } = options

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    prompt,
    maxTokens: maxTokens,
  })

  return result.text
}
