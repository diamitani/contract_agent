"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { ContractForm } from "@/components/contract-form"
import { GeneratedContractModal } from "@/components/generated-contract-modal"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"
import { PaymentModal } from "@/components/payment-modal"
import { getContractBySlug } from "@/lib/contracts"
import { saveContract } from "@/lib/contract-store"
import { APP_ID } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Eye, Info, Lock, Zap, Crown, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAuthUser } from "@/hooks/use-auth-user"

const FORM_DATA_STORAGE_KEY = "contract_form_data"

export default function GenerateContractPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const { toast } = useToast()
  const contract = getContractBySlug(slug)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedModalOpen, setGeneratedModalOpen] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [pendingFormDataForPayment, setPendingFormDataForPayment] = useState<Record<string, string> | null>(null)

  const [checkingSubscription, setCheckingSubscription] = useState(true)
  const [canGenerate, setCanGenerate] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free")
  const [contractsRemaining, setContractsRemaining] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [pendingFormData, setPendingFormData] = useState<Record<string, string> | null>(null)
  const [autoGenerating, setAutoGenerating] = useState(false)
  const { user: authUser } = useAuthUser()

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoggedIn(Boolean(authUser))

      if (authUser) {
        try {
          const res = await fetch("/api/check-subscription")
          const data = await res.json()
          setCanGenerate(data.canGenerate)
          setSubscriptionStatus(data.status)
          setContractsRemaining(data.contractsRemaining || 0)

          const savedFormData = localStorage.getItem(FORM_DATA_STORAGE_KEY)
          const fromPayment = searchParams.get("from_payment") === "true"

          if (savedFormData && data.canGenerate && fromPayment) {
            try {
              const parsed = JSON.parse(savedFormData)
              if (parsed.slug === slug && parsed.formData) {
                setPendingFormData(parsed.formData)
                localStorage.removeItem(FORM_DATA_STORAGE_KEY)
              }
            } catch {
              localStorage.removeItem(FORM_DATA_STORAGE_KEY)
            }
          }
        } catch (error) {
          console.error("Failed to check subscription:", error)
        }
      }

      setCheckingSubscription(false)
    }

    checkAccess().catch((error) => {
      console.error("Failed to check access:", error)
      setCheckingSubscription(false)
    })
  }, [authUser?.id, searchParams, slug])

  useEffect(() => {
    if (pendingFormData && canGenerate && !autoGenerating) {
      setAutoGenerating(true)
      toast({
        title: "Payment Successful!",
        description: "Generating your contract now...",
      })
      handleSubmit(pendingFormData)
    }
  }, [pendingFormData, canGenerate])

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

  const handleGenerateClick = async (formData: Record<string, string>) => {
    if (subscriptionStatus === "unlimited") {
      // Unlimited subscribers can generate directly
      await handleSubmit(formData)
      return
    }

    // Save form data to localStorage
    localStorage.setItem(
      FORM_DATA_STORAGE_KEY,
      JSON.stringify({
        slug,
        formData,
        timestamp: Date.now(),
      }),
    )

    // Check if user can generate (has credits)
    if (!canGenerate) {
      // Show payment modal with plan options
      setPendingFormDataForPayment(formData)
      setPaymentModalOpen(true)
      return
    }

    // User has credits - proceed
    await handleSubmit(formData)
  }

  const handleSubmit = async (formData: Record<string, string>) => {
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
          app_id: APP_ID,
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

      // Clear pending form data
      setPendingFormData(null)
      localStorage.removeItem(FORM_DATA_STORAGE_KEY)
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
        app_id: APP_ID,
      })

      toast({
        title: "Contract Generated",
        description: "Generated with fallback template.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setAutoGenerating(false)
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
        <span className="text-sm">Fill form freely - pay only to generate</span>
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

                {!checkingSubscription && !canGenerate && (
                  <div className="border-t border-border pt-4 mt-4 space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">PRICING OPTIONS</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Zap className="w-3 h-3" />
                          Single Contract
                        </span>
                        <span className="font-semibold text-foreground">$19.99</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-500 flex items-center gap-2">
                          <Crown className="w-3 h-3" />
                          Unlimited Pro
                        </span>
                        <span className="font-semibold text-amber-500">$9.99/mo</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Payment required only when you click Generate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Section - Now always shows the form */}
          <div className="lg:col-span-2">
            {checkingSubscription ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {!canGenerate && (
                  <Card className="bg-gradient-to-r from-primary/10 to-amber-500/10 border-primary/20 mb-6">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Try it free - pay only to generate</p>
                          <p className="text-xs text-muted-foreground">
                            Fill out all your contract details now. You'll only be charged when you're ready to
                            generate.
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                          <Badge variant="outline" className="border-primary/50 text-primary">
                            <Check className="w-3 h-3 mr-1" />
                            No signup required
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <ContractForm
                  contract={contract}
                  onSubmit={handleGenerateClick}
                  isSubmitting={isSubmitting}
                  showPaymentPrompt={!canGenerate}
                  onPreviewClick={() => setPreviewOpen(true)}
                />
              </>
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
        isPaid={canGenerate && (subscriptionStatus === "unlimited" || subscriptionStatus === "per_contract")}
      />

      <PDFPreviewModal contract={contract} open={previewOpen} onOpenChange={setPreviewOpen} />

      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        contractSlug={slug}
        contractName={contract.name}
      />
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
