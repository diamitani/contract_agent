"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Brain, Loader2, ChevronDown, ChevronUp, Lock } from "lucide-react"
import type { ContractTemplate } from "@/lib/contracts"

interface PDFPreviewModalProps {
  contract: ContractTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ContractSection {
  title: string
  content: string
  analysis: string
}

export function PDFPreviewModal({ contract, open, onOpenChange }: PDFPreviewModalProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<{ overview: string; sections: ContractSection[] } | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const handleAnalyze = async () => {
    if (!contract) return
    setAnalyzing(true)

    // Simulate AI analysis (in production, this would call your OpenAI assistant)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockAnalysis = getContractAnalysis(contract.slug)
    setAnalysis(mockAnalysis)
    setAnalyzing(false)
  }

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  console.log("[v0] PDFPreviewModal render", { contractName: contract?.name, open })

  if (!contract) return null

  const sampleContent = getSampleContractContent(contract.slug, contract.name)
  console.log("[v0] Sample content generated", { slug: contract.slug, contentLength: sampleContent.length })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {contract.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Preview the template structure - purchase to get your customized contract
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-secondary">
            <TabsTrigger
              value="preview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Template Preview
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              AI Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 mt-4 overflow-hidden flex flex-col">
            <ScrollArea className="h-[calc(70vh-12rem)]">
              <div className="relative bg-secondary/50 rounded-lg p-6">
                {/* Watermark overlays */}
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-10">
                  <div className="text-6xl font-bold text-foreground rotate-[-45deg] select-none">SAMPLE PREVIEW</div>
                </div>
                <div className="absolute top-20 right-20 pointer-events-none z-10 opacity-5">
                  <Lock className="w-32 h-32 text-foreground" />
                </div>
                <div className="absolute bottom-20 left-20 pointer-events-none z-10 opacity-5">
                  <Lock className="w-32 h-32 text-foreground" />
                </div>

                {/* Non-copyable content */}
                <div
                  className="prose prose-invert max-w-none select-none"
                  style={{
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    MozUserSelect: "none",
                    msUserSelect: "none",
                  }}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div dangerouslySetInnerHTML={{ __html: sampleContent }} />
                </div>

                {/* Bottom watermark banner */}
                <div className="sticky bottom-0 left-0 right-0 bg-primary/20 backdrop-blur-sm border-t border-primary/30 p-3 mt-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Lock className="w-4 h-4" />
                      <span>This is a sample preview. Purchase to generate your customized contract.</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4 flex-shrink-0">
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <a href={`/generate/${contract.slug}`}>Fill Out & Generate</a>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 mt-4">
            {!analysis && !analyzing && (
              <div className="flex flex-col items-center justify-center h-[50vh] bg-secondary/50 rounded-lg">
                <Brain className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">AI Contract Analysis</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Get an intelligent breakdown of this contract, including what each section means and key points to
                  consider.
                </p>
                <Button onClick={handleAnalyze} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Contract
                </Button>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-center justify-center h-[50vh] bg-secondary/50 rounded-lg">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-foreground">Analyzing contract structure...</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
              </div>
            )}

            {analysis && (
              <ScrollArea className="h-[50vh] bg-secondary/50 rounded-lg p-6">
                <div className="space-y-6">
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <h3 className="text-lg font-semibold text-primary mb-2">Contract Overview</h3>
                    <p className="text-foreground">{analysis.overview}</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Section Breakdown</h3>
                    {analysis.sections.map((section, index) => (
                      <div key={index} className="bg-card rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() => toggleSection(index)}
                          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                        >
                          <span className="font-medium text-foreground">{section.title}</span>
                          {expandedSections.has(index) ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        {expandedSections.has(index) && (
                          <div className="px-4 pb-4 border-t border-border pt-4">
                            <p className="text-muted-foreground text-sm mb-3">{section.content}</p>
                            <div className="bg-accent/10 rounded-md p-3">
                              <p className="text-sm text-accent font-medium mb-1">AI Insight:</p>
                              <p className="text-sm text-foreground">{section.analysis}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function getSampleContractContent(slug: string, name: string): string {
  const sampleContracts: Record<string, string> = {
    "influencer-agreement": `
      <h2>${name}</h2>
      <p><strong>SAMPLE TEMPLATE PREVIEW</strong></p>
      <hr />
      
      <p>This INFLUENCER AGREEMENT (the "Agreement") is entered into as of <strong>[EFFECTIVE_DATE]</strong> by and between:</p>
      
      <p><strong>SPONSOR:</strong> <strong>[SPONSOR_NAME]</strong>, a company incorporated in the State of <strong>[SPONSOR_STATE]</strong>, with its principal place of business at <strong>[SPONSOR_ADDRESS]</strong> (the "Sponsor")</p>
      
      <p><strong>INFLUENCER:</strong> <strong>[INFLUENCER_NAME]</strong>, residing at <strong>[INFLUENCER_ADDRESS]</strong> (the "Influencer")</p>
      
      <h3>1. SPONSORSHIP TERMS</h3>
      <p>The Sponsor hereby engages the Influencer to promote the following goods: <strong>[GOODS_DESCRIPTION]</strong></p>
      
      <p>The Influencer agrees to display and promote such goods through the following social media platforms: <strong>[SOCIAL_PLATFORMS]</strong></p>
      
      <h3>2. COMPENSATION</h3>
      <p>In consideration for the services rendered, Sponsor shall pay Influencer the sum of <strong>[PAYMENT_AMOUNT]</strong> according to the following schedule: <strong>[PAYMENT_SCHEDULE]</strong></p>
      
      <h3>3. TERM AND TERMINATION</h3>
      <p>This Agreement shall commence on the Effective Date and continue until <strong>[TERMINATION_DATE]</strong>, unless earlier terminated as provided herein...</p>
      
      <h3>4. FTC COMPLIANCE</h3>
      <p>Influencer agrees to comply with all Federal Trade Commission (FTC) guidelines regarding disclosure of sponsored content...</p>
      
      <h3>5. INTELLECTUAL PROPERTY</h3>
      <p>Each party retains ownership of their respective intellectual property. Limited licenses are granted for the purposes of this Agreement...</p>
      
      <p><em>[Additional terms and conditions continue below...]</em></p>
    `,
    "production-agreement": `
      <h2>${name}</h2>
      <p><strong>SAMPLE TEMPLATE PREVIEW</strong></p>
      <hr />
      
      <p>This MUSIC PRODUCTION AGREEMENT (the "Agreement") is made and entered into as of <strong>[EFFECTIVE_DATE]</strong>, in the State of <strong>[STATE]</strong>, by and between:</p>
      
      <p><strong>PRODUCER:</strong> <strong>[PRODUCER_NAME]</strong>, with an address at <strong>[PRODUCER_ADDRESS]</strong></p>
      
      <p><strong>CLIENT:</strong> <strong>[CLIENT_NAME]</strong>, with an address at <strong>[CLIENT_ADDRESS]</strong></p>
      
      <h3>1. PRODUCTION SERVICES</h3>
      <p>Producer agrees to provide the following production services: <strong>[PRODUCTION_SERVICES]</strong></p>
      
      <p>Services shall commence on <strong>[COMMENCEMENT_DATE]</strong> and shall meet the following specifications: <strong>[SPECIFICATIONS]</strong></p>
      
      <h3>2. COMPENSATION</h3>
      <p>Client agrees to pay Producer a fixed fee of <strong>[FIXED_FEE]</strong> for the services described herein.</p>
      
      <p>Payment shall be made via <strong>[PAYMENT_METHOD]</strong> within <strong>[INVOICE_PERIOD]</strong> of receipt of invoice...</p>
      
      <h3>3. INTELLECTUAL PROPERTY RIGHTS</h3>
      <p>All work created under this Agreement shall be considered "work made for hire" and shall be the exclusive property of Client...</p>
      
      <h3>4. ROYALTIES</h3>
      <p>Producer shall be entitled to the following royalties: <strong>[ROYALTIES]</strong></p>
      
      <p><em>[Additional terms including credits, termination, and representations continue...]</em></p>
    `,
  }

  // Default sample content for contracts not specified above
  const defaultContent = `
    <h2>${name}</h2>
    <p><strong>SAMPLE TEMPLATE PREVIEW</strong></p>
    <hr />
    
    <p>This Agreement (the "Agreement") is entered into as of <strong>[DATE]</strong> by and between the parties identified herein.</p>
    
    <h3>PARTIES</h3>
    <p>This section identifies the contracting parties and their respective roles and contact information...</p>
    
    <h3>SCOPE OF SERVICES/WORK</h3>
    <p>This section outlines the specific services, deliverables, or obligations each party agrees to provide...</p>
    
    <h3>COMPENSATION</h3>
    <p>Details regarding payment terms, amounts, schedules, and any additional financial arrangements...</p>
    
    <h3>TERM AND TERMINATION</h3>
    <p>The duration of this agreement and conditions under which either party may terminate...</p>
    
    <h3>INTELLECTUAL PROPERTY</h3>
    <p>Provisions regarding ownership, usage rights, and licensing of any intellectual property created or used...</p>
    
    <h3>CONFIDENTIALITY</h3>
    <p>Obligations to maintain confidentiality of sensitive information disclosed during the term...</p>
    
    <h3>REPRESENTATIONS AND WARRANTIES</h3>
    <p>Each party's assurances regarding their authority, capabilities, and compliance with applicable laws...</p>
    
    <h3>INDEMNIFICATION</h3>
    <p>Agreement to protect and hold harmless against certain liabilities and claims...</p>
    
    <h3>GOVERNING LAW</h3>
    <p>The jurisdiction and laws that will govern the interpretation and enforcement of this agreement...</p>
    
    <p><em>[Additional standard terms and signature blocks follow...]</em></p>
  `

  return sampleContracts[slug] || defaultContent
}

function getContractAnalysis(slug: string): { overview: string; sections: ContractSection[] } {
  const analyses: Record<string, { overview: string; sections: ContractSection[] }> = {
    "influencer-agreement": {
      overview:
        "This is a sponsorship agreement designed for social media influencers promoting products or services. It establishes the relationship between a brand (Sponsor) and content creator (Influencer), covering compensation, content requirements, and legal protections.",
      sections: [
        {
          title: "Sponsorship Terms",
          content: "Defines the goods being promoted and the channels for display.",
          analysis: "Ensure the goods description is specific to avoid disputes about what must be promoted.",
        },
        {
          title: "Term & Termination",
          content: "Sets the agreement duration and conditions for early termination.",
          analysis:
            "The 60-day notice for termination is industry standard. Material breach allows immediate termination.",
        },
        {
          title: "Exclusivity",
          content: "Clarifies that both parties can work with others.",
          analysis: "Non-exclusive agreements are more flexible but may reduce the sponsorship value.",
        },
        {
          title: "FTC Compliance",
          content: "Requires disclosure of the sponsored relationship.",
          analysis: "Critical for legal compliance. Failure to disclose can result in FTC penalties for both parties.",
        },
        {
          title: "Payment Terms",
          content: "Outlines compensation structure and payment schedule.",
          analysis: "Ensure payment terms are clear and include late payment provisions.",
        },
        {
          title: "Intellectual Property",
          content: "Grants limited licenses for using each party's IP.",
          analysis:
            "The licenses are revocable and terminate with the agreement - important for protecting your brand.",
        },
      ],
    },
    "production-agreement": {
      overview:
        "A music production agreement that establishes the working relationship between a music producer and their client. It covers service scope, payment terms, intellectual property ownership, and project specifications.",
      sections: [
        {
          title: "Production Services",
          content: "Defines exactly what services the producer will provide.",
          analysis: "Be specific about deliverables - number of tracks, mixing, mastering, etc.",
        },
        {
          title: "Fees & Payment",
          content: "Establishes the fixed fee and payment schedule.",
          analysis: "Consider including milestone payments for larger projects to manage cash flow.",
        },
        {
          title: "Intellectual Property",
          content: "Work-made-for-hire provision transfers IP to client.",
          analysis: "Important: Producer should negotiate credits even if IP transfers to client.",
        },
        {
          title: "Royalties",
          content: "Additional compensation based on sales or streaming.",
          analysis: "Producer royalties typically range from 2-4% - negotiate based on your contribution level.",
        },
        {
          title: "Termination",
          content: "Conditions under which either party can end the agreement.",
          analysis: "Both parties have termination rights - ensure clear deliverable milestones.",
        },
      ],
    },
    "artist-management-agreement": {
      overview:
        "A comprehensive management contract that establishes the relationship between an artist and their manager. It covers the manager's duties, compensation structure, term length, and fiduciary responsibilities.",
      sections: [
        {
          title: "Manager Services",
          content: "Outlines the advice, guidance, and representation services.",
          analysis: "The scope is broad - ensure your manager has the network and expertise for your genre.",
        },
        {
          title: "Rights & Authority",
          content: "Power of attorney and decision-making authority.",
          analysis: "This grants significant power - ensure major decisions require your approval.",
        },
        {
          title: "Term & Options",
          content: "Initial 6-month term with renewal options.",
          analysis: "Short initial term is artist-friendly; allows evaluation before long-term commitment.",
        },
        {
          title: "Commission Structure",
          content: "20% of gross monthly earnings.",
          analysis: "20% is industry standard; some managers charge 15-25% depending on services.",
        },
        {
          title: "Post-Term Payments",
          content: "Manager continues receiving 10% for 1 year after termination.",
          analysis: "Sunset clause protects manager investment; ensure it's reasonable in duration.",
        },
        {
          title: "Fiduciary Duty",
          content: "Manager held to highest standards of good faith.",
          analysis: "Critical protection - managers must act in your best interest, not their own.",
        },
      ],
    },
  }

  return (
    analyses[slug] || {
      overview:
        "This contract establishes a professional relationship between the parties, defining rights, obligations, compensation, and terms of engagement.",
      sections: [
        {
          title: "Parties & Purpose",
          content: "Identifies who is involved and the reason for the agreement.",
          analysis: "Ensure all party information is accurate and complete.",
        },
        {
          title: "Terms & Conditions",
          content: "Core obligations and requirements for each party.",
          analysis: "Read carefully and ensure you can fulfill all requirements.",
        },
        {
          title: "Compensation",
          content: "Payment terms and any additional financial considerations.",
          analysis: "Clarify payment timeline and any conditions for payment.",
        },
        {
          title: "Termination",
          content: "How and when the agreement can be ended.",
          analysis: "Understand your exit options before signing.",
        },
      ],
    }
  )
}
