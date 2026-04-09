"use client"

import { useState } from "react"
import { Loader2, Mail, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

interface OAuthButtonsProps {
  redirectPath: string
  mode: "signin" | "signup"
}

export function OAuthButtons({ redirectPath, mode }: OAuthButtonsProps) {
  const [oauthLoading, setOauthLoading] = useState<"google" | "microsoft" | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  const callbackUrl = `${appUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`

  const handleGoogle = async () => {
    setOauthLoading("google")
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(null)
    }
  }

  const handleMicrosoft = () => {
    setOauthLoading("microsoft")
    const next = encodeURIComponent(redirectPath)
    window.location.href = `/api/auth/azure/login?next=${next}`
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: callbackUrl,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess("Check your email to confirm your account, then sign in.")
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        window.location.href = redirectPath
      }
    }

    setEmailLoading(false)
  }

  return (
    <div className="space-y-3">
      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        disabled={!!oauthLoading}
        onClick={handleGoogle}
      >
        {oauthLoading === "google" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
      </Button>

      {/* Email / Password */}
      {!showEmailForm ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={() => setShowEmailForm(true)}
        >
          <Mail className="mr-2 h-4 w-4" />
          {mode === "signup" ? "Sign up with Email" : "Sign in with Email"}
        </Button>
      ) : (
        <form onSubmit={handleEmailSubmit} className="space-y-3 border border-border rounded-lg p-4 bg-secondary/30">
          {mode === "signup" && (
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password" className="text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-500">{success}</p>}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={emailLoading}>
            {emailLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {mode === "signup" ? "Create Account" : "Sign In"}
          </Button>

          <button
            type="button"
            onClick={() => { setShowEmailForm(false); setError(null); setSuccess(null) }}
            className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
          >
            ← Back to other options
          </button>
        </form>
      )}

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      {/* Microsoft (enterprise / existing accounts) */}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full text-muted-foreground"
        disabled={!!oauthLoading}
        onClick={handleMicrosoft}
      >
        {oauthLoading === "microsoft" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
        )}
        Continue with Microsoft
      </Button>
    </div>
  )
}
