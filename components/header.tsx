"use client"

import Link from "next/link"
import Image from "next/image"
import { Sparkles, LayoutDashboard, Home, LogOut, User, FileText, CreditCard, HelpCircle } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/artispreneur-20logo.png"
            alt="Artispreneur Logo"
            width={44}
            height={44}
            className="rounded-lg"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground">Artispreneur</span>
            <span className="text-xs text-muted-foreground">Contract Generator</span>
          </div>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm flex items-center gap-2 transition-colors ${
              pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="w-4 h-4" />
            Generate
          </Link>
          <Link
            href="/templates"
            className={`text-sm flex items-center gap-2 transition-colors ${
              pathname === "/templates" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Templates
          </Link>
          <Link
            href="/how-it-works"
            className={`text-sm flex items-center gap-2 transition-colors ${
              pathname === "/how-it-works" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            How It Works
          </Link>
          <Link
            href="/pricing"
            className={`text-sm flex items-center gap-2 transition-colors ${
              pathname === "/pricing" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Pricing
          </Link>
          <div className="flex items-center gap-2 text-accent">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI Powered</span>
          </div>

          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                          alt={user.email || ""}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.email || "U")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user.user_metadata?.full_name && (
                          <p className="font-medium text-sm">{user.user_metadata.full_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild size="sm">
                  <Link href="/auth/sign-in">Sign in</Link>
                </Button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
