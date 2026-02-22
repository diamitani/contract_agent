"use client"

import { useState } from "react"
import { Apple, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type OAuthProvider = "google" | "apple"

interface OAuthButtonsProps {
  redirectPath: string
  mode: "signin" | "signup"
}

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  google: "Google",
  apple: "Apple",
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" role="img">
      <path
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.6C17 3.5 14.8 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.5 0 9.2-3.9 9.2-9.3 0-.6-.1-1.1-.2-1.6z"
        fill="currentColor"
      />
    </svg>
  )
}

export function OAuthButtons({ redirectPath, mode }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOAuth = async (provider: OAuthProvider) => {
    setLoadingProvider(provider)
    setError(null)

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          ...(provider === "google" && {
            queryParams: {
              prompt: "select_account",
            },
          }),
        },
      })

      if (oauthError) {
        throw oauthError
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start social sign-in"
      setError(message)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuth("google")}
        >
          {loadingProvider === "google" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
          <span className="ml-2">Google</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuth("apple")}
        >
          {loadingProvider === "apple" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Apple className="h-4 w-4" />}
          <span className="ml-2">Apple</span>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with {mode === "signin" ? "email" : "email signup"}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        By continuing with {Object.values(PROVIDER_LABELS).join(" or ")}, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  )
}
