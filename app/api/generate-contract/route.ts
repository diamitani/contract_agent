import type { NextRequest } from "next/server"
import { callOpenAI, callGeminiDirect, callDeepSeekDirect, callOpenRouterDirect } from "@/lib/ai"

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

const encoder = new TextEncoder()

function buildGeneratePrompt(contractName: string, contractType: string, timestamp: string, fields: Record<string, string>) {
  return `Generate a COMPLETE, FULL-LENGTH legal ${contractName} document with the following details:

Contract Type: ${contractType}
Contract Name: ${contractName}
Generation Date: ${timestamp}

Form Data (use ALL of this information in the contract):
${JSON.stringify(fields, null, 2)}

IMPORTANT: Generate the ENTIRE contract with all sections fully written out. Do not summarize or abbreviate any sections. This must be a complete, executable legal document.`
}

async function tryDeepSeek(prompt: string) {
  if (!process.env.DEEPSEEK_API_KEY) return ""
  console.log("[gen] Trying DeepSeek for contract generation")
  try {
    const content = await callDeepSeekDirect({ systemPrompt: SYSTEM_INSTRUCTIONS, prompt, maxTokens: 8000, temperature: 0.3 })
    if (content.trim()) {
      console.log("[gen] DeepSeek success, length:", content.length)
      return content
    }
  } catch (e) {
    console.log("[gen] DeepSeek failed:", e)
  }
  return ""
}

async function tryOpenRouter(prompt: string) {
  if (!process.env.OPENROUTER_API_KEY) return ""
  console.log("[gen] Trying OpenRouter for contract generation")
  try {
    const content = await callOpenRouterDirect({ systemPrompt: SYSTEM_INSTRUCTIONS, prompt, maxTokens: 8000, temperature: 0.3 })
    if (content.trim()) {
      console.log("[gen] OpenRouter success, length:", content.length)
      return content
    }
  } catch (e) {
    console.log("[gen] OpenRouter failed:", e)
  }
  return ""
}

async function tryGemini(prompt: string) {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) return ""
  console.log("[gen] Trying Gemini for contract generation")
  try {
    const content = await callGeminiDirect({ systemPrompt: SYSTEM_INSTRUCTIONS, prompt, maxTokens: 8000 })
    if (content.trim()) {
      console.log("[gen] Gemini success, length:", content.length)
      return content
    }
  } catch (e) {
    console.log("[gen] Gemini failed:", e)
  }
  return ""
}

function streamContract(controller: ReadableStreamDefaultController, content: string, model: string, contractName: string, fields: Record<string, string>) {
  const chunkSize = 100
  for (let i = 0; i < content.length; i += chunkSize) {
    const chunk = content.slice(i, i + chunkSize)
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`))
  }
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "complete", content, contractName, fields, model })}\n\n`))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contract_type, contract_name, fields, timestamp, model: preferredModel } = body

    console.log("[gen] Request:", { contract_type, contract_name, preferredModel, fieldCount: Object.keys(fields).length })

    const prompt = buildGeneratePrompt(contract_name, contract_type, timestamp, fields)

    // If a specific model was requested, try it directly
    if (preferredModel === "deepseek") {
      const content = await tryDeepSeek(prompt)
      if (content) {
        const stream = new ReadableStream({ start(controller) { streamContract(controller, content, "deepseek", contract_name, fields); controller.close() } })
        return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } })
      }
    }

    if (preferredModel === "openrouter") {
      const content = await tryOpenRouter(prompt)
      if (content) {
        const stream = new ReadableStream({ start(controller) { streamContract(controller, content, "openrouter", contract_name, fields); controller.close() } })
        return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } })
      }
    }

    // Fallback chain: DeepSeek → OpenRouter → Gemini
    let content = ""
    let model = "unknown"

    content = await tryDeepSeek(prompt)
    if (content) { model = "deepseek" }

    if (!content) {
      content = await tryOpenRouter(prompt)
      if (content) { model = "openrouter" }
    }

    if (!content) {
      content = await tryGemini(prompt)
      if (content) { model = "gemini" }
    }

    if (!content) {
      return new Response(JSON.stringify({ error: "All AI providers failed" }), { status: 500, headers: { "Content-Type": "application/json" } })
    }

    const stream = new ReadableStream({ start(controller) { streamContract(controller, content, model, contract_name, fields); controller.close() } })
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } })
  } catch (error) {
    console.error("[gen] API error:", error)
    return new Response(JSON.stringify({ error: "Failed to generate contract", details: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}
