"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, FileText, Brain, Loader2, ChevronDown, ChevronUp } from "lucide-react"
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

  if (!contract) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {contract.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Preview the template and get AI-powered analysis
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
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

          <TabsContent value="preview" className="flex-1 mt-4">
            <div className="bg-secondary/50 rounded-lg p-6 h-[50vh] overflow-auto">
              <div className="prose prose-invert max-w-none">
                <h2 className="text-foreground">{contract.name}</h2>
                <p className="text-muted-foreground">{contract.description}</p>
                <hr className="border-border my-4" />
                <h3 className="text-foreground">Required Information</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  The following fields will need to be completed to generate this contract:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {contract.fields.map((field) => (
                    <div key={field.id} className="bg-card rounded-md p-3 border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{field.label}</span>
                        {field.required && <span className="text-xs text-primary">Required</span>}
                      </div>
                      {field.description && <p className="text-xs text-muted-foreground mt-1">{field.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="border-border hover:bg-secondary bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Download Template
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
