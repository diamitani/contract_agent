"use client"

import { useState, useEffect, Suspense } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, FileText, Zap, Crown, Loader2, ArrowRight, Shield, Clock, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useAuthUser } from "@/hooks/use-auth-user"

const plans = [
  {
    name: "Free Templates",
    price: "$0",
    period: "",
    description: "Download contract templates",
    features: ["Access to all 21 templates", "Download as text format", "Preview full content", "No account required"],
    cta: "Browse Templates",
    href: "/templates",
    popular: false,
    productType: null,
    icon: FileText,
  },
  {
    name: "Single Contract",
    price: "$19.99",
    period: "one-time",
    description: "One AI-generated contract",
    features: [
      "1 AI-customized contract",
      "Tailored to your details",
      "Professional formatting",
      "PDF download",
      "Save to dashboard",
    ],
    cta: "Choose Contract",
    popular: false,
    productType: "per_contract" as const,
    href: "/generate",
    icon: Zap,
  },
  {
    name: "Unlimited Pro",
    price: "$9.99",
    period: "/month",
    description: "Best value for professionals",
    features: [
      "Unlimited AI contracts",
      "AI contract analysis",
      "Chat with your contracts",
      "All 21 templates",
      "Priority support",
      "Cancel anytime",
    ],
    cta: "Start Pro",
    popular: true,
    productType: "unlimited" as const,
    icon: Crown,
    savings: "Save 50%+ on your second contract",
  },
]

const faqs = [
  {
    question: "What types of contracts can I generate?",
    answer:
      "We offer 21 different music industry contract templates including recording agreements, management contracts, licensing deals, producer agreements, sync licenses, and more. Each can be customized with your specific terms and details.",
  },
  {
    question: "How does the AI customization work?",
    answer:
      "Simply fill out a form with your details (names, terms, royalty rates, etc.) and our AI generates a professional contract tailored to your specific needs. The process takes just minutes instead of days.",
  },
  {
    question: "Can I cancel my Unlimited Pro subscription?",
    answer:
      "Yes, you can cancel anytime. Your subscription will remain active until the end of your billing period, and you'll retain access to all contracts you've generated.",
  },
  {
    question: "Are these contracts legally binding?",
    answer:
      "Our contracts are based on industry-standard templates used by music professionals. However, we recommend having important contracts reviewed by a qualified attorney before signing.",
  },
  {
    question: "What's the difference between templates and AI-generated contracts?",
    answer:
      "Free templates are generic documents you can download and manually fill in. AI-generated contracts are automatically customized with your specific details, properly formatted, and ready to use.",
  },
]

function PricingContent() {
  const router = useRouter()
  const { user } = useAuthUser()
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setSubscription(null)
        return
      }

      const res = await fetch("/api/check-subscription")
      const data = await res.json()
      setSubscription(data)
    }

    checkSubscription().catch((error) => {
      console.error("Failed to load subscription:", error)
      setSubscription(null)
    })
  }, [user?.id])

  const handlePurchase = (productType: "per_contract" | "unlimited") => {
    if (productType === "per_contract") {
      router.push("/generate")
    } else {
      router.push(`/checkout/${productType}`)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <Badge className="mb-4 bg-amber-500/10 text-amber-500 border-amber-500/20">
          <Sparkles className="w-3 h-3 mr-1" />
          Professional Music Contracts
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Contracts Made <span className="text-primary">Simple</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Stop overpaying for legal documents. Get industry-standard contracts customized by AI in minutes, not days.
        </p>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-8">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Industry Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Ready in Minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span>1000+ Users</span>
          </div>
        </div>

        {subscription?.status === "unlimited" && (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <Crown className="w-3 h-3 mr-1" />
            You have Unlimited Pro Access
          </Badge>
        )}

        {subscription?.status === "per_contract" && subscription?.contractsRemaining > 0 && (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Zap className="w-3 h-3 mr-1" />
            {subscription.contractsRemaining} Contract Credit{subscription.contractsRemaining > 1 ? "s" : ""} Remaining
          </Badge>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12 sm:mb-20 px-2">
        {plans.map((plan) => {
          const Icon = plan.icon
          return (
            <Card
              key={plan.name}
              className={`relative bg-card border-border flex flex-col transition-all duration-300 hover:border-primary/50 ${
                plan.popular ? "border-amber-500 shadow-xl shadow-amber-500/10 md:scale-105 z-10" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold px-4">
                    BEST VALUE
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    plan.popular ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/20" : "bg-primary/10"
                  }`}
                >
                  <Icon className={`w-7 h-7 ${plan.popular ? "text-amber-500" : "text-primary"}`} />
                </div>
                <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground ml-1 text-lg">{plan.period}</span>}
                </div>

                {plan.savings && (
                  <p className="text-center text-sm text-amber-500 font-medium mb-4 -mt-2">{plan.savings}</p>
                )}

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.popular ? "text-amber-500" : "text-green-500"}`}
                      />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                {plan.productType === null ? (
                  <Button
                    asChild
                    className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  >
                    <Link href="/templates">
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                ) : plan.productType === "per_contract" ? (
                  <Button
                    asChild
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Link href="/generate">
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className={`w-full h-12 text-base font-semibold ${
                      plan.popular
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    }`}
                    onClick={() => handlePurchase(plan.productType as "per_contract" | "unlimited")}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-12 sm:mb-16 px-2">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Everything you need to know about Contract Agent</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-border">
              <AccordionTrigger className="text-left text-foreground hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* FAQ / Value Props */}
      <div className="max-w-3xl mx-auto mb-12 sm:mb-16 px-2">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-foreground mb-4 sm:mb-6">Why Contract Agent?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Save Thousands in Legal Fees</h3>
            <p className="text-sm text-muted-foreground">
              Traditional entertainment lawyers charge $300-500/hour. Our AI generates professional contracts for a
              fraction of the cost.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Industry-Standard Templates</h3>
            <p className="text-sm text-muted-foreground">
              All 21 contract types are based on real music industry agreements used by labels, managers, and artists
              worldwide.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Customized to Your Needs</h3>
            <p className="text-sm text-muted-foreground">
              Our AI tailors each contract to your specific situation—names, terms, royalties, and obligations all
              personalized.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-2">Ready in Minutes</h3>
            <p className="text-sm text-muted-foreground">
              No waiting days for a lawyer to draft documents. Fill out the form and get your professionally formatted
              contract instantly.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center px-2">
        <p className="text-muted-foreground mb-4">Not sure which plan is right for you?</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/templates">
              <FileText className="w-4 h-4 mr-2" />
              Browse Free Templates
            </Link>
          </Button>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link href="/how-it-works">
              Learn How It Works
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-8">
          Questions? Email us at{" "}
          <a href="mailto:pat@artispreneur.com" className="text-primary hover:underline">
            pat@artispreneur.com
          </a>
        </p>
      </div>
    </>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Suspense
            fallback={
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Loading pricing...</p>
              </div>
            }
          >
            <PricingContent />
          </Suspense>
        </div>
      </section>
    </div>
  )
}
