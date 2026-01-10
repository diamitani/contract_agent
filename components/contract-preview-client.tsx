"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Loader2, Lock, Download, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ContractTemplate } from "@/lib/contracts"

interface ContractPreviewClientProps {
  contract: ContractTemplate
  formData: Record<string, string>
}

export default function ContractPreviewClient({ contract, formData }: ContractPreviewClientProps) {
  const router = useRouter()
  const [contractContent, setContractContent] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function generatePreview() {
      try {
        const response = await fetch("/api/generate-contract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contract_type: contract.category,
            contract_name: contract.name,
            fields: formData,
            timestamp: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate preview")
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ""

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.type === "delta") {
                    fullContent += data.content
                    setContractContent(fullContent)
                  } else if (data.type === "complete") {
                    fullContent = data.content
                    setContractContent(fullContent)
                  } else if (data.type === "error") {
                    throw new Error(data.message)
                  }
                } catch (e) {
                  console.error("[v0] Parse error:", e)
                }
              }
            }
          }
        }

        setIsGenerating(false)
      } catch (err) {
        console.error("[v0] Preview generation error:", err)
        setError(String(err))
        setIsGenerating(false)
      }
    }

    generatePreview()
  }, [contract, formData])

  const handleClose = () => {
    router.back()
  }

  const handlePurchase = () => {
    // Save form data to localStorage and redirect to payment
    localStorage.setItem(`contract_form_${contract.slug}`, JSON.stringify(formData))
    router.push(`/generate/${contract.slug}?from_preview=true`)
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-secondary">
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{contract.name} - Preview</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Watermarked preview - Purchase to unlock full contract
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose} className="border-border bg-transparent">
              Close Preview
            </Button>
            <Button onClick={handlePurchase} className="bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Purchase & Download - $19.99
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Warning banner */}
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-500 mb-1">Preview Only - Not for Legal Use</h3>
                <p className="text-sm text-muted-foreground">
                  This is a watermarked preview. Purchase the contract to receive a clean, legally-binding document
                  without watermarks that you can download, print, and use.
                </p>
              </div>
            </div>
          </div>

          {/* Contract content */}
          <div className="relative bg-white text-black p-12 shadow-2xl rounded-lg min-h-[1000px]">
            {/* Watermark overlays */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-bold opacity-5 whitespace-nowrap -rotate-45"
                style={{ textShadow: "0 0 20px rgba(0,0,0,0.1)" }}
              >
                PREVIEW ONLY
              </div>
              <div
                className="absolute top-2/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-bold opacity-5 whitespace-nowrap -rotate-45"
                style={{ textShadow: "0 0 20px rgba(0,0,0,0.1)" }}
              >
                NOT FOR LEGAL USE
              </div>
              <div
                className="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-bold opacity-5 whitespace-nowrap -rotate-45"
                style={{ textShadow: "0 0 20px rgba(0,0,0,0.1)" }}
              >
                PREVIEW ONLY
              </div>
            </div>

            {/* Prevent selection and copying */}
            <style jsx>{`
              .preview-content {
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
              }
            `}</style>

            <div
              className="preview-content relative z-10"
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            >
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-semibold text-gray-800">Generating your contract preview...</p>
                  <p className="text-sm text-gray-600 mt-2">This may take a moment</p>
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-red-600 font-semibold mb-2">Failed to generate preview</p>
                  <p className="text-gray-600 text-sm">{error}</p>
                  <Button onClick={handleClose} className="mt-4">
                    Go Back
                  </Button>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-serif leading-relaxed" style={{ fontSize: "11pt" }}>
                  {contractContent}
                </div>
              )}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 bg-card border border-border rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to use this contract?</h3>
            <p className="text-muted-foreground mb-4">
              Purchase now to receive a clean, watermark-free version you can download and use immediately.
            </p>
            <Button onClick={handlePurchase} size="lg" className="bg-primary hover:bg-primary/90">
              Purchase for $19.99
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
