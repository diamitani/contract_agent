"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { FileText, Brain, Loader2, ChevronDown, ChevronUp, Lock, Sparkles } from "lucide-react"
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

interface Analysis {
  overview: string
  sections: ContractSection[]
}

export function PDFPreviewModal({ contract, open, onOpenChange }: PDFPreviewModalProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [aiModel, setAiModel] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]))
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!contract) return
    setAnalyzing(true)
    setError(null)

    try {
      const res = await fetch("/api/analyze-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractName: contract.name,
          contractType: contract.category,
          description: contract.description,
          fields: contract.fields,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setAnalysis(data.analysis)
      setAiModel(data.model)
      // Auto-expand first section
      setExpandedSections(new Set([0]))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  const toggleSection = (index: number) => {
    const next = new Set(expandedSections)
    if (next.has(index)) {
      next.delete(index)
    } else {
      next.add(index)
    }
    setExpandedSections(next)
  }

  if (!contract) return null

  const sampleContent = getSampleContractContent(contract.slug, contract.name)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {contract.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Preview the template structure — purchase to get your customized contract
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

          {/* Preview Tab */}
          <TabsContent value="preview" className="flex-1 mt-4 overflow-hidden flex flex-col">
            <ScrollArea className="h-[calc(70vh-12rem)]">
              <div className="relative bg-secondary/50 rounded-lg p-6">
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-10">
                  <div className="text-6xl font-bold text-foreground rotate-[-45deg] select-none">SAMPLE PREVIEW</div>
                </div>
                <div className="absolute top-20 right-20 pointer-events-none z-10 opacity-5">
                  <Lock className="w-32 h-32 text-foreground" />
                </div>
                <div className="absolute bottom-20 left-20 pointer-events-none z-10 opacity-5">
                  <Lock className="w-32 h-32 text-foreground" />
                </div>

                <div
                  className="prose prose-invert max-w-none select-none"
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                  onCopy={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div dangerouslySetInnerHTML={{ __html: sampleContent }} />
                </div>

                <div className="sticky bottom-0 left-0 right-0 bg-primary/20 backdrop-blur-sm border-t border-primary/30 p-3 mt-6 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Sample preview only. Purchase to generate your customized contract.</span>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4 flex-shrink-0">
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <a href={`/generate/${contract.slug}`}>Fill Out &amp; Generate</a>
              </Button>
            </div>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="analysis" className="flex-1 mt-4 flex flex-col overflow-hidden">
            {!analysis && !analyzing && (
              <div className="flex flex-col items-center justify-center flex-1 bg-secondary/50 rounded-lg py-12">
                <Brain className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">AI Contract Analysis</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6 text-sm">
                  Get an intelligent, real-time breakdown of this contract type — key sections, what to watch for, and practical insights powered by DeepSeek AI.
                </p>
                {error && (
                  <p className="text-destructive text-sm mb-4">{error}</p>
                )}
                <Button onClick={handleAnalyze} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze with AI
                </Button>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-center justify-center flex-1 bg-secondary/50 rounded-lg py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-foreground font-medium">Analyzing contract structure...</p>
                <p className="text-sm text-muted-foreground mt-1">DeepSeek AI is reviewing this contract type</p>
              </div>
            )}

            {analysis && (
              <ScrollArea className="flex-1 bg-secondary/50 rounded-lg p-6">
                <div className="space-y-6">
                  {/* Overview */}
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-primary">Contract Overview</h3>
                      {aiModel && (
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary/70">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {aiModel === "azure-foundry" ? "DeepSeek V3.2" : aiModel === "deepseek" ? "DeepSeek V3" : aiModel}
                        </Badge>
                      )}
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{analysis.overview}</p>
                  </div>

                  {/* Section Breakdown */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Section Breakdown</h3>
                    {analysis.sections.map((section, index) => (
                      <div key={index} className="bg-card rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() => toggleSection(index)}
                          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <span className="font-medium text-foreground">{section.title}</span>
                          {expandedSections.has(index) ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </button>
                        {expandedSections.has(index) && (
                          <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                            <p className="text-muted-foreground text-sm">{section.content}</p>
                            <div className="bg-accent/10 rounded-md p-3">
                              <p className="text-sm text-accent font-medium mb-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> AI Insight
                              </p>
                              <p className="text-sm text-foreground">{section.analysis}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                      <a href={`/generate/${contract.slug}`}>Generate My {contract.name}</a>
                    </Button>
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
      <p><strong>SPONSOR:</strong> <strong>[SPONSOR_NAME]</strong>, a company incorporated in the State of <strong>[SPONSOR_STATE]</strong></p>
      <p><strong>INFLUENCER:</strong> <strong>[INFLUENCER_NAME]</strong>, residing at <strong>[INFLUENCER_ADDRESS]</strong></p>
      <h3>1. SPONSORSHIP TERMS</h3>
      <p>The Sponsor hereby engages the Influencer to promote: <strong>[GOODS_DESCRIPTION]</strong></p>
      <h3>2. COMPENSATION</h3>
      <p>Sponsor shall pay Influencer <strong>[PAYMENT_AMOUNT]</strong> per <strong>[PAYMENT_SCHEDULE]</strong></p>
      <h3>3. TERM AND TERMINATION</h3>
      <p>This Agreement shall commence on the Effective Date and continue until <strong>[TERMINATION_DATE]</strong>...</p>
      <h3>4. FTC COMPLIANCE</h3>
      <p>Influencer agrees to comply with all Federal Trade Commission (FTC) guidelines...</p>
      <p><em>[Additional terms and signature blocks follow in full contract...]</em></p>
    `,
    "production-agreement": `
      <h2>${name}</h2>
      <p><strong>SAMPLE TEMPLATE PREVIEW</strong></p>
      <hr />
      <p>This MUSIC PRODUCTION AGREEMENT is made as of <strong>[EFFECTIVE_DATE]</strong> between:</p>
      <p><strong>PRODUCER:</strong> <strong>[PRODUCER_NAME]</strong></p>
      <p><strong>CLIENT:</strong> <strong>[CLIENT_NAME]</strong></p>
      <h3>1. PRODUCTION SERVICES</h3>
      <p>Producer agrees to deliver: <strong>[PRODUCTION_SERVICES]</strong></p>
      <h3>2. COMPENSATION</h3>
      <p>Client shall pay Producer a fee of <strong>[FIXED_FEE]</strong></p>
      <h3>3. INTELLECTUAL PROPERTY RIGHTS</h3>
      <p>All work created shall be considered "work made for hire"...</p>
      <h3>4. ROYALTIES</h3>
      <p>Producer shall be entitled to: <strong>[ROYALTIES]</strong></p>
      <p><em>[Additional terms and signature blocks follow in full contract...]</em></p>
    `,
  }

  return sampleContracts[slug] || `
    <h2>${name}</h2>
    <p><strong>SAMPLE TEMPLATE PREVIEW</strong></p>
    <hr />
    <p>This Agreement is entered into as of <strong>[DATE]</strong> by and between the parties identified herein.</p>
    <h3>PARTIES</h3>
    <p>Identifies the contracting parties and their respective roles...</p>
    <h3>SCOPE OF SERVICES</h3>
    <p>Outlines the specific services, deliverables, or obligations each party agrees to provide...</p>
    <h3>COMPENSATION</h3>
    <p>Details regarding payment terms, amounts, schedules, and additional financial arrangements...</p>
    <h3>TERM AND TERMINATION</h3>
    <p>The duration of this agreement and conditions under which either party may terminate...</p>
    <h3>INTELLECTUAL PROPERTY</h3>
    <p>Provisions regarding ownership, usage rights, and licensing of intellectual property...</p>
    <h3>CONFIDENTIALITY</h3>
    <p>Obligations to maintain confidentiality of sensitive information disclosed...</p>
    <h3>GOVERNING LAW</h3>
    <p>The jurisdiction and laws governing the interpretation and enforcement of this agreement...</p>
    <p><em>[Full legal text and signature blocks in generated contract...]</em></p>
  `
}
