"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, FileText, Zap, Crown, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "Free Templates",
    price: "$0",
    period: "",
    description: "Download contract templates without AI generation",
    features: [
      "Access to all 21 contract templates",
      "Download as text format",
      "Preview full contract content",
      "Email delivery option",
    ],
    cta: "Browse Templates",
    href: "/templates",
    popular: false,
    productType: null,
  },
  {
    name: "Per Contract",
    price: "$9.99",
    period: "per contract",
    description: "AI-generated custom contracts",
    features: [
      "One AI-generated contract",
      "Customized to your details",
      "Professional formatting",
      "Save to dashboard",
      "Download as PDF/Text",
      "Digital signature ready",
    ],
    cta: "Buy Contract Credit",
    popular: true,
    productType: "per_contract" as const,
  },
  {
    name: "Unlimited",
    price: "$19.99",
    period: "/month",
    description: "Generate unlimited contracts",
    features: [
      "Unlimited AI generations",
      "All 21 contract templates",
      "Priority processing",
      "Contract analysis & chat",
      "Digital signatures",
      "Email sending for signatures",
      "Dashboard storage",
      "Cancel anytime",
    ],
    cta: "Subscribe Now",
    popular: false,
    productType: "unlimited" as const,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const res = await fetch("/api/check-subscription")
        const data = await res.json()
        setSubscription(data)
      }
    }
    checkUser()
  }, [supabase.auth])

  const handlePurchase = async (productType: "per_contract" | "unlimited" | null) => {
    if (!productType) {
      router.push("/templates")
      return
    }

    if (!user) {
      router.push("/auth/sign-in?redirect=/pricing")
      return
    }

    setLoading(productType)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Failed to create checkout")
      }
    } catch (error) {
      console.error("Purchase error:", error)
      alert("Failed to start checkout. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Simple Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get professionally crafted music industry contracts. Start free with templates or upgrade for AI-powered
              customization.
            </p>

            {subscription?.status === "unlimited" && (
              <Badge className="mt-4 bg-green-500/10 text-green-500 border-green-500/20">
                <Crown className="w-3 h-3 mr-1" />
                You have Unlimited Access
              </Badge>
            )}

            {subscription?.status === "per_contract" && subscription?.contractsRemaining > 0 && (
              <Badge className="mt-4 bg-primary/10 text-primary border-primary/20">
                <Zap className="w-3 h-3 mr-1" />
                {subscription.contractsRemaining} Contract Credit{subscription.contractsRemaining > 1 ? "s" : ""}{" "}
                Remaining
              </Badge>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative bg-card border-border flex flex-col ${
                  plan.popular ? "border-primary shadow-lg shadow-primary/10 scale-105" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    {plan.name === "Free Templates" ? (
                      <FileText className="w-6 h-6 text-primary" />
                    ) : plan.name === "Per Contract" ? (
                      <Zap className="w-6 h-6 text-primary" />
                    ) : (
                      <Crown className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground ml-1">{plan.period}</span>}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    }`}
                    onClick={() => handlePurchase(plan.productType)}
                    disabled={loading !== null}
                  >
                    {loading === plan.productType ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* FAQ or Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              Questions? Email us at{" "}
              <a href="mailto:pat@artispreneur.com" className="text-primary hover:underline">
                pat@artispreneur.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
