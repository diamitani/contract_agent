"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { ContractForm } from "@/components/contract-form"
import { GeneratedContractModal } from "@/components/generated-contract-modal"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"
import { getContractBySlug } from "@/lib/contracts"
import { saveContract } from "@/lib/contract-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Eye, Info } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function GenerateContractPage() {
  const params = useParams()
  const slug = params.slug as string
  const { toast } = useToast()
  const contract = getContractBySlug(slug)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedModalOpen, setGeneratedModalOpen] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  if (!contract) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Contract not found</h1>
          <Button asChild>
            <Link href="/">Back to contracts</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (formData: Record<string, string>) => {
    setIsSubmitting(true)
    setGeneratedContent("")
    setIsStreaming(true)
    setGeneratedModalOpen(true)

    try {
      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_type: contract.slug,
          contract_name: contract.name,
          fields: formData,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate contract")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (!data) continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === "delta" && parsed.content) {
                fullContent += parsed.content
                setGeneratedContent(fullContent)
              } else if (parsed.type === "complete") {
                if (parsed.content && !fullContent) {
                  setGeneratedContent(parsed.content)
                }
                setDownloadUrl(parsed.downloadUrl || null)
              } else if (parsed.type === "error") {
                throw new Error(parsed.message)
              }
            } catch {
              // Skip non-JSON data
            }
          }
        }
      }

      setIsStreaming(false)

      if (fullContent) {
        const savedContract = await saveContract({
          title: contract.name,
          contract_type: contract.slug,
          content: fullContent,
          form_data: formData,
          status: "completed",
        })

        if (savedContract) {
          toast({
            title: "Contract Generated & Saved!",
            description: "Your contract has been saved to your dashboard.",
          })
        } else {
          toast({
            title: "Contract Generated!",
            description: "Sign in to save contracts to your dashboard.",
          })
        }
      }
    } catch (error) {
      console.error("Error generating contract:", error)
      setIsStreaming(false)

      // Fallback to mock generation
      const mockContent = generateMockContract(contract.name, formData)
      setGeneratedContent(mockContent)

      // Try to save the mock contract too
      await saveContract({
        title: contract.name,
        contract_type: contract.slug,
        content: mockContent,
        form_data: formData,
        status: "completed",
      })

      toast({
        title: "Contract Generated",
        description: "Generated with fallback template.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to contracts
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contract Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-24">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    {contract.category}
                  </Badge>
                </div>
                <CardTitle className="text-foreground text-xl">{contract.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{contract.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <span>{contract.fields.length} fields to complete</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>All fields are optional</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-border hover:bg-secondary bg-transparent"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Template
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <ContractForm contract={contract} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>
        </div>
      </div>

      <GeneratedContractModal
        open={generatedModalOpen}
        onOpenChange={setGeneratedModalOpen}
        contractName={contract.name}
        generatedContent={generatedContent}
        downloadUrl={downloadUrl}
        isStreaming={isStreaming}
      />

      <PDFPreviewModal contract={contract} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}

function generateMockContract(name: string, data: Record<string, string>): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  let content = `${name.toUpperCase()}\n\n`
  content += `Generated on: ${date}\n\n`
  content += `${"=".repeat(50)}\n\n`

  content += `This Agreement is entered into as of the date set forth below.\n\n`

  content += `PARTIES:\n\n`

  Object.entries(data).forEach(([key, value]) => {
    if (value) {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      content += `${label}: ${value}\n`
    }
  })

  content += `\n${"=".repeat(50)}\n\n`
  content += `TERMS AND CONDITIONS:\n\n`
  content += `1. This agreement shall be binding upon execution by both parties.\n\n`
  content += `2. All parties agree to the terms and conditions set forth herein.\n\n`
  content += `3. This agreement shall be governed by applicable law.\n\n`
  content += `${"=".repeat(50)}\n\n`
  content += `SIGNATURES:\n\n`
  content += `_______________________          _______________________\n`
  content += `Party 1                          Party 2\n\n`
  content += `Date: _____________              Date: _____________\n`

  return content
}
