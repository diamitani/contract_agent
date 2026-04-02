import { generateText, streamText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"

// ─── Provider factories ────────────────────────────────────────────────────

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
  if (!key) throw new Error("GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is required")
  return createGoogleGenerativeAI({ apiKey: key })
}

/** Azure AI Foundry – OpenAI-compatible inference endpoint */
function getAzureFoundryClient() {
  const apiKey = process.env.AZURE_AI_FOUNDRY_API_KEY
  const endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT // e.g. https://<project>.services.ai.azure.com/models
  const deployment = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT || "gpt-4o"

  if (!apiKey || !endpoint) throw new Error("Azure AI Foundry credentials not configured")

  return {
    client: createOpenAI({
      apiKey,
      baseURL: endpoint,
      headers: { "api-key": apiKey },
    }),
    deployment,
  }
}

/** Azure OpenAI (legacy / separate resource) */
function getAzureOpenAIClient() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-05-01-preview"

  if (!apiKey || !endpoint || !deployment) throw new Error("Azure OpenAI credentials not configured")

  // Append api-version to baseURL since defaultQuery is not available in this SDK version
  return {
    client: createOpenAI({
      apiKey,
      baseURL: `${endpoint}/openai/deployments/${deployment}?api-version=${apiVersion}`,
      headers: { "api-key": apiKey },
    }),
    deployment,
  }
}

/** DeepSeek v3 via OpenAI-compatible API */
function getDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured")

  return createOpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com/v1",
  })
}

/** Ollama local / self-hosted – fast online backup */
function getOllamaClient() {
  const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1"
  return createOpenAI({
    apiKey: "ollama", // Ollama doesn't require a real key
    baseURL,
  })
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type AIModel = "azure-foundry" | "azure-openai" | "deepseek" | "ollama" | "gemini" | "openai"

interface GenerateOptions {
  systemPrompt: string
  userPrompt: string
  maxOutputTokens?: number
  temperature?: number
}

interface GenerateResult {
  text: string
  model: AIModel
}

// ─── Primary fallback chain ────────────────────────────────────────────────
// Order: Azure AI Foundry → Azure OpenAI → DeepSeek v3 → Ollama → Gemini

export async function generateWithFallback(options: GenerateOptions): Promise<GenerateResult> {
  const { systemPrompt, userPrompt, maxOutputTokens = 4000, temperature = 0.3 } = options

  // 1. Azure AI Foundry / DeepSeek-V3.2 (primary — Azure-hosted DeepSeek)
  if (process.env.AZURE_AI_FOUNDRY_API_KEY && process.env.AZURE_AI_FOUNDRY_ENDPOINT) {
    try {
      console.log("[AI] Trying Azure AI Foundry (DeepSeek-V3.2)")
      const { client, deployment } = getAzureFoundryClient()
      const result = await generateText({
        model: client(deployment),
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens,
        temperature,
      })
      if (result.text?.trim()) {
        console.log(`[AI] Azure AI Foundry success, length: ${result.text.length}`)
        return { text: result.text, model: "azure-foundry" }
      }
    } catch (err) {
      console.error("[AI] Azure AI Foundry error:", err)
    }
  }

  // 2. DeepSeek API (direct — fallback if Azure is down)
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      console.log("[AI] Trying DeepSeek v3")
      const ds = getDeepSeekClient()
      const result = await generateText({
        model: ds("deepseek-chat"),
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens,
        temperature,
      })
      if (result.text?.trim()) {
        console.log(`[AI] DeepSeek success, length: ${result.text.length}`)
        return { text: result.text, model: "deepseek" }
      }
    } catch (err) {
      console.error("[AI] DeepSeek error:", err)
    }
  }

  // 2. Ollama (self-hosted fast backup)
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2"
  if (process.env.OLLAMA_BASE_URL) {
    try {
      console.log(`[AI] Trying Ollama (${ollamaModel})`)
      const ol = getOllamaClient()
      const result = await generateText({
        model: ol(ollamaModel),
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens,
        temperature,
      })
      if (result.text?.trim()) {
        console.log(`[AI] Ollama success, length: ${result.text.length}`)
        return { text: result.text, model: "ollama" }
      }
    } catch (err) {
      console.error("[AI] Ollama error:", err)
    }
  }

  // 4. Azure OpenAI (legacy)
  if (process.env.AZURE_OPENAI_API_KEY) {
    try {
      console.log("[AI] Trying Azure OpenAI")
      const { client, deployment } = getAzureOpenAIClient()
      const result = await generateText({
        model: client(deployment),
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens,
        temperature,
      })
      if (result.text?.trim()) {
        console.log(`[AI] Azure OpenAI success, length: ${result.text.length}`)
        return { text: result.text, model: "azure-openai" }
      }
    } catch (err) {
      console.error("[AI] Azure OpenAI error:", err)
    }
  }

  // 5. Gemini (final fallback)
  const gemini = getGeminiClient()
  const geminiModels = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"]
  let lastError: Error | null = null

  for (const modelName of geminiModels) {
    try {
      console.log(`[AI] Trying Gemini model: ${modelName}`)
      const result = await generateText({
        model: gemini(modelName),
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens,
        temperature,
      })
      if (result.text?.trim()) {
        console.log(`[AI] Gemini ${modelName} success, length: ${result.text.length}`)
        return { text: result.text, model: "gemini" }
      }
      lastError = new Error("Empty response from model")
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[AI] Gemini ${modelName} error:`, msg)
      lastError = err instanceof Error ? err : new Error(msg)
      if (msg.includes("401") || msg.includes("API key") || msg.includes("Unauthorized")) {
        throw new Error("Gemini API authentication failed. Check GEMINI_API_KEY.")
      }
    }
  }

  throw lastError || new Error("All AI providers failed")
}

// ─── Streaming contract generation ────────────────────────────────────────
// Returns a ReadableStream for SSE consumption by the frontend.
// Tries each provider in order; on failure moves to the next.

export async function streamContractGeneration(options: {
  systemPrompt: string
  userPrompt: string
  contractName: string
  fields: Record<string, unknown>
  maxOutputTokens?: number
}): Promise<ReadableStream> {
  const { systemPrompt, userPrompt, contractName, fields, maxOutputTokens = 8000 } = options
  const encoder = new TextEncoder()

  const providers: Array<{ label: AIModel; tryStream: () => Promise<ReadableStream | null> }> = []

  // Order: Azure Foundry (DeepSeek-V3.2) → DeepSeek API → Ollama → Azure OpenAI → Gemini
  if (process.env.AZURE_AI_FOUNDRY_API_KEY && process.env.AZURE_AI_FOUNDRY_ENDPOINT) {
    providers.push({
      label: "azure-foundry",
      tryStream: async () => {
        const { client, deployment } = getAzureFoundryClient()
        return buildSSEStream(client(deployment), systemPrompt, userPrompt, contractName, fields, encoder, "azure-foundry", maxOutputTokens)
      },
    })
  }

  if (process.env.DEEPSEEK_API_KEY) {
    providers.push({
      label: "deepseek",
      tryStream: async () => {
        const ds = getDeepSeekClient()
        return buildSSEStream(ds("deepseek-chat"), systemPrompt, userPrompt, contractName, fields, encoder, "deepseek", maxOutputTokens)
      },
    })
  }

  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2"
  if (process.env.OLLAMA_BASE_URL) {
    providers.push({
      label: "ollama",
      tryStream: async () => {
        const ol = getOllamaClient()
        return buildSSEStream(ol(ollamaModel), systemPrompt, userPrompt, contractName, fields, encoder, "ollama", maxOutputTokens)
      },
    })
  }

  if (process.env.AZURE_OPENAI_API_KEY) {
    providers.push({
      label: "azure-openai",
      tryStream: async () => {
        const { client, deployment } = getAzureOpenAIClient()
        return buildSSEStream(client(deployment), systemPrompt, userPrompt, contractName, fields, encoder, "azure-openai", maxOutputTokens)
      },
    })
  }

  // Gemini non-streaming fallback (simulate streaming)
  providers.push({
    label: "gemini",
    tryStream: async () => buildGeminiStream(systemPrompt, userPrompt, contractName, fields, encoder, maxOutputTokens),
  })

  for (const provider of providers) {
    try {
      console.log(`[AI Stream] Trying ${provider.label}`)
      const stream = await provider.tryStream()
      if (stream) {
        console.log(`[AI Stream] Using ${provider.label}`)
        return stream
      }
    } catch (err) {
      console.error(`[AI Stream] ${provider.label} failed:`, err)
    }
  }

  // Error fallback stream
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "All AI providers failed" })}\n\n`))
      controller.close()
    },
  })
}

