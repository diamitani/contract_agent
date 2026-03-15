"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Eye, Lock, Crown, Loader2, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

interface WatermarkedContractPreviewProps {
  contractContent: string
  contractName: string
  isPaid: boolean
  onUpgrade?: () => void
}

export function WatermarkedContractPreview({
  contractContent,
  contractName,
  isPaid,
  onUpgrade,
}: WatermarkedContractPreviewProps) {
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const router = useRouter()

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true)
    try {
      const response = await fetch("/api/generate-pdf-watermarked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: contractContent,
          contractName,
          watermark: !isPaid,
        }),
      })

      const data = await response.json()

      if (data.success && data.pdf) {
        // Convert base64 to blob
        const byteCharacters = atob(data.pdf)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: "application/pdf" })

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("PDF download error:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <div className="space-y-4">
      {!isPaid && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Preview Mode
            </CardTitle>
            <CardDescription className="text-foreground/80">
              This is a watermarked preview. Upgrade to download the official contract without watermarks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button onClick={onUpgrade} className="bg-gradient-to-r from-primary to-amber-500 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Remove Watermark
              </Button>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">$19.99</span> one-time or{" "}
                <span className="font-semibold text-amber-500">$9.99/mo</span> unlimited
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border relative overflow-hidden">
        {!isPaid && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="text-9xl font-bold text-border/30 rotate-[-45deg] select-none">PREVIEW</div>
          </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {contractName}
            </span>
            {isPaid && (
              <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`prose prose-sm max-w-none ${!isPaid ? "opacity-70" : ""}`}
            style={{
              maxHeight: "500px",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              fontFamily: "serif",
            }}
          >
            {contractContent}
          </div>

          <div className="flex gap-2 mt-6 pt-4 border-t border-border">
            <Button onClick={handleDownloadPDF} disabled={generatingPDF} className="flex-1">
              {generatingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download {!isPaid ? "Preview " : ""}PDF
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Eye className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>

          {!isPaid && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Downloaded PDFs will include "PREVIEW COPY" watermarks. Purchase to get the official version.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
