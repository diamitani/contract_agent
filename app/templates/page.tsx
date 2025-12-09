"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { contractTemplates } from "@/lib/contracts"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileText, Download, Eye, CheckCircle, Mail, ArrowRight, Sparkles, Loader2 } from "lucide-react"
import type { ContractTemplate } from "@/lib/contracts"

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewContract, setPreviewContract] = useState<ContractTemplate | null>(null)
  const [downloadContract, setDownloadContract] = useState<ContractTemplate | null>(null)
  const [emailCaptureOpen, setEmailCaptureOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const categories = Array.from(new Set(contractTemplates.map((c) => c.category)))

  const filteredContracts = contractTemplates.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || contract.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleDownloadClick = (contract: ContractTemplate) => {
    setDownloadContract(contract)
    setEmailCaptureOpen(true)
    setDownloadSuccess(false)
    setErrorMessage("")
  }

  const handlePreviewClick = (contract: ContractTemplate) => {
    setPreviewContract(contract)
    setPreviewOpen(true)
  }

  const generateTemplateText = (contract: ContractTemplate) => {
    const sections = [
      {
        title: "PREAMBLE",
        content: `This ${contract.name} (the "Agreement") is entered into as of the date last signed below (the "Effective Date"), by and between the parties identified in this document.`,
      },
      {
        title: "RECITALS",
        content: `WHEREAS, the parties wish to enter into this Agreement to establish the terms and conditions governing their relationship as it pertains to ${contract.description.toLowerCase()};

WHEREAS, both parties acknowledge that they have read and understood the terms contained herein and agree to be bound by them;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:`,
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
        content: `2.1 Purpose. This Agreement sets forth the complete understanding between the parties regarding ${contract.description.toLowerCase()}.

2.2 Entire Agreement. This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, warranties, and agreements between the parties.

2.3 Amendments. No amendment or modification of this Agreement shall be valid unless made in writing and signed by both parties.`,
      },
      {
        title: "ARTICLE III - TERM AND TERMINATION",
        content: `3.1 Term. This Agreement shall commence on the Effective Date and shall continue until terminated in accordance with the provisions hereof.

3.2 Termination for Convenience. Either party may terminate this Agreement upon thirty (30) days' prior written notice to the other party.

3.3 Termination for Cause. Either party may terminate this Agreement immediately upon written notice if the other party materially breaches any provision of this Agreement and fails to cure such breach within fifteen (15) days after receiving written notice thereof.

3.4 Effect of Termination. Upon termination of this Agreement, each party shall return or destroy all confidential information of the other party in its possession.`,
      },
      {
        title: "ARTICLE IV - COMPENSATION AND PAYMENT",
        content: `4.1 Compensation. The parties shall negotiate and agree upon compensation terms as specified in the relevant sections of this Agreement.

4.2 Payment Terms. Unless otherwise specified, all payments shall be due within thirty (30) days of receipt of invoice.

4.3 Late Payments. Any amounts not paid when due shall bear interest at the rate of 1.5% per month or the maximum rate permitted by law, whichever is less.

4.4 Taxes. Each party shall be responsible for its own taxes arising from this Agreement.`,
      },
      {
        title: "ARTICLE V - INTELLECTUAL PROPERTY",
        content: `5.1 Ownership. Each party shall retain ownership of its pre-existing intellectual property.

5.2 Work Product. Unless otherwise specified, any work product created under this Agreement shall be owned as specified in the relevant provisions.

5.3 License. Each party grants to the other a non-exclusive license to use its intellectual property solely as necessary to perform under this Agreement.`,
      },
      {
        title: "ARTICLE VI - CONFIDENTIALITY",
        content: `6.1 Confidential Information. Each party agrees to hold in confidence all confidential information disclosed by the other party.

6.2 Exceptions. Confidential information does not include information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was rightfully in the receiving party's possession prior to disclosure; (c) is rightfully obtained from a third party without restriction; or (d) is independently developed without use of the disclosing party's confidential information.

6.3 Duration. The obligations of confidentiality shall survive termination of this Agreement for a period of three (3) years.`,
      },
      {
        title: "ARTICLE VII - REPRESENTATIONS AND WARRANTIES",
        content: `7.1 Mutual Representations. Each party represents and warrants that: (a) it has the full right, power, and authority to enter into this Agreement; (b) the execution of this Agreement does not violate any other agreement to which it is a party; and (c) it will comply with all applicable laws in performing under this Agreement.

7.2 Disclaimer. EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, NEITHER PARTY MAKES ANY WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.`,
      },
      {
        title: "ARTICLE VIII - INDEMNIFICATION",
        content: `8.1 Indemnification. Each party agrees to indemnify, defend, and hold harmless the other party from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this Agreement or any negligent or wrongful act or omission.

8.2 Procedure. The indemnified party shall promptly notify the indemnifying party of any claim and shall cooperate in the defense thereof.`,
      },
      {
        title: "ARTICLE IX - LIMITATION OF LIABILITY",
        content: `9.1 Limitation. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, REGARDLESS OF THE CAUSE OF ACTION OR WHETHER SUCH PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

9.2 Cap. EXCEPT FOR BREACHES OF CONFIDENTIALITY OR INDEMNIFICATION OBLIGATIONS, NEITHER PARTY'S TOTAL LIABILITY UNDER THIS AGREEMENT SHALL EXCEED THE AMOUNTS PAID OR PAYABLE UNDER THIS AGREEMENT.`,
      },
      {
        title: "ARTICLE X - GENERAL PROVISIONS",
        content: `10.1 Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the state specified by the parties, without regard to its conflict of laws principles.

10.2 Dispute Resolution. Any dispute arising out of or relating to this Agreement shall be resolved through good faith negotiations. If the parties are unable to resolve the dispute, it shall be submitted to binding arbitration.

10.3 Assignment. Neither party may assign this Agreement without the prior written consent of the other party, except in connection with a merger, acquisition, or sale of substantially all of its assets.

10.4 Notices. All notices under this Agreement shall be in writing and shall be deemed given when delivered personally, sent by email with confirmation of receipt, or sent by certified mail, return receipt requested.

10.5 Severability. If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

10.6 Waiver. The failure of either party to enforce any right or provision of this Agreement shall not constitute a waiver of such right or provision.

10.7 Force Majeure. Neither party shall be liable for any failure or delay in performance due to circumstances beyond its reasonable control.

10.8 Counterparts. This Agreement may be executed in counterparts, each of which shall be deemed an original.`,
      },
      {
        title: "SIGNATURE BLOCK",
        content: `IN WITNESS WHEREOF, the parties have executed this Agreement as of the date last written below.


_________________________________          _________________________________
Party 1 Signature                          Party 2 Signature

_________________________________          _________________________________
Print Name                                 Print Name

_________________________________          _________________________________
Title                                      Title

_________________________________          _________________________________
Date                                       Date`,
      },
    ]

    return sections
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!downloadContract || !name || !email) return

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      // Step 1: Send email, store in Supabase, and trigger webhook
      const sendResponse = await fetch("/api/send-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          contractSlug: downloadContract.slug,
          contractName: downloadContract.name,
        }),
      })

      if (!sendResponse.ok) {
        console.error("Send template API error")
      }

      // Step 2: Generate and download the template
      const response = await fetch("/api/generate-template-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractSlug: downloadContract.slug,
          contractName: downloadContract.name,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate template")
      }

      // Get the text content and create download
      const textContent = await response.text()
      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${downloadContract.slug}-template.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setDownloadSuccess(true)
    } catch (error) {
      console.error("Error downloading template:", error)
      setErrorMessage("There was an error processing your request. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetEmailForm = () => {
    setName("")
    setEmail("")
    setDownloadSuccess(false)
    setErrorMessage("")
    setEmailCaptureOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-chart-5/10 text-chart-5 px-4 py-2 rounded-full mb-6">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Free Contract Templates</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Download Professional Contract Templates
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access our library of {contractTemplates.length}+ industry-standard contract templates. Download for free
            with just your name and email.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className={`cursor-pointer ${
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-secondary"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-secondary"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="bg-card border-border hover:border-primary/50 transition-all group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{contract.category}</Badge>
                    <Badge variant="outline" className="bg-chart-5/10 text-chart-5 border-chart-5/20">
                      Free
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{contract.name}</CardTitle>
                <CardDescription className="line-clamp-2">{contract.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>{contract.fields.length} fields</span>
                  <span>•</span>
                  <span>TXT format</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => handlePreviewClick(contract)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleDownloadClick(contract)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-foreground">No templates found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-12 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Need a Customized Contract?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Use our AI-powered contract generator to create fully customized contracts tailored to your specific needs.
          </p>
          <Button asChild size="lg">
            <a href="/">
              Generate Custom Contract
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* Email Capture Modal */}
      <Dialog open={emailCaptureOpen} onOpenChange={setEmailCaptureOpen}>
        <DialogContent className="sm:max-w-md">
          {!downloadSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Download Free Template</DialogTitle>
                <DialogDescription>
                  Enter your details to download {downloadContract?.name}. We'll also send a copy to your email.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEmailSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={resetEmailForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-chart-5 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Download Complete!</h3>
              <p className="text-muted-foreground mb-4">
                Your template has been downloaded. We've also sent a copy to {email}.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Mail className="w-4 h-4" />
                <span>Check your inbox for the email</span>
              </div>
              <Button onClick={resetEmailForm} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Modal - Full Document Viewer */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">{previewContract?.name}</DialogTitle>
                <DialogDescription>{previewContract?.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {previewContract && (
            <ScrollArea className="flex-1 px-6">
              <div className="bg-white text-black rounded-lg p-8 my-4 shadow-inner min-h-full">
                {/* Contract Header */}
                <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
                  <h1 className="text-2xl font-bold uppercase tracking-wide mb-2">{previewContract.name}</h1>
                  <p className="text-sm text-gray-600">Template Document - Artispreneur</p>
                </div>

                {/* Contract Sections */}
                {generateTemplateText(previewContract).map((section, index) => (
                  <div key={index} className="mb-8">
                    <h2 className="text-lg font-bold uppercase mb-4 text-gray-800 border-b border-gray-200 pb-2">
                      {section.title}
                    </h2>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 font-serif">
                      {section.content}
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center">
                  <p className="text-xs text-gray-500">Generated by Artispreneur Contract Templates</p>
                </div>
              </div>
            </ScrollArea>
          )}

          <div className="flex-shrink-0 flex gap-2 p-6 pt-4 border-t bg-background">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setPreviewOpen(false)
                if (previewContract) handleDownloadClick(previewContract)
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
