"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, Eye } from "lucide-react"
import Link from "next/link"
import type { ContractTemplate } from "@/lib/contracts"

interface ContractCardProps {
  contract: ContractTemplate
  onPreview: () => void
}

export function ContractCard({ contract, onPreview }: ContractCardProps) {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            {contract.category}
          </Badge>
        </div>
        <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
          {contract.name}
        </CardTitle>
        <CardDescription className="text-muted-foreground line-clamp-2">{contract.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span>{contract.fields.length} fields</span>
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
          <Button asChild size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
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
