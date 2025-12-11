"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Shield, Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PLAN_DETAILS = {
  per_contract: {
    name: "Single Contract",
    price: "$19.99",
    description: "One AI-generated contract",
    features: ["1 AI-generated contract", "PDF download", "Customizable terms", "Professional formatting"],
  },
  unlimited: {
    name: "Unlimited Pro",
    price: "$9.99/mo",
    description: "Unlimited contracts + AI analysis",
    features: [
      "Unlimited AI contracts",
      "Contract analysis",
      "Chat with contracts",
      "Priority support",
      "Cancel anytime",
    ],
  },
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const plan = params.plan as "per_contract" | "unlimited"
  const contractSlug = searchParams.get("contract")
  const planDetails = PLAN_DETAILS[plan]

  // Check auth and create checkout session
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to sign up with return URL
        router.push(`/auth/sign-up?plan=${plan}${contractSlug ? `&contract=${contractSlug}` : ""}`)
        return
      }

      setUser({ id: user.id, email: user.email || "" })

      // Create checkout session
      try {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productType: plan,
            contractSlug,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Failed to create checkout session")
        }

        setClientSecret(data.clientSecret)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    if (plan && PLAN_DETAILS[plan]) {
      init()
    } else {
      router.push("/pricing")
    }
  }, [plan, contractSlug, router])

  if (!planDetails) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg text-foreground">Preparing checkout...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto bg-card border-border">
            <CardContent className="pt-8 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button asChild>
                <Link href="/pricing">Back to Pricing</Link>
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

      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Back button */}
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to pricing
          </Link>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Order Summary - Left side */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Card className="bg-card border-border sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                  <CardDescription>Complete your purchase to get started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plan details */}
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{planDetails.name}</h3>
                        <p className="text-sm text-muted-foreground">{planDetails.description}</p>
                      </div>
                      <span className="text-xl font-bold text-primary">{planDetails.price}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">What's included:</p>
                    {planDetails.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Trust badges */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>Secure checkout powered by Stripe</span>
                    </div>
                    <div className="flex items-center gap-4 opacity-60">
                      <Image src="/visa-application-process.png" alt="Visa" width={40} height={24} />
                      <Image src="/mastercard-logo-abstract.png" alt="Mastercard" width={40} height={24} />
                      <Image src="/abstract-credit-card-design.png" alt="Amex" width={40} height={24} />
                    </div>
                  </div>

                  {/* User info */}
                  {user && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">Purchasing as:</p>
                      <p className="text-sm text-foreground font-medium">{user.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stripe Embedded Checkout - Right side */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="border-b border-border">
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>Enter your card information to complete purchase</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {clientSecret && (
                    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                      <EmbeddedCheckout className="min-h-[400px]" />
                    </EmbeddedCheckoutProvider>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
