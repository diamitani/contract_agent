"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, Loader2 } from "lucide-react"

export function StripePortalButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePortal = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to open billing portal")
        return
      }

      window.location.href = data.url
    } catch {
      setError("Failed to open billing portal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handlePortal}
        disabled={loading}
        className="border-border hover:bg-secondary"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4 mr-1" />
        )}
        Manage Billing
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
