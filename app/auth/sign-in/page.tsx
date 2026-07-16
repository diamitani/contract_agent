"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { ArrowRight, LogIn } from "lucide-react"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Check if profile exists in localStorage
    setTimeout(() => {
      try {
        const profile = localStorage.getItem("artispreneur_profile")
        if (!profile) {
          setError("No account found with that email. Please sign up first.")
          setLoading(false)
          return
        }

        const parsed = JSON.parse(profile)
        if (parsed.email?.toLowerCase() === email.toLowerCase() && password.length >= 8) {
          localStorage.setItem("artispreneur_logged_in", "true")
          router.push("/")
        } else if (parsed.email?.toLowerCase() !== email.toLowerCase()) {
          setError("No account found with that email. Please sign up first.")
        } else {
          setError("Invalid password. Please try again.")
        }
      } catch {
        setError("Something went wrong. Please try again.")
      }
      setLoading(false)
    }, 800)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, color: "#FAFAFA", fontFamily: "inherit", fontSize: 14,
    outline: "none", transition: "border-color 200ms",
  }

  return (
    <div style={{ backgroundColor: "#050505", minHeight: "100vh" }}>
      <Header />

      <section style={{
        minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "40px 20px",
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,162,39,0.04), transparent 60%), #050505",
      }}>
        <div style={{
          maxWidth: 420, width: "100%",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, padding: "36px 36px",
        }}>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, color: "#FAFAFA" }}>
                Rostr<span style={{ color: "#C9A227" }}>Contracts</span>
              </span>
            </div>
            <h2 className="text-[20px] font-bold text-white mb-2" style={{ fontFamily: "var(--font-serif)" }}>
              Welcome back
            </h2>
            <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.35)" }}>
              Sign in to your contract agent workspace
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 600,
                color: "rgba(250,250,250,0.5)", marginBottom: 6, letterSpacing: "0.02em",
              }}>
                Email
              </label>
              <input
                style={inputStyle}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                required
              />
            </div>

            <div>
              <label style={{
                display: "block", fontSize: 12, fontWeight: 600,
                color: "rgba(250,250,250,0.5)", marginBottom: 6, letterSpacing: "0.02em",
              }}>
                Password
              </label>
              <input
                style={inputStyle}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                required
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8, padding: "10px 14px", color: "#EF4444", fontSize: 12, fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "rgba(255,255,255,0.05)" : "#CC0000",
                color: loading ? "rgba(250,250,250,0.2)" : "#fff",
                border: "none", borderRadius: 8, padding: "13px 0", fontSize: 14, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8, transition: "all 200ms",
                width: "100%", marginTop: 4,
              }}>
              {loading ? (
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "2px solid rgba(250,250,250,0.15)", borderTopColor: "rgba(250,250,250,0.4)",
                  animation: "spin 0.6s linear infinite", display: "inline-block",
                }} />
              ) : (
                <>Sign In <LogIn className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.3)" }}>
              Don't have an account?{" "}
              <Link href="/auth/sign-up" style={{ color: "#C9A227", fontWeight: 600 }}>
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
