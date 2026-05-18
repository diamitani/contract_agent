"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthUser } from "@/hooks/use-auth-user"
import { Header } from "@/components/header"
import { AiContractBuilder } from "@/components/ai-contract-builder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { getSavedContracts, type SavedContract } from "@/lib/contract-store"
import { contractTemplates } from "@/lib/contracts"
import {
  FileText,
  Upload,
  FolderOpen,
  Crown,
  Zap,
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuthUser()
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([])
  const [subscription, setSubscription] = useState<{ status: string; contractsRemaining: number } | null>(null)
  const [contractsLoaded, setContractsLoaded] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/sign-in")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    Promise.all([
      getSavedContracts(),
      fetch("/api/check-subscription").then((r) => r.json()).catch(() => null),
    ]).then(([contracts, sub]) => {
      setSavedContracts(contracts)
      setSubscription(sub)
      setContractsLoaded(true)
    }).catch(() => setContractsLoaded(true))
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const recentContracts = savedContracts.slice(0, 3)
  const stats = [
    { icon: FileText, label: "Saved Contracts", value: savedContracts.length, color: "text-primary", bg: "bg-primary/10" },
    { icon: Upload, label: "Uploaded Files", value: savedContracts.length > 0 ? "--" : "0", color: "text-accent", bg: "bg-accent/10" },
    { icon: FolderOpen, label: "Templates", value: contractTemplates.length, color: "text-green-500", bg: "bg-green-500/10" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Dashboard Header */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Welcome{user.name ? `, ${user.name}` : " back"}
                </h1>
                <p className="text-sm text-muted-foreground">Generate contracts with AI, manage your documents</p>
              </div>
            </div>
            {subscription && (
              <div className="hidden sm:block">
                {subscription.status === "unlimited" ? (
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-4 py-1.5 text-sm">
                    <Crown className="w-4 h-4 mr-1" />
                    Unlimited Pro
                  </Badge>
                ) : (
                  <Button asChild size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
                    <Link href="/checkout/unlimited">
                      <Crown className="w-4 h-4 mr-1" />
                      Upgrade
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="bg-card/50 border-border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <AiContractBuilder onContractSaved={() => {
          getSavedContracts().then(setSavedContracts)
        }} />
      </section>

      {/* Recent Contracts */}
      {recentContracts.length > 0 && (
        <section className="border-t border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recent Contracts
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link href="/dashboard">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentContracts.map((contract) => (
                <Card key={contract.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{contract.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(contract.created_at || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Artispreneur. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
