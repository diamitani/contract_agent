"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Mail, CheckCircle, Copy, FileText, Loader2, Maximize2, Minimize2, X } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface GeneratedContractModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractName: string
  generatedContent: string | null
  downloadUrl: string | null
  isStreaming?: boolean
}

export function GeneratedContractModal({
  open,
  onOpenChange,
  contractName,
  generatedContent,
  downloadUrl,
  isStreaming = false,
}: GeneratedContractModalProps) {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { toast } = useToast()

  const handleSendEmail = async () => {
    if (!email) return
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSending(false)
    setSent(true)
    toast({
      title: "Contract Sent!",
      description: `The contract has been sent to ${email}`,
    })
  }

  const handleCopyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent)
      toast({
        title: "Copied!",
        description: "Contract content copied to clipboard",
      })
    }
  }

  const handleDownloadPdf = async () => {
    if (!generatedContent) return

    setGeneratingPdf(true)

    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: generatedContent,
          contractName: contractName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const data = await response.json()
      const blob = new Blob([data.html], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank")

      if (printWindow) {
        toast({
          title: "PDF Ready",
          description: "Use Print (Ctrl/Cmd + P) and select 'Save as PDF' to download",
        })
      } else {
        const link = document.createElement("a")
        link.href = url
        link.download = data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast({
          title: "Downloaded",
          description: "Open the HTML file and print to save as PDF",
        })
      }

      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] PDF generation error:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handleDownloadText = () => {
    if (!generatedContent) return
    const blob = new Blob([generatedContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${contractName?.replace(/\s+/g, "_") || "contract"}_${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({
      title: "Downloaded",
      description: "Contract saved as text file",
    })
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{contractName}</h2>
            {isStreaming && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
              disabled={!generatedContent || isStreaming}
              className="border-border bg-transparent"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadText}
              disabled={!generatedContent || isStreaming}
              className="border-border bg-transparent"
            >
              <FileText className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPdf}
              disabled={generatingPdf || !generatedContent || isStreaming}
              className="bg-primary text-primary-foreground"
            >
              {generatingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)} className="ml-2">
              <Minimize2 className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsFullscreen(false)
                onOpenChange(false)
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-secondary/20">
          <div className="max-w-4xl mx-auto bg-card rounded-lg shadow-lg p-8 min-h-full">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {generatedContent || "Generating contract..."}
              {isStreaming && <span className="animate-pulse">▊</span>}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] bg-card border-border flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-foreground flex items-center gap-2">
            {isStreaming ? (
              <>
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                Generating Contract...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-primary" />
                Contract Generated Successfully
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isStreaming
              ? `Generating your ${contractName}... Please wait.`
              : `Your ${contractName} has been generated and is ready to download`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          <div className="flex-1 relative bg-secondary/30 rounded-lg overflow-hidden min-h-0">
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="bg-card/80 backdrop-blur-sm hover:bg-card"
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Expand Full Document
              </Button>
            </div>

            <div className="absolute inset-0 overflow-auto p-6">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {generatedContent || "Contract content will appear here..."}
                {isStreaming && <span className="animate-pulse">▊</span>}
              </pre>
            </div>
          </div>

          <div className="flex-shrink-0 grid grid-cols-3 gap-3">
            <Button
              onClick={handleCopyContent}
              variant="outline"
              disabled={!generatedContent || isStreaming}
              className="border-border hover:bg-secondary bg-transparent"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Content
            </Button>

            <Button
              onClick={handleDownloadText}
              variant="outline"
              disabled={!generatedContent || isStreaming}
              className="border-border hover:bg-secondary bg-transparent"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download Text
            </Button>

            <Button
              onClick={handleDownloadPdf}
              disabled={generatingPdf || !generatedContent || isStreaming}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {generatingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>

          <div className="flex-shrink-0 border-t border-border pt-4">
            <Label className="text-foreground mb-2 block">Send contract via email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="recipient@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                disabled={isStreaming}
              />
              <Button
                onClick={handleSendEmail}
                disabled={!email || sending || sent || isStreaming}
                variant="outline"
                className="border-border hover:bg-secondary bg-transparent"
              >
                {sent ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sent
                  </>
                ) : sending ? (
                  "Sending..."
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
