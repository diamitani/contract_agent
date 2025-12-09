import { type NextRequest, NextResponse } from "next/server"
import { getContractBySlug } from "@/lib/contracts"

export async function POST(request: NextRequest) {
  try {
    const { contractSlug } = await request.json()

    const contract = getContractBySlug(contractSlug)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Generate contract template sections
    const sections = [
      {
        title: "PREAMBLE",
        content: `This ${contract.name} (the "Agreement") is entered into as of the date last signed below (the "Effective Date"), by and between the parties identified in this document.`,
      },
      {
        title: "RECITALS",
        content: `WHEREAS, the parties wish to enter into this Agreement to establish the terms and conditions governing their relationship as it pertains to ${contract.description.toLowerCase()};\n\nWHEREAS, both parties acknowledge that they have read and understood the terms contained herein and agree to be bound by them;\n\nNOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:`,
      },
      {
        title: "ARTICLE I - DEFINITIONS",
        content: contract.fields
          .map(
            (field, index) =>
              `${index + 1}.${index + 1} "${field.label}" shall mean ${field.description || `the ${field.label.toLowerCase()} as specified in this Agreement`}.`,
          )
          .join("\n\n"),
      },
      {
        title: "ARTICLE II - SCOPE OF AGREEMENT",
        content: `2.1 Purpose. This Agreement sets forth the complete understanding between the parties regarding ${contract.description.toLowerCase()}.\n\n2.2 Entire Agreement. This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, warranties, and agreements between the parties.\n\n2.3 Amendments. No amendment or modification of this Agreement shall be valid unless made in writing and signed by both parties.`,
      },
      {
        title: "ARTICLE III - TERM AND TERMINATION",
        content: `3.1 Term. This Agreement shall commence on the Effective Date and shall continue until terminated in accordance with the provisions hereof.\n\n3.2 Termination for Convenience. Either party may terminate this Agreement upon thirty (30) days' prior written notice to the other party.\n\n3.3 Termination for Cause. Either party may terminate this Agreement immediately upon written notice if the other party materially breaches any provision of this Agreement and fails to cure such breach within fifteen (15) days after receiving written notice thereof.\n\n3.4 Effect of Termination. Upon termination of this Agreement, each party shall return or destroy all confidential information of the other party in its possession.`,
      },
      {
        title: "ARTICLE IV - COMPENSATION AND PAYMENT",
        content: `4.1 Compensation. The parties shall negotiate and agree upon compensation terms as specified in the relevant sections of this Agreement.\n\n4.2 Payment Terms. Unless otherwise specified, all payments shall be due within thirty (30) days of receipt of invoice.\n\n4.3 Late Payments. Any amounts not paid when due shall bear interest at the rate of 1.5% per month or the maximum rate permitted by law, whichever is less.\n\n4.4 Taxes. Each party shall be responsible for its own taxes arising from this Agreement.`,
      },
      {
        title: "ARTICLE V - INTELLECTUAL PROPERTY",
        content: `5.1 Ownership. Each party shall retain ownership of its pre-existing intellectual property.\n\n5.2 Work Product. Unless otherwise specified, any work product created under this Agreement shall be owned as specified in the relevant provisions.\n\n5.3 License. Each party grants to the other a non-exclusive license to use its intellectual property solely as necessary to perform under this Agreement.`,
      },
      {
        title: "ARTICLE VI - CONFIDENTIALITY",
        content: `6.1 Confidential Information. Each party agrees to hold in confidence all confidential information disclosed by the other party.\n\n6.2 Exceptions. Confidential information does not include information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was rightfully in the receiving party's possession prior to disclosure; (c) is rightfully obtained from a third party without restriction; or (d) is independently developed without use of the disclosing party's confidential information.\n\n6.3 Duration. The obligations of confidentiality shall survive termination of this Agreement for a period of three (3) years.`,
      },
      {
        title: "ARTICLE VII - REPRESENTATIONS AND WARRANTIES",
        content: `7.1 Mutual Representations. Each party represents and warrants that: (a) it has the full right, power, and authority to enter into this Agreement; (b) the execution of this Agreement does not violate any other agreement to which it is a party; and (c) it will comply with all applicable laws in performing under this Agreement.\n\n7.2 Disclaimer. EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, NEITHER PARTY MAKES ANY WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.`,
      },
      {
        title: "ARTICLE VIII - INDEMNIFICATION",
        content: `8.1 Indemnification. Each party agrees to indemnify, defend, and hold harmless the other party from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this Agreement or any negligent or wrongful act or omission.\n\n8.2 Procedure. The indemnified party shall promptly notify the indemnifying party of any claim and shall cooperate in the defense thereof.`,
      },
      {
        title: "ARTICLE IX - LIMITATION OF LIABILITY",
        content: `9.1 Limitation. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, REGARDLESS OF THE CAUSE OF ACTION OR WHETHER SUCH PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.\n\n9.2 Cap. EXCEPT FOR BREACHES OF CONFIDENTIALITY OR INDEMNIFICATION OBLIGATIONS, NEITHER PARTY'S TOTAL LIABILITY UNDER THIS AGREEMENT SHALL EXCEED THE AMOUNTS PAID OR PAYABLE UNDER THIS AGREEMENT.`,
      },
      {
        title: "ARTICLE X - GENERAL PROVISIONS",
        content: `10.1 Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the state specified by the parties, without regard to its conflict of laws principles.\n\n10.2 Dispute Resolution. Any dispute arising out of or relating to this Agreement shall be resolved through good faith negotiations. If the parties are unable to resolve the dispute, it shall be submitted to binding arbitration.\n\n10.3 Assignment. Neither party may assign this Agreement without the prior written consent of the other party, except in connection with a merger, acquisition, or sale of substantially all of its assets.\n\n10.4 Notices. All notices under this Agreement shall be in writing and shall be deemed given when delivered personally, sent by email with confirmation of receipt, or sent by certified mail, return receipt requested.\n\n10.5 Severability. If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.\n\n10.6 Waiver. The failure of either party to enforce any right or provision of this Agreement shall not constitute a waiver of such right or provision.\n\n10.7 Force Majeure. Neither party shall be liable for any failure or delay in performance due to circumstances beyond its reasonable control.\n\n10.8 Counterparts. This Agreement may be executed in counterparts, each of which shall be deemed an original.`,
      },
    ]

    const textContent = `
================================================================================
                              ${contract.name.toUpperCase()}
================================================================================
                    Template Document - Artispreneur Contract Generator
================================================================================


${sections
  .map(
    (section) => `
--------------------------------------------------------------------------------
${section.title}
--------------------------------------------------------------------------------

${section.content}

`,
  )
  .join("\n")}

--------------------------------------------------------------------------------
SIGNATURE BLOCK
--------------------------------------------------------------------------------

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date 
last written below.


Party 1:

_________________________________          
Signature                                  

_________________________________          
Print Name                                 

_________________________________          
Title                                      

_________________________________          
Date                                       


Party 2:

_________________________________
Signature

_________________________________
Print Name

_________________________________
Title

_________________________________
Date


================================================================================
                         Generated by Artispreneur
                    https://artispreneur.com/templates
================================================================================
`

    // Return as downloadable text file (works reliably across all browsers)
    return new NextResponse(textContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${contract.slug}-template.txt"`,
      },
    })
  } catch (error) {
    console.error("Error generating template:", error)
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 })
  }
}
