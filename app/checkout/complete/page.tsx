"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, ArrowRight, FileText, Loader2, PartyPopper, Sparkles, Lock } from "lucide-react"
import Link from "next/link"
import confetti from "canvas-confetti"

function CheckoutCompleteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "needs_account" | "processing" | "error">("loading")
  const [sessionData, setSessionData] = useState<{
    email?: string
    productType?: string
    customerId?: string
  } | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)

  const sessionId = searchParams.get("session_id")
  const contractSlug = searchParams.get("contract")
  const returnToGenerate = searchParams.get("return_generate") === "true"

  useEffect(() => {
    if (!sessionId) {
      router.push("/pricing")
      return
    }

    const checkStatus = async () => {
      try {
        // First check if user is already logged in
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        const res = await fetch(`/api/checkout-status?session_id=${sessionId}`)
        const data = await res.json()

        if (data.status === "complete" && data.payment_status === "paid") {
          setSessionData({
            email: data.customer_email,
            productType: data.product_type,
            customerId: data.customer_id,
          })

          if (user) {
            // User already logged in - go to success
            setStatus("success")
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })
          } else {
            // Guest checkout - need to create account
            setStatus("needs_account")
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })
          }
        } else if (data.status === "open") {
          setStatus("processing")
          setTimeout(checkStatus, 2000)
        } else {
          setStatus("error")
        }
      } catch (e) {
        console.error("Failed to check status:", e)
        setStatus("error")
      }
    }

    setTimeout(checkStatus, 1500)
  }, [sessionId, router])

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setAccountError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setAccountError("Password must be at least 6 characters")
      return
    }

    setCreatingAccount(true)
    setAccountError(null)

    try {
      const supabase = createClient()

      // Create the account
      const { data, error } = await supabase.auth.signUp({
        email: sessionData?.email || "",
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            stripe_customer_id: sessionData?.customerId,
          },
        },
      })

      if (error) throw error

      // Link the payment to the new user
      if (data.user) {
        await fetch("/api/link-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userId: data.user.id,
            customerId: sessionData?.customerId,
            productType: sessionData?.productType,
          }),
        })
      }

      // If session exists (email confirmation disabled), redirect appropriately
      if (data.session) {
        if (contractSlug && returnToGenerate) {
          router.push(`/generate/${contractSlug}?from_payment=true`)
        } else {
          setStatus("success")
        }
      } else {
        // Email confirmation required
        router.push("/auth/sign-up-success")
      }
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Failed to create account")
    } finally {
      setCreatingAccount(false)
    }
  }

  if (status === "loading" || status === "processing") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full bg-card border-border text-center">
            <CardContent className="pt-8 pb-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg text-foreground">
                {status === "processing" ? "Finalizing your purchase..." : "Processing your payment..."}
              </p>
              <p className="text-sm text-muted-foreground mt-2">This will only take a moment.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto bg-card border-border text-center">
            <CardContent className="pt-8 pb-8">
              <p className="text-destructive mb-4">Something went wrong with your payment.</p>
              <Button asChild>
                <Link href="/pricing">Try Again</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === "needs_account") {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-lg mx-auto bg-card border-border overflow-hidden">
            {/* Success banner */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 text-center border-b border-border">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 relative">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                <PartyPopper className="w-6 h-6 text-yellow-500" />
                Payment Successful!
                <PartyPopper className="w-6 h-6 text-yellow-500 scale-x-[-1]" />
              </h1>
              <p className="text-muted-foreground mt-2">Now create your account to access your purchase</p>
            </div>

            <CardContent className="p-6 space-y-6">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Account email</p>
                <p className="text-foreground font-medium">{sessionData?.email}</p>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Create a password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-input border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-input border-border"
                    required
                  />
                </div>

                {accountError && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                    {accountError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                  disabled={creatingAccount}
                >
                  {creatingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account & Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success state for logged-in users
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto bg-card border-border overflow-hidden">
          {/* Success banner */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 text-center border-b border-border">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 relative">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <Sparkles className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <PartyPopper className="w-6 h-6 text-yellow-500" />
              Welcome to Artispreneur!
              <PartyPopper className="w-6 h-6 text-yellow-500 scale-x-[-1]" />
            </h1>
            <p className="text-muted-foreground mt-2">Your payment was successful</p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">What happens next?</p>
              <p className="text-foreground">
                {contractSlug && returnToGenerate
                  ? "Click below to generate your contract with the details you entered!"
                  : "Your account is now upgraded. Start generating professional contracts instantly!"}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {contractSlug ? (
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href={`/generate/${contractSlug}${returnToGenerate ? "?from_payment=true" : ""}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    {returnToGenerate ? "Generate Your Contract Now" : "Generate Your Contract"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}

              <Button asChild variant="outline" className="border-border bg-transparent">
                <Link href="/templates">Browse Contract Templates</Link>
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              A confirmation email has been sent to your email address.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutCompleteContent />
    </Suspense>
  )
}
