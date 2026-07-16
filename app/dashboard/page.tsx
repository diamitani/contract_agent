"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { contractTemplates } from "@/lib/contracts"
import { Sparkles, FileText, ArrowRight, Download, LayoutDashboard, Crown } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [savedContracts, setSavedContracts] = useState<any[]>([])

  useEffect(() => {
    try {
      const p = localStorage.getItem("artispreneur_profile")
      if (p) setProfile(JSON.parse(p))
      const saved = localStorage.getItem("artispreneur_saved_contracts")
      if (saved) setSavedContracts(JSON.parse(saved))
    } catch {}
  }, [])

  const displayName = profile?.stageName || profile?.firstName || "Artist"
  const initial = displayName[0]?.toUpperCase() || "A"

  return (
    <div style={{ backgroundColor: "#050505", minHeight: "100vh" }}>
      <Header />

      <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "32px 0", background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,162,39,0.04), transparent 60%), #050505" }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#CC0000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>{initial}</div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>Dashboard</h1>
              <p className="text-[13px]" style={{ color: "rgba(250,250,250,0.4)" }}>Welcome back, {displayName}. Manage your contracts here.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { label: "Saved Contracts", value: savedContracts.length, icon: FileText, color: "#C9A227" },
              { label: "Templates", value: contractTemplates.length, icon: LayoutDashboard, color: "#CC0000" },
              { label: "Status", value: "Free", icon: Crown, color: "#C9A227" },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div><p className="text-lg font-bold text-white">{stat.value}</p><p className="text-[10px] uppercase tracking-[0.06em]" style={{ color: "rgba(250,250,250,0.3)" }}>{stat.label}</p></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Quick actions */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <Link href="/generate">
            <button style={{ background: "#CC0000", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles className="w-4 h-4" /> New Contract
            </button>
          </Link>
          <Link href="/templates">
            <button style={{ background: "transparent", color: "#FAFAFA", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Browse Templates
            </button>
          </Link>
        </div>

        {/* Saved Contracts */}
        <h3 className="text-[15px] font-bold text-white mb-4" style={{ fontFamily: "var(--font-serif)" }}>Saved Contracts</h3>
        {savedContracts.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {savedContracts.map((c: any, i: number) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "16px 18px" }}>
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-4 h-4" style={{ color: "#C9A227", opacity: 0.6 }} />
                  <p className="text-[13px] font-semibold text-white truncate">{c.title || "Contract"}</p>
                </div>
                <p className="text-[10px]" style={{ color: "rgba(250,250,250,0.25)" }}>{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(250,250,250,0.1)" }} />
            <p className="text-[13px]" style={{ color: "rgba(250,250,250,0.25)" }}>No saved contracts yet.</p>
            <Link href="/generate" className="text-[12px] font-semibold mt-2 inline-block" style={{ color: "#C9A227" }}>Generate your first contract →</Link>
          </div>
        )}
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px", marginTop: 40 }}>
        <div className="container mx-auto text-center">
          <p className="text-[11px]" style={{ color: "rgba(250,250,250,0.2)" }}>&copy; {new Date().getFullYear()} Artispreneur. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
