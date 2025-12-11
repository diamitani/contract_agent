"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { ContractForm } from "@/components/contract-form"
import { GeneratedContractModal } from "@/components/generated-contract-modal"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"
import { getContractBySlug } from "@/lib/contracts"
import { saveContract } from "@/lib/contract-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Eye, Info, Lock, Zap, Crown, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

export default function GenerateContractPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { toast } = useToast()
  const contract = getContractBySlug(slug)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedModalOpen, setGeneratedModalOpen] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const [canGenerate, setCanGenerate] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free")
  const [contractsRemaining, setContractsRemaining] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [purchaseLoadingType, setPurchaseLoadingType] = useState<"per_contract" | "unlimited" | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      if (!user) {
        setCheckingSubscription(false)
        return
      }

      try {
        const res = await fetch("/api/check-subscription")
        const data = await res.json()
        setCanGenerate(data.canGenerate)
        setSubscriptionStatus(data.status)
        setContractsRemaining(data.contractsRemaining || 0)
      } catch (error) {
        console.error("Failed to check subscription:", error)
      }

      setCheckingSubscription(false)
    }

    checkAccess()
  }, [supabase.auth])

  if (!contract) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Contract not found</h1>
          <Button asChild>
            <Link href="/">Back to contracts</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handlePurchase = async (productType: "per_contract" | "unlimited") => {
    if (!isLoggedIn) {
      router.push(`/auth/sign-in?redirect=/generate/${slug}`)
      return
    }

    setPurchaseLoadingType(productType)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productType, contractSlug: slug }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Purchase error:", error)
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      })
      setPurchaseLoadingType(null)
    }
  }

  const handleSubmit = async (formData: Record<string, string>) => {
    if (!canGenerate) {
      toast({
        title: "Subscription Required",
        description: "Please purchase a plan to generate contracts.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setGeneratedContent("")
    setIsStreaming(true)
    setGeneratedModalOpen(true)

    try {
      // Use a contract credit first
      const creditRes = await fetch("/api/use-contract-credit", { method: "POST" })
      const creditData = await creditRes.json()

      if (!creditRes.ok) {
        throw new Error(creditData.error || "No credits available")
      }

      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_type: contract.slug,
          contract_name: contract.name,
          fields: formData,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate contract")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (!data) continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.type === "delta" && parsed.content) {
                fullContent += parsed.content
                setGeneratedContent(fullContent)
              } else if (parsed.type === "complete") {
                if (parsed.content && !fullContent) {
                  setGeneratedContent(parsed.content)
                }
                setDownloadUrl(parsed.downloadUrl || null)
              } else if (parsed.type === "error") {
                throw new Error(parsed.message)
              }
            } catch {
              // Skip non-JSON data
            }
          }
        }
      }

      setIsStreaming(false)

      if (fullContent) {
        const savedContract = await saveContract({
          title: contract.name,
          contract_type: contract.slug,
          content: fullContent,
          form_data: formData,
          status: "completed",
        })

        if (savedContract) {
          toast({
            title: "Contract Generated & Saved!",
            description: "Your contract has been saved to your dashboard.",
          })
        }

        // Update remaining credits display
        if (subscriptionStatus === "per_contract") {
          setContractsRemaining((prev) => Math.max(0, prev - 1))
          if (contractsRemaining <= 1) {
            setCanGenerate(false)
          }
        }
      }
    } catch (error) {
      console.error("Error generating contract:", error)
      setIsStreaming(false)

      // Fallback to mock generation
      const mockContent = generateMockContract(contract.name, formData)
      setGeneratedContent(mockContent)

      await saveContract({
        title: contract.name,
        contract_type: contract.slug,
        content: mockContent,
        form_data: formData,
        status: "completed",
      })

      toast({
        title: "Contract Generated",
        description: "Generated with fallback template.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusDisplay = () => {
    if (subscriptionStatus === "unlimited") {
      return (
        <div className="flex items-center gap-2 text-amber-500">
          <Crown className="w-4 h-4" />
          <span className="text-sm font-medium">Unlimited Pro Active</span>
        </div>
      )
    }

    if (subscriptionStatus === "per_contract" && contractsRemaining > 0) {
      return (
        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">
            {contractsRemaining} credit{contractsRemaining !== 1 ? "s" : ""} remaining
          </span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="w-4 h-4" />
        <span className="text-sm">Purchase required to generate</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to contracts
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contract Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-24">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    {contract.category}
                  </Badge>
                </div>
                <CardTitle className="text-foreground text-xl">{contract.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{contract.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <span>{contract.fields.length} fields to complete</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>All fields are optional</span>
                </div>

                {!checkingSubscription && <div className="border-t border-border pt-4 mt-4">{getStatusDisplay()}</div>}

                <Button
                  variant="outline"
                  className="w-full border-border hover:bg-secondary bg-transparent"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Template
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            {checkingSubscription ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Checking subscription...</p>
                </CardContent>
              </Card>
            ) : !isLoggedIn ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Sign In Required</h3>
                  <p className="text-muted-foreground mb-6">Please sign in to generate contracts</p>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href={`/auth/sign-in?redirect=/generate/${slug}`}>Sign In to Continue</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : !canGenerate ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">Generate Your Contract</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Get a professionally crafted, AI-generated contract customized to your specific needs
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {/* Single Contract */}
                    <Card className="bg-card border-border relative overflow-hidden">
                      <CardContent className="pt-6">
                        <div className="text-center mb-6">
                          <Zap className="w-10 h-10 text-primary mx-auto mb-3" />
                          <h4 className="text-lg font-semibold text-foreground mb-1">Single Contract</h4>
                          <p className="text-3xl font-bold text-foreground">$19.99</p>
                          <p className="text-sm text-muted-foreground">one-time</p>
                        </div>
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>1 AI-generated contract</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Customized to your details</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>PDF download included</span>
                          </li>
                        </ul>
                        <Button
                          className="w-full bg-transparent"
                          variant="outline"
                          onClick={() => handlePurchase("per_contract")}
                          disabled={purchaseLoadingType !== null}
                        >
                          {purchaseLoadingType === "per_contract" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Buy Now"
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Unlimited Pro - Highlighted */}
                    <Card className="bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/50 border-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                        BEST VALUE
                      </div>
                      <CardContent className="pt-6">
                        <div className="text-center mb-6">
                          <Crown className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                          <h4 className="text-lg font-semibold text-foreground mb-1">Unlimited Pro</h4>
                          <p className="text-3xl font-bold text-foreground">
                            $9.99<span className="text-base font-normal text-muted-foreground">/mo</span>
                          </p>
                          <p className="text-sm text-muted-foreground">cancel anytime</p>
                        </div>
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-amber-500" />
                            <span className="font-medium text-foreground">Unlimited contracts</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-amber-500" />
                            <span>AI contract analysis</span>
                          </li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-amber-500" />
                            <span>Priority support</span>
                          </li>
                        </ul>
                        <Button
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-semibold"
                          onClick={() => handlePurchase("unlimited")}
                          disabled={purchaseLoadingType !== null}
                        >
                          {purchaseLoadingType === "unlimited" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Subscribe Now"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <p className="text-center text-sm text-muted-foreground mt-8">
                    Want just the template?{" "}
                    <Link href="/templates" className="text-primary hover:underline font-medium">
                      Download free templates
                    </Link>{" "}
                    without AI customization
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ContractForm contract={contract} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            )}
          </div>
        </div>
      </div>

      <GeneratedContractModal
        open={generatedModalOpen}
        onOpenChange={setGeneratedModalOpen}
        contractName={contract.name}
        generatedContent={generatedContent}
        downloadUrl={downloadUrl}
        isStreaming={isStreaming}
      />

      <PDFPreviewModal contract={contract} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}

function generateMockContract(name: string, data: Record<string, string>): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  let content = `${name.toUpperCase()}\n\n`
  content += `Generated on: ${date}\n\n`
  content += `${"=".repeat(50)}\n\n`

  content += `This Agreement is entered into as of the date set forth below.\n\n`

  content += `PARTIES:\n\n`

  Object.entries(data).forEach(([key, value]) => {
    if (value) {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      content += `${label}: ${value}\n`
    }
  })

  content += `\n${"=".repeat(50)}\n\n`
  content += `TERMS AND CONDITIONS:\n\n`
  content += `1. This agreement shall be binding upon execution by both parties.\n\n`
  content += `2. All parties agree to the terms and conditions set forth herein.\n\n`
  content += `3. This agreement shall be governed by applicable law.\n\n`
  content += `${"=".repeat(50)}\n\n`
  content += `SIGNATURES:\n\n`
  content += `_______________________          _______________________\n`
  content += `Party 1                          Party 2\n\n`
  content += `Date: _____________              Date: _____________\n`

  return content
}
