import type { NextRequest } from "next/server"
import { streamContractGeneration } from "@/lib/ai"

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

    console.log("[generate-contract] Request:", {
      contract_type,
      contract_name,
      timestamp,
      fieldCount: Object.keys(fields || {}).length,
    })

    const userPrompt = `Generate a COMPLETE, FULL-LENGTH legal ${contract_name} document with the following details:

Contract Type: ${contract_type}
Contract Name: ${contract_name}
Generation Date: ${timestamp}

Form Data (use ALL of this information in the contract):
${JSON.stringify(fields, null, 2)}

IMPORTANT: Generate the ENTIRE contract with all sections fully written out. Do not summarize or abbreviate any sections. This must be a complete, executable legal document.`

    const stream = await streamContractGeneration({
      systemPrompt: SYSTEM_INSTRUCTIONS,
      userPrompt,
      contractName: contract_name,
      fields,
      maxOutputTokens: 8000,
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[generate-contract] Error:", error)
    return new Response(JSON.stringify({ error: "Failed to generate contract", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
