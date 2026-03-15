"use client"

import { useState } from "react"
import { HelpCircle, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface FieldExplanationTooltipProps {
  fieldLabel: string
  fieldDescription?: string
  contractType: string
  fieldName: string
}

export function FieldExplanationTooltip({
  fieldLabel,
  fieldDescription,
  contractType,
  fieldName,
}: FieldExplanationTooltipProps) {
  const [open, setOpen] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchExplanation = async () => {
    if (explanation) return // Already loaded

    setLoading(true)
    try {
      const response = await fetch("/api/explain-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldName,
          fieldLabel,
          fieldDescription,
          contractType,
        }),
      })

      const data = await response.json()
      setExplanation(data.explanation)
    } catch (error) {
      console.error("Failed to fetch explanation:", error)
      setExplanation(
        fieldDescription ||
          "This field helps define important details in your contract. Fill it out with accurate information for the best results.",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && !explanation && !loading) {
      fetchExplanation()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            What is "{fieldLabel}"?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            AI-powered explanation in plain language
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Generating explanation...</span>
            </div>
          ) : (
            <div className="bg-secondary/30 rounded-lg p-4 border border-border">
              <p className="text-foreground leading-relaxed">{explanation}</p>
            </div>
          )}

          {fieldDescription && !loading && (
            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              <strong>Technical Note:</strong> {fieldDescription}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
