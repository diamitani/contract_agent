"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, ArrowRight, Sparkles } from "lucide-react"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractSlug: string
  contractName: string
}

export function PaymentModal({ open, onOpenChange, contractSlug, contractName }: PaymentModalProps) {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<"per_contract" | "unlimited">("per_contract")

  const handleContinue = () => {
    // Save the contract slug to return to after payment
    localStorage.setItem("pending_contract_slug", contractSlug)
    router.push(`/checkout/${selectedPlan}?contract=${contractSlug}&return_generate=true`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Generate Your Contract
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how you'd like to generate "{contractName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* One-time option */}
          <Card
            className={`cursor-pointer transition-all duration-200 ${
              selectedPlan === "per_contract"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedPlan("per_contract")}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedPlan === "per_contract" ? "bg-primary/20" : "bg-secondary"
                    }`}
                  >
                    <Zap
                      className={`w-5 h-5 ${selectedPlan === "per_contract" ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Single Contract</h3>
                    <p className="text-sm text-muted-foreground">One-time purchase for this contract</p>
                    <ul className="mt-2 space-y-1">
                      <li className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        AI-customized to your details
                      </li>
                      <li className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        PDF download included
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">$19.99</p>
                  <p className="text-xs text-muted-foreground">one-time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription option */}
          <Card
            className={`cursor-pointer transition-all duration-200 relative ${
              selectedPlan === "unlimited"
                ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                : "border-border hover:border-amber-500/50"
            }`}
            onClick={() => setSelectedPlan("unlimited")}
          >
            <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs">
              BEST VALUE
            </Badge>
            <CardContent className="p-4 pt-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedPlan === "unlimited" ? "bg-amber-500/20" : "bg-secondary"
                    }`}
                  >
                    <Crown
                      className={`w-5 h-5 ${selectedPlan === "unlimited" ? "text-amber-500" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Unlimited Pro</h3>
                    <p className="text-sm text-muted-foreground">Generate unlimited contracts</p>
                    <ul className="mt-2 space-y-1">
                      <li className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-500" />
                        Unlimited AI contracts
                      </li>
                      <li className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-500" />
                        AI contract analysis
                      </li>
                      <li className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-500" />
                        Cancel anytime
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-500">$9.99</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleContinue}
            className={`w-full h-12 text-base font-semibold ${
              selectedPlan === "unlimited"
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            Continue to Payment
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">Secure payment powered by Stripe. Cancel anytime.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
