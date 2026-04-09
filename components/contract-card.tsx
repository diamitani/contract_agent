"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, Eye, Sparkles } from "lucide-react"
import Link from "next/link"
import type { ContractTemplate } from "@/lib/contracts"
import { categoryImages, categoryColors } from "@/lib/contracts"
import Image from "next/image"

interface ContractCardProps {
  contract: ContractTemplate
  onPreview: () => void
}

export function ContractCard({ contract, onPreview }: ContractCardProps) {
  const categoryImage = categoryImages[contract.category]
  const categoryColor = categoryColors[contract.category] || { from: "#667EEA", to: "#764BA2" }

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group overflow-hidden hover:shadow-2xl hover:shadow-primary/10">
      {/* Beautiful Category Image Header */}
      <div className="relative h-48 w-full overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `linear-gradient(135deg, ${categoryColor.from}, ${categoryColor.to})`,
          }}
        />
        {categoryImage && (
          <Image
            src={categoryImage}
            alt={contract.category}
            fill
            className="object-cover mix-blend-overlay opacity-60 group-hover:scale-110 transition-transform duration-500"
          />
        )}
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Badge on Image */}
        <div className="absolute top-4 right-4 z-10">
          <Badge
            variant="secondary"
            className="bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-lg font-semibold"
          >
            {contract.category}
          </Badge>
        </div>

        {/* Icon Overlay */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-gray-900" />
          </div>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
          {contract.name}
          <Sparkles className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardTitle>
        <CardDescription className="text-muted-foreground line-clamp-2">{contract.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="font-medium">{contract.fields.length} fields</span>
          <span>•</span>
          <span>{contract.fields.filter((f) => f.required).length} required</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border hover:bg-secondary bg-transparent"
            onClick={onPreview}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button asChild size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Link href={`/generate/${contract.slug}`}>
              Generate
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
