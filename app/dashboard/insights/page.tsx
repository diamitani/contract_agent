import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Upload,
  TrendingUp,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Activity,
  FolderOpen,
  Sparkles,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth/current-user"
import { isCosmosConfigured, listAnalyticsEvents, listContracts, listUploadedFiles } from "@/lib/cosmos/store"

export default async function InsightsPage() {
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
              <CardDescription>Set AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY to load analytics.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  const [contracts, uploads, events] = await Promise.all([
    listContracts(user.id),
    listUploadedFiles(user.id),
    listAnalyticsEvents(user.id, 20),
  ])

  const contractsByType: Record<string, number> = {}
  contracts.forEach((c) => {
    contractsByType[c.contract_type] = (contractsByType[c.contract_type] || 0) + 1
  })

  const analyzedFiles = uploads.filter((u) => u.analysis_status === "completed").length

  const now = new Date()
  const monthlyData: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    monthlyData[key] = 0
  }

  contracts.forEach((c) => {
    const date = new Date(c.created_at)
    const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    if (monthlyData[key] !== undefined) {
      monthlyData[key]++
    }
  })

  const topContractTypes = Object.entries(contractsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Insights & Analytics</h1>
            <p className="text-muted-foreground">Track your contract activity and usage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Contracts</p>
                  <p className="text-3xl font-bold text-foreground">{contracts.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uploaded Files</p>
                  <p className="text-3xl font-bold text-foreground">{uploads.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">{analyzedFiles} analyzed</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Types</p>
                  <p className="text-3xl font-bold text-foreground">{Object.keys(contractsByType).length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Categorized</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-3xl font-bold text-foreground">
                    {
                      contracts.filter((c) => {
                        const date = new Date(c.created_at)
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                      }).length
                    }
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">New contracts</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Monthly Activity
              </CardTitle>
              <CardDescription>Contracts created over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(monthlyData).map(([month, count]) => {
                  const maxCount = Math.max(...Object.values(monthlyData), 1)
                  const percentage = (count / maxCount) * 100
                  return (
                    <div key={month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{month}</span>
                        <span className="font-medium text-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Top Contract Types
              </CardTitle>
              <CardDescription>Most frequently used templates</CardDescription>
            </CardHeader>
            <CardContent>
              {topContractTypes.length > 0 ? (
                <div className="space-y-4">
                  {topContractTypes.map(([type, count], index) => {
                    const colors = ["bg-primary", "bg-accent", "bg-green-500", "bg-amber-500", "bg-purple-500"]
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[index]}`} />
                          <span className="text-foreground capitalize">{type.replace(/-/g, " ")}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No contracts created yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.slice(0, 10).map((event, index) => (
                    <div key={event.id || index} className="flex items-center gap-4 pb-4 border-b border-border last:border-0">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        {event.event_type === "contract_created" && <FileText className="w-5 h-5 text-primary" />}
                        {event.event_type === "file_uploaded" && <Upload className="w-5 h-5 text-accent" />}
                        {event.event_type === "file_analyzed" && <Sparkles className="w-5 h-5 text-green-500" />}
                        {!(["contract_created", "file_uploaded", "file_analyzed"] as string[]).includes(event.event_type) && (
                          <Activity className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground capitalize">{event.event_type.replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
