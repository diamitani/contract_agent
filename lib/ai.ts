import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || GEMINI_API_KEY

  if (!key) {
    throw new Error("GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable is required")
  }

  return createGoogleGenerativeAI({ apiKey: key })
}

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
  const { systemPrompt, userPrompt, maxOutputTokens = 4000, temperature = 0.3 } = options

  const gemini = getGeminiClient()
  // Try multiple Gemini models
  const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"]

  let lastError: Error | null = null

  for (const modelName of models) {
    try {
      console.log(`[AI] Trying Gemini model: ${modelName}`)
      const result = await generateText({
        model: gemini(modelName),
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: maxOutputTokens,
        temperature,
      })

      const responseText = result.text || ""

      if (responseText.trim()) {
        console.log(`[AI] Success with ${modelName}, length: ${responseText.length}`)
        return { text: responseText, model: "gemini" }
      } else {
        console.log(`[AI] ${modelName} returned empty response`)
        lastError = new Error("Empty response from model")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[AI] ${modelName} error:`, errorMessage)
      lastError = error instanceof Error ? error : new Error(errorMessage)

      // Don't retry on auth errors
      if (errorMessage.includes("401") || errorMessage.includes("API key") || errorMessage.includes("Unauthorized")) {
        throw new Error("Gemini API authentication failed. Check your GEMINI_API_KEY.")
      }
    }
  }

  throw lastError || new Error("All Gemini models failed")
}

export async function generateChat(options: {
  systemPrompt: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
  maxOutputTokens?: number
  temperature?: number
}): Promise<string> {
  const { systemPrompt, messages, maxOutputTokens = 2000, temperature = 0.7 } = options

  const gemini = getGeminiClient()

  try {
    const conversationPrompt = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n")

    const result = await generateText({
      model: gemini("gemini-2.0-flash-exp"),
      system: systemPrompt,
      prompt: conversationPrompt + "\n\nAssistant:",
      maxTokens: maxOutputTokens,
      temperature,
    })

    return result.text || "I apologize, but I couldn't generate a response. Please try again."
  } catch (error) {
    console.error("[AI] Gemini chat error:", error)
    // Try fallback model
    try {
      const gemini = getGeminiClient()
      const conversationPrompt = messages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n")

      const result = await generateText({
        model: gemini("gemini-1.5-flash"),
        system: systemPrompt,
        prompt: conversationPrompt + "\n\nAssistant:",
        maxTokens: maxOutputTokens,
        temperature,
      })

      return result.text || "I apologize, but I couldn't generate a response. Please try again."
    } catch (fallbackError) {
      throw new Error(error instanceof Error ? error.message : "Failed to generate chat response")
    }
  }
}

export async function callOpenAI(endpoint: string, options: RequestInit): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required for contract generation")
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

  const gemini = getGeminiClient()

  try {
    const result = await generateText({
      model: gemini("gemini-2.0-flash-exp"),
      system: systemPrompt,
      prompt,
      maxTokens: maxTokens,
    })

    return result.text
  } catch (error) {
    // Try fallback
    console.error("[AI] Gemini direct error, trying fallback:", error)
    const result = await generateText({
      model: gemini("gemini-1.5-flash"),
      system: systemPrompt,
      prompt,
      maxTokens: maxTokens,
    })

    return result.text
  }
}
