import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Calendar, Crown, Zap, FileText, CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth/current-user"
import { ensureUserProfile, isCosmosConfigured, listContracts, listPayments } from "@/lib/cosmos/store"

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/sign-in")
  }

  if (!isCosmosConfigured()) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Cosmos DB Not Configured</CardTitle>
              <CardDescription>Set AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY to load profile data.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  const [profile, payments, contracts] = await Promise.all([
    ensureUserProfile(user),
    listPayments(user.id, 5),
    listContracts(user.id),
  ])

  const getInitials = (value: string) => value.substring(0, 2).toUpperCase()

  const getSubscriptionBadge = () => {
    if (profile?.subscription_status === "unlimited") {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-0">
          <Crown className="w-3 h-3 mr-1" />
          Unlimited Plan
        </Badge>
      )
    }
    if (profile?.subscription_status === "per_contract") {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Zap className="w-3 h-3 mr-1" />
          Pay Per Contract
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-border text-muted-foreground">
        Free Plan
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 bg-card border-border">
            <CardContent className="pt-6 flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="/placeholder.svg" alt={user.email || user.name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(user.email || user.name || "U")}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground">{user.name || profile?.full_name || "User"}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-4">{getSubscriptionBadge()}</div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Account Information</CardTitle>
              <CardDescription className="text-muted-foreground">Your account details and subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="text-foreground font-medium">{user.name || profile?.full_name || "Not set"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="text-foreground font-medium">{user.email || "Not set"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Created</p>
                    <p className="text-foreground font-medium">
                      {new Date(profile.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contracts Generated</p>
                    <p className="text-foreground font-medium">{profile?.contracts_generated || 0}</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {profile?.subscription_status === "unlimited" ? (
                      <Crown className="w-6 h-6 text-amber-500" />
                    ) : profile?.subscription_status === "per_contract" ? (
                      <Zap className="w-6 h-6 text-primary" />
                    ) : (
                      <CreditCard className="w-6 h-6 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-semibold text-foreground">
                        {profile?.subscription_status === "unlimited"
                          ? "Unlimited Plan"
                          : profile?.subscription_status === "per_contract"
                            ? "Pay Per Contract"
                            : "Free Plan"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile?.subscription_status === "unlimited"
                          ? "Unlimited contract generation"
                          : profile?.subscription_status === "per_contract"
                            ? `${profile?.contracts_remaining || 0} credit${(profile?.contracts_remaining || 0) !== 1 ? "s" : ""} remaining`
                            : "Free template downloads only"}
                      </p>
                    </div>
                  </div>
                  {profile?.subscription_status !== "unlimited" && (
                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
                      <Link href="/checkout/unlimited">
                        Upgrade
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">Total Contracts</span>
                <span className="text-2xl font-bold text-foreground">{contracts.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">Generated</span>
                <span className="text-2xl font-bold text-foreground">{profile?.contracts_generated || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                <span className="text-muted-foreground">Credits Left</span>
                <span className="text-2xl font-bold text-foreground">{profile?.contracts_remaining || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Payment History</CardTitle>
              <CardDescription className="text-muted-foreground">Your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {payment.product_type === "unlimited" ? "Unlimited Plan" : "Contract Credit"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${(payment.amount / 100).toFixed(2)}</p>
                        <Badge variant="outline" className="text-green-500 border-green-500/30">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No payment history yet</p>
                  <Button asChild variant="link" className="text-primary mt-2">
                    <Link href="/pricing">View pricing plans</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
