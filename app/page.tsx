"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { ContractCard } from "@/components/contract-card"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"
import { contractTemplates } from "@/lib/contracts"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search,
  Sparkles,
  FileText,
  Shield,
  Zap,
  Download,
  Brain,
  PenTool,
  CheckCircle2,
  ArrowRight,
  Clock,
  Star,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import type { ContractTemplate } from "@/lib/contracts"

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.5,
      ease: "easeOut" as const
    }
  }
}

export default function HomePage() {
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

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Contract Generation</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance tracking-tight"
          >
            Professional Contracts for the
            <span className="text-primary block mt-2"> Music Industry</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 text-pretty"
          >
            Generate legally structured agreements in minutes. From recording deals to management contracts, protect
            your music business with AI-powered documentation.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            <Link href="#contracts">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground group transition-all duration-300 transform shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1">
                Generate Contract <Sparkles className="w-4 h-4 ml-2 group-hover:scale-125 transition-transform" />
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline" className="group transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:border-accent hover:-translate-y-1">
                Free Templates <Download className="w-4 h-4 ml-2 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 md:gap-12 pt-8 border-t border-border/50"
          >
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">{contractTemplates.length}+ Templates</p>
                <p className="text-sm text-muted-foreground">Industry-standard</p>
              </div>
            </div>
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">2 Min Generation</p>
                <p className="text-sm text-muted-foreground">AI-powered speed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center group-hover:bg-chart-5/20 transition-colors">
                <Shield className="w-5 h-5 text-chart-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Legally Sound</p>
                <p className="text-sm text-muted-foreground">Professional language</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works - Quick Overview */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Create professional contracts in four simple steps
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {[
            {
              step: "01",
              icon: FileText,
              title: "Choose Template",
              description: "Select from 21+ contract templates",
            },
            {
              step: "02",
              icon: PenTool,
              title: "Fill Details",
              description: "Enter your terms and conditions",
            },
            {
              step: "03",
              icon: Sparkles,
              title: "AI Generation",
              description: "Get a complete contract in minutes",
            },
            {
              step: "04",
              icon: Download,
              title: "Download & Sign",
              description: "Export as PDF and send for signatures",
            },
          ].map((item, index) => (
            <motion.div variants={fadeIn} key={index} className="relative group perspective-1000">
              <div className="bg-card/50 backdrop-blur-sm border border-border/40 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 rounded-2xl p-8 h-full text-center transition-all duration-500 ease-out transform group-hover:-translate-y-2">
                <div className="text-5xl font-black text-primary/10 mb-6 group-hover:scale-110 transition-transform duration-500">{item.step}</div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-base text-muted-foreground">{item.description}</p>
              </div>
              {index < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 text-muted-foreground/30">
                  <ArrowRight className="w-8 h-8" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Contract Generation Section */}
      <section id="contracts" className="border-y border-border bg-secondary/30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50 pointer-events-none" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Generate Your Contract</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Select a template to start generating your AI-powered contract
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="flex flex-col gap-4 mb-12 max-w-3xl mx-auto"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <Badge
                variant={selectedCategory === null ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedCategory === null
                    ? "bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-secondary"
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className={`cursor-pointer ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </motion.div>

          {/* Contract Grid */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredContracts.map((contract) => (
              <motion.div variants={fadeIn} key={contract.id}>
                <ContractCard contract={contract} onPreview={() => handlePreview(contract)} />
              </motion.div>
            ))}
          </motion.div>

          {filteredContracts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-foreground">No contracts found</p>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Everything You Need</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete contract management for music professionals
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          <motion.div variants={fadeIn} className="h-full">
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 h-full flex flex-col">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl">AI Contract Generation</CardTitle>
              <CardDescription>Generate complete, professional contracts in minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>21+ industry-specific templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Customized to your specific terms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Legally structured language</span>
                </li>
              </ul>
            </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn} className="h-full">
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 h-full flex flex-col">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Brain className="w-7 h-7 text-accent" />
              </div>
              <CardTitle className="text-xl">Upload & Analyze</CardTitle>
              <CardDescription>AI-powered analysis of any contract you receive</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Support for PDF, DOCX, and more</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Identify risks and key terms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Chat to ask questions</span>
                </li>
              </ul>
            </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn} className="h-full">
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 hover:border-chart-5/50 transition-all duration-300 hover:shadow-xl hover:shadow-chart-5/5 hover:-translate-y-1 h-full flex flex-col">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-chart-5/10 flex items-center justify-center mb-4">
                <Download className="w-7 h-7 text-chart-5" />
              </div>
              <CardTitle className="text-xl">Free Templates</CardTitle>
              <CardDescription>Download professional templates at no cost</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-5 mt-0.5 shrink-0" />
                  <span>Industry-standard formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-5 mt-0.5 shrink-0" />
                  <span>Preview before download</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-5 mt-0.5 shrink-0" />
                  <span>Email delivery included</span>
                </li>
              </ul>
              <Link href="/templates">
                <Button
                  variant="outline"
                  className="w-full mt-6 border-chart-5 text-chart-5 hover:bg-chart-5/10 bg-transparent"
                >
                  Browse Templates <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Why Choose Us */}
      <section className="border-y border-border bg-gradient-to-b from-secondary/30 to-background overflow-hidden relative">
        <div className="absolute -left-40 -top-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -right-40 -bottom-40 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Why Music Professionals Choose Us</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for the music industry by people who understand it
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              {
                icon: Zap,
                title: "Fast & Efficient",
                description:
                  "Generate complete contracts in minutes, not hours. Our AI understands music industry terminology.",
              },
              {
                icon: Shield,
                title: "Legally Sound",
                description:
                  "Every template uses industry-standard legal language. Protect yourself with proper documentation.",
              },
              {
                icon: Clock,
                title: "Save Time & Money",
                description:
                  "Skip expensive lawyer consultations for standard agreements. Professional contracts at a fraction of the cost.",
              },
            ].map((item, index) => (
              <motion.div variants={fadeIn} key={index} className="text-center group">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-lg shadow-primary/5">
                  <item.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Trusted by Professionals</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "Saved me thousands in legal fees. The contracts are professional and comprehensive.",
              author: "Marcus J.",
              role: "Independent Producer",
            },
            {
              quote: "Finally, contracts that actually understand the music industry. Game changer.",
              author: "Sarah L.",
              role: "Artist Manager",
            },
            {
              quote: "I use Artispreneur for all my client agreements. Fast, reliable, professional.",
              author: "James K.",
              role: "Session Musician",
            },
          ].map((testimonial, index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary/5">
        <div className="container mx-auto px-4 py-24 text-center">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeIn}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Ready to Protect Your Music Business?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Join thousands of artists, producers, and music professionals who trust Artispreneur.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="#contracts">
                <Button size="lg" className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
                  Generate a Contract <Sparkles className="w-5 h-5 ml-2" />
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

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Artispreneur. All rights reserved.</p>
        </div>
      </footer>

      <PDFPreviewModal contract={previewContract} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}
