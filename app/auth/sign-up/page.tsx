"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FileText, Shield, Zap, PenTool, CheckCircle2 } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "21+ Contract Templates",
    description: "Professional music industry contracts ready to customize",
  },
  {
    icon: Zap,
    title: "AI-Powered Generation",
    description: "Generate complete contracts in seconds with AI assistance",
  },
  {
    icon: Shield,
    title: "Legal Protection",
    description: "Protect your rights and revenue with industry-standard terms",
  },
  {
    icon: PenTool,
    title: "Digital Signatures",
    description: "Sign and send contracts electronically for faster deals",
  },
]

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Feature showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-accent/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo and brand */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/artispreneur-20logo.png"
                alt="Artispreneur Logo"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <span className="text-2xl font-bold text-foreground">Artispreneur</span>
            </Link>
          </div>

          {/* Features list */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2 text-balance">
                Start Your Journey. <span className="text-primary">Protect Your Art.</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Join thousands of music professionals who trust Artispreneur for their contracts.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 transition-colors hover:bg-card/80"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial or stats */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background flex items-center justify-center text-xs font-medium text-primary-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <CheckCircle2 key={i} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">
              "Finally, a platform that understands what independent artists need. The contracts are professional and
              easy to customize."
            </p>
            <p className="text-sm font-medium text-foreground mt-2">— Music Producer & Label Owner</p>
          </div>
        </div>
      </div>

      {/* Right side - Sign up form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image
                src="/images/artispreneur-20logo.png"
                alt="Artispreneur Logo"
                width={56}
                height={56}
                className="rounded-lg"
              />
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-muted-foreground">Get started with Artispreneur for free</p>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 bg-input border-border text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-input border-border text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-input border-border text-base"
              />
              <p className="text-xs text-muted-foreground">Must be at least 6 characters long</p>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
