"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ArrowRight, FileText, Loader2 } from "lucide-react"
import Link from "next/link"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get("session_id")
  const contractSlug = searchParams.get("contract")

  useEffect(() => {
    // Give webhook time to process
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full bg-card border-border text-center">
            <CardContent className="pt-8 pb-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-lg text-foreground">Processing your payment...</p>
              <p className="text-sm text-muted-foreground mt-2">This will only take a moment.</p>
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
        <Card className="max-w-lg mx-auto bg-card border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-foreground">Payment Successful!</CardTitle>
            <CardDescription className="text-muted-foreground">
              Thank you for your purchase. Your account has been upgraded.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Order Reference</p>
              <p className="text-xs font-mono text-foreground">{sessionId?.slice(0, 20)}...</p>
            </div>

            <div className="flex flex-col gap-3">
              {contractSlug ? (
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href={`/generate/${contractSlug}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Your Contract
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}

              <Button asChild variant="outline" className="border-border bg-transparent">
                <Link href="/templates">Browse All Templates</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
