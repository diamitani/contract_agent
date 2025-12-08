import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/sign-in")
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 bg-card border-border">
            <CardContent className="pt-6 flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} alt={user.email || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(user.email || "U")}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground">{user.user_metadata?.full_name || "User"}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <Badge className="mt-4 bg-primary/10 text-primary">Active Account</Badge>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Account Information</CardTitle>
              <CardDescription className="text-muted-foreground">Your account details and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="text-foreground font-medium">{user.user_metadata?.full_name || "Not set"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="text-foreground font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Created</p>
                  <p className="text-foreground font-medium">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