// ─── Internal helpers ──────────────────────────────────────────────────────

async function buildSSEStream(
  model: Parameters<typeof streamText>[0]["model"],
  systemPrompt: string,
  userPrompt: string,
  contractName: string,
  fields: Record<string, unknown>,
  encoder: TextEncoder,
  modelLabel: AIModel,
  maxOutputTokens: number,
): Promise<ReadableStream> {
  const result = streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens,
    temperature: 0.3,
  })

  return new ReadableStream({
    async start(controller) {
      let fullContent = ""
      try {
        for await (const chunk of result.textStream) {
          fullContent += chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`))
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "complete", content: fullContent, contractName, fields, model: modelLabel })}\n\n`,
          ),
        )
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(err) })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })
}

async function buildGeminiStream(
  systemPrompt: string,
  userPrompt: string,
  contractName: string,
  fields: Record<string, unknown>,
  encoder: TextEncoder,
  maxOutputTokens: number,
): Promise<ReadableStream> {
  const gemini = getGeminiClient()
  const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"]

  for (const modelName of models) {
    try {
      return buildSSEStream(gemini(modelName), systemPrompt, userPrompt, contractName, fields, encoder, "gemini", maxOutputTokens)
    } catch {
      // try next Gemini model
    }
  }
  throw new Error("All Gemini models failed")
}

// ─── Chat helpers ──────────────────────────────────────────────────────────

export async function generateChat(options: {
  systemPrompt: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
  maxOutputTokens?: number
  temperature?: number
}): Promise<string> {
  const { systemPrompt, messages, maxOutputTokens = 2000, temperature = 0.7 } = options
  const conversationPrompt =
    messages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n") + "\n\nAssistant:"

  const result = await generateWithFallback({
    systemPrompt,
    userPrompt: conversationPrompt,
    maxOutputTokens,
    temperature,
  })
  return result.text || "I apologize, but I couldn't generate a response. Please try again."
}

// ─── Legacy helpers (kept for backward compat) ────────────────────────────

export async function callOpenAI(endpoint: string, options: RequestInit): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for contract generation")

  return fetch(`https://api.openai.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })
}

export async function callGeminiDirect(options: {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
}): Promise<string> {
  const { prompt, systemPrompt, maxTokens = 2000 } = options
  const result = await generateWithFallback({
    systemPrompt: systemPrompt || "",
    userPrompt: prompt,
    maxOutputTokens: maxTokens,
  })
  return result.text
}
