"use client"

import Link from "next/link"
import Image from "next/image"
import { Sparkles, LogOut, User, FileText, CreditCard, Menu, Home, MessageSquare } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useState } from "react"

function getProfile(): { name: string; stageName: string } | null {
  if (typeof window === "undefined") return null
  try {
    const p = localStorage.getItem("artispreneur_profile")
    return p ? JSON.parse(p) : null
  } catch { return null }
}

function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("artispreneur_logged_in") === "true"
}

function doLogout() {
  localStorage.removeItem("artispreneur_logged_in")
  window.location.href = "/"
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const loggedIn = isLoggedIn()
  const profile = getProfile()
  const displayName = profile?.stageName || profile?.name || "Artist"
  const initial = displayName[0]?.toUpperCase() || "A"

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/generate", label: "Generate", icon: Sparkles },
    { href: "/templates", label: "Templates", icon: FileText },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ]

  return (
    <header className="border-b border-[rgba(255,255,255,0.06)] bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <Image
            src="/images/artispreneur-20logo.png"
            alt="Artispreneur"
            width={36}
            height={36}
            className="rounded-lg w-8 h-8 sm:w-9 sm:h-9"
          />
          <div className="flex flex-col">
            <span
              className="text-base sm:text-lg font-bold tracking-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Rostr<span style={{ color: "#C9A227" }}>Contracts</span>
            </span>
            <span
              className="text-[8px] font-bold uppercase tracking-[1px] hidden sm:block"
              style={{ color: "rgba(250,250,250,0.3)" }}
            >
              Powered by Artispreneur
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] flex items-center gap-1.5 transition-colors font-medium ${
                  pathname === link.href
                    ? "text-[#C9A227]"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            )
          })}

          <div className="flex items-center gap-1.5 text-[#C9A227]">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold tracking-[0.05em] uppercase">
              AI-Powered
            </span>
          </div>

          {loggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8 border border-[rgba(201,162,39,0.3)]">
                    <AvatarFallback
                      className="text-xs font-bold"
                      style={{ backgroundColor: "#CC0000", color: "#fff" }}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" style={{ backgroundColor: "#0A0A0A", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-semibold text-sm text-white">{displayName}</p>
                    <p className="text-xs text-white/40">{profile?.artistType || "Artist"}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem asChild className="text-white/70 hover:text-white focus:text-white">
                  <Link href="/dashboard" className="cursor-pointer text-[13px]">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-white/70 hover:text-white focus:text-white">
                  <Link href="/generate" className="cursor-pointer text-[13px]">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Contract
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem
                  onClick={doLogout}
                  className="cursor-pointer text-white/50 hover:text-red-400 focus:text-red-400 text-[13px]"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="text-white/60 hover:text-white text-[13px]">
                <Link href="/auth/sign-in">Log in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="text-[13px] font-semibold"
                style={{ backgroundColor: "#CC0000", color: "#fff" }}
              >
                <Link href="/auth/sign-up">Get Started Free</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden items-center gap-2">
          {loggedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                  <Avatar className="h-8 w-8 border border-[rgba(201,162,39,0.3)]">
                    <AvatarFallback
                      className="text-xs font-bold"
                      style={{ backgroundColor: "#CC0000", color: "#fff" }}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" style={{ backgroundColor: "#0A0A0A", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-semibold text-sm text-white">{displayName}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem asChild className="text-white/70">
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-white/70">
                  <Link href="/generate">Generate Contract</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem onClick={doLogout} className="cursor-pointer text-red-400">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] sm:w-[320px] border-l border-[rgba(255,255,255,0.06)]"
              style={{ backgroundColor: "#050505" }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between pb-6 border-b border-white/8">
                  <div className="flex items-center gap-2">
                    <Image src="/images/artispreneur-20logo.png" alt="Artispreneur" width={28} height={28} className="rounded-lg" />
                    <span className="font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>
                      Rostr<span style={{ color: "#C9A227" }}>Contracts</span>
                    </span>
                  </div>
                </div>

                <nav className="flex flex-col gap-1 py-6 flex-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-[13px] ${
                            pathname === link.href
                              ? "bg-[#C9A227]/10 text-[#C9A227]"
                              : "text-white/50 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      </SheetClose>
                    )
                  })}
                </nav>

                <div className="pt-6 border-t border-white/8">
                  <div className="flex items-center gap-2 text-[#C9A227] mb-4 px-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold tracking-[0.05em] uppercase">AI-Powered</span>
                  </div>

                  {!loggedIn ? (
                    <div className="space-y-2">
                      <SheetClose asChild>
                        <Button asChild className="w-full text-[13px] font-semibold" style={{ backgroundColor: "#CC0000" }}>
                          <Link href="/auth/sign-up">Get Started Free</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild variant="outline" className="w-full bg-transparent text-white/60 border-white/10 text-[13px]">
                          <Link href="/auth/sign-in">Log in</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <SheetClose asChild>
                      <Button onClick={doLogout} variant="ghost" className="w-full text-white/40 hover:text-red-400 text-[13px]">Sign out</Button>
                    </SheetClose>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
