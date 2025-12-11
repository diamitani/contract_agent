"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, ArrowRight, FileText, Loader2, PartyPopper, Sparkles } from "lucide-react"
import Link from "next/link"
import confetti from "canvas-confetti"

function CheckoutCompleteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "processing" | "error">("loading")
  const sessionId = searchParams.get("session_id")
  const contractSlug = searchParams.get("contract")

  useEffect(() => {
    if (!sessionId) {
      router.push("/pricing")
      return
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/checkout-status?session_id=${sessionId}`)
        const data = await res.json()

        if (data.status === "complete" && data.payment_status === "paid") {
          setStatus("success")
          // Fire confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          })
        } else if (data.status === "open") {
          setStatus("processing")
          // Check again in 2 seconds
          setTimeout(checkStatus, 2000)
        } else {
          setStatus("error")
        }
      } catch (e) {
        console.error("Failed to check status:", e)
        // Assume success and let webhook handle it
        setStatus("success")
      }
    }

    // Wait a moment for webhook to process
    setTimeout(checkStatus, 1500)
  }, [sessionId, router])

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
                Your account is now upgraded. Start generating professional contracts instantly!
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {contractSlug ? (
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href={`/generate/${contractSlug}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Your Contract
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
