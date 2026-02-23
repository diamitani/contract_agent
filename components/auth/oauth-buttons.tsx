"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OAuthButtonsProps {
  redirectPath: string
  mode: "signin" | "signup"
}

export function OAuthButtons({ redirectPath, mode }: OAuthButtonsProps) {
  const [loading, setLoading] = useState(false)

  const handleMicrosoftAuth = () => {
    setLoading(true)
    const next = encodeURIComponent(redirectPath)
    window.location.href = `/api/auth/azure/login?next=${next}`
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" className="h-11 w-full" disabled={loading} onClick={handleMicrosoftAuth}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="mr-2">M</span>}
        {mode === "signup" ? "Sign up with Microsoft" : "Sign in with Microsoft"}
      </Button>

      <p className="text-xs text-muted-foreground">Microsoft sign-in is powered by Azure Active Directory B2C.</p>
    </div>
  )
}
