"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthUser } from "@/hooks/use-auth-user"
import { Header } from "@/components/header"
import { AiContractBuilder } from "@/components/ai-contract-builder"
import { ContractCard } from "@/components/contract-card"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSavedContracts, type SavedContract } from "@/lib/contract-store"
import { contractTemplates, type ContractTemplate } from "@/lib/contracts"
import {
  FileText,
  Upload,
  FolderOpen,
  Crown,
  Zap,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  Loader2,
  Search,
  Shield,
  Brain,
  Download,
  PenTool,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.5, ease: "easeOut" as const } },
}

function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewContract, setPreviewContract] = useState<ContractTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const categories = Array.from(new Set(contractTemplates.map((c) => c.category)))
  const filteredContracts = contractTemplates.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || contract.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handlePreview = (contract: ContractTemplate) => {
    setPreviewContract(contract)
    setPreviewOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Contract Generation</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance tracking-tight">
            Professional Contracts for the
            <span className="text-primary block mt-2"> Music Industry</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 text-pretty">
            Generate legally structured agreements in minutes. From recording deals to management contracts, protect your music business with AI-powered documentation.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-wrap justify-center gap-4 mb-6">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 h-14 px-8 text-base">
                Get Started Free <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="#contracts">
              <Button size="lg" variant="outline" className="hover:bg-accent hover:text-accent-foreground hover:border-accent hover:-translate-y-1 transition-all duration-300 h-14 px-8 text-base">
                Browse Templates <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="flex flex-wrap justify-center gap-8 md:gap-12 pt-8 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
              <div className="text-left"><p className="font-semibold text-foreground">{contractTemplates.length}+ Templates</p><p className="text-sm text-muted-foreground">Industry-standard</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Zap className="w-5 h-5 text-accent" /></div>
              <div className="text-left"><p className="font-semibold text-foreground">2 Min Generation</p><p className="text-sm text-muted-foreground">AI-powered speed</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><Shield className="w-5 h-5 text-green-500" /></div>
              <div className="text-left"><p className="font-semibold text-foreground">Legally Sound</p><p className="text-sm text-muted-foreground">Professional language</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center"><Users className="w-5 h-5 text-chart-4" /></div>
              <div className="text-left"><p className="font-semibold text-foreground">5,000+ Professionals</p><p className="text-sm text-muted-foreground">Trust Artispreneur</p></div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="contracts" className="border-y border-border bg-secondary/30 relative">
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Generate Your Contract</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">Select a template to start generating your AI-powered contract</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="flex flex-col gap-4 mb-12 max-w-3xl mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search contracts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <Badge variant={selectedCategory === null ? "default" : "outline"} className={`cursor-pointer ${selectedCategory === null ? "bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"}`} onClick={() => setSelectedCategory(null)}>All</Badge>
              {categories.map((category) => (
                <Badge key={category} variant={selectedCategory === category ? "default" : "outline"} className={`cursor-pointer ${selectedCategory === category ? "bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"}`} onClick={() => setSelectedCategory(category)}>{category}</Badge>
              ))}
            </div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredContracts.map((contract) => (
              <motion.div variants={fadeIn} key={contract.id}>
                <ContractCard contract={contract} onPreview={() => handlePreview(contract)} />
              </motion.div>
            ))}
          </motion.div>
          {filteredContracts.length === 0 && (
            <div className="text-center py-12"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-lg text-foreground">No contracts found</p><p className="text-muted-foreground">Try adjusting your search or filters</p></div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Everything You Need</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">Complete contract management for music professionals</p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Sparkles, title: "AI Generation", desc: "Complete professional contracts in minutes", checks: [`${contractTemplates.length}+ industry templates`, "Customized to your terms", "Legally structured language"], href: "/auth/sign-up", color: "primary" },
            { icon: Brain, title: "AI Analysis", desc: "Instantly understand any contract you receive", checks: ["Upload PDF, DOCX & more", "Identify risks and red flags", "Chat with AI about any clause"], href: "/auth/sign-up", color: "accent" },
            { icon: Download, title: "Free Templates", desc: "Download professional templates instantly", checks: ["Industry-standard formats", "Preview before download", "Email delivery included"], href: "/templates", color: "chart-5" },
            { icon: TrendingUp, title: "PDF Preview & Export", desc: "Print-ready PDFs with one click", checks: ["Professional formatted output", "Preview before downloading", "Ready to sign and send"], href: "/pricing", color: "green-500" },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <motion.div variants={fadeIn} key={i} className="h-full">
                <Card className={`bg-card/50 backdrop-blur-sm border-border/40 hover:border-${item.color}/50 transition-all duration-300 hover:shadow-xl hover:shadow-${item.color}/5 hover:-translate-y-1 h-full flex flex-col`}>
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl bg-${item.color}/10 flex items-center justify-center mb-4`}>
                      <Icon className={`w-7 h-7 text-${item.color}`} />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription>{item.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                      {item.checks.map((check, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <CheckCircle2 className={`w-4 h-4 text-${item.color} mt-0.5 shrink-0`} />
                          <span>{check}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={item.href}><Button className={`w-full ${item.color === "primary" ? "bg-primary hover:bg-primary/90" : item.color === "accent" ? "border-accent text-accent hover:bg-accent/10 bg-transparent" : item.color === "chart-5" ? "border-chart-5 text-chart-5 hover:bg-chart-5/10 bg-transparent" : "border-green-500 text-green-500 hover:bg-green-500/10 bg-transparent"} ${item.color !== "primary" ? "variant=outline" : ""}`}>{item.title === "PDF Preview & Export" ? "See Pricing" : item.title === "Free Templates" ? "Browse Templates" : "Try Now"} <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      <section className="border-y border-border bg-gradient-to-b from-secondary/30 to-background overflow-hidden relative">
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Why Music Professionals Choose Us</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">Built specifically for the music industry by people who understand it</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Zap, title: "Fast & Efficient", desc: "Generate complete contracts in minutes, not hours. Our AI understands music industry terminology." },
              { icon: Shield, title: "Legally Sound", desc: "Every template uses industry-standard legal language. Protect yourself with proper documentation." },
              { icon: Clock, title: "Save Time & Money", desc: "Skip expensive lawyer consultations for standard agreements. Professional contracts at a fraction of the cost." },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div variants={fadeIn} key={index} className="text-center group">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-lg shadow-primary/5">
                    <Icon className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Trusted by Professionals</h2></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "Saved me thousands in legal fees. The contracts are professional and comprehensive.", author: "Marcus J.", role: "Independent Producer" },
            { quote: "Finally, contracts that actually understand the music industry. Game changer.", author: "Sarah L.", role: "Artist Manager" },
            { quote: "I use Artispreneur for all my client agreements. Fast, reliable, professional.", author: "James K.", role: "Session Musician" },
          ].map((t, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => (<Star key={j} className="w-4 h-4 fill-primary text-primary" />))}</div>
                <p className="text-foreground mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div><p className="font-semibold text-foreground">{t.author}</p><p className="text-sm text-muted-foreground">{t.role}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-primary/5">
        <div className="container mx-auto px-4 py-24 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn}>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Ready to Protect Your Music Business?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">Join thousands of artists, producers, and music professionals who trust Artispreneur.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
                  Get Started Free <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg hover:bg-accent hover:text-accent-foreground hover:border-accent hover:-translate-y-1 transition-all duration-300">
                  View Pricing <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Artispreneur. All rights reserved.</p>
        </div>
      </footer>

      <PDFPreviewModal contract={previewContract} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}

function DashboardContent() {
  const { user } = useAuthUser()
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([])
  const [subscription, setSubscription] = useState<{ status: string; contractsRemaining: number } | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getSavedContracts(),
      fetch("/api/check-subscription").then((r) => r.json()).catch(() => null),
    ]).then(([contracts, sub]) => {
      setSavedContracts(contracts)
      setSubscription(sub)
    })
  }, [user])

  const recentContracts = savedContracts.slice(0, 3)
  const stats = [
    { icon: FileText, label: "Saved Contracts", value: savedContracts.length, color: "text-primary", bg: "bg-primary/10" },
    { icon: Upload, label: "Uploaded", value: "0", color: "text-accent", bg: "bg-accent/10" },
    { icon: FolderOpen, label: "Templates", value: contractTemplates.length, color: "text-green-500", bg: "bg-green-500/10" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Welcome{user?.name ? `, ${user.name}` : " back"}
                </h1>
                <p className="text-sm text-muted-foreground">Generate contracts with AI, manage your documents</p>
              </div>
            </div>
            {subscription && subscription.status !== "unlimited" && (
              <Button asChild size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black hidden sm:inline-flex">
                <Link href="/checkout/unlimited"><Crown className="w-4 h-4 mr-1" />Upgrade</Link>
              </Button>
            )}
          </div>
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
      <section className="container mx-auto px-4 py-8">
        <AiContractBuilder onContractSaved={() => getSavedContracts().then(setSavedContracts)} />
      </section>
      {recentContracts.length > 0 && (
        <section className="border-t border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Recent Contracts
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link href="/dashboard">View all <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentContracts.map((contract) => (
                <Card key={contract.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{contract.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(contract.created_at || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Artispreneur. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage() {
  const { user, loading } = useAuthUser()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return <DashboardContent />
  }

  return <LandingPage />
}
