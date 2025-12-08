"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { ContractCard } from "@/components/contract-card"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"
import { contractTemplates } from "@/lib/contracts"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Sparkles, FileText, Shield, Zap } from "lucide-react"
import type { ContractTemplate } from "@/lib/contracts"

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
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Contract Generation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Professional Contracts for
            <span className="text-primary"> Music Industry</span> Professionals
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            Generate legally structured agreements for artists, producers, managers, and creators. Select a template,
            fill in your details, and get a complete contract in minutes.
          </p>

          <div className="flex flex-wrap justify-center gap-8 mt-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">{contractTemplates.length}+ Templates</p>
                <p className="text-sm text-muted-foreground">Industry-standard contracts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">AI Analysis</p>
                <p className="text-sm text-muted-foreground">Understand every clause</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-chart-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Secure Export</p>
                <p className="text-sm text-muted-foreground">PDF & email delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contracts Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} onPreview={() => handlePreview(contract)} />
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-foreground">No contracts found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </section>

      <PDFPreviewModal contract={previewContract} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}
