"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Download, Clock, Eye } from "lucide-react"
import type { SavedContract } from "@/lib/contract-store"

interface SavedContractCardProps {
  contract: SavedContract
  onDelete: (id: string) => void
}

export function SavedContractCard({ contract, onDelete }: SavedContractCardProps) {
  const handleDownload = () => {
    // Create a blob from the contract content and download as PDF
    const blob = new Blob([contract.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${contract.title.replace(/\s+/g, "-").toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleViewPDF = () => {
    // Open the PDF generation endpoint in a new window
    const pdfUrl = `/api/generate-pdf?content=${encodeURIComponent(contract.content)}&title=${encodeURIComponent(contract.title)}`
    window.open(pdfUrl, "_blank")
  }

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            {contract.contract_type}
          </Badge>
        </div>
        <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {contract.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground line-clamp-2">
          {contract.content.substring(0, 100)}...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock className="w-4 h-4" />
          <span>Created {new Date(contract.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border hover:bg-secondary bg-transparent"
            onClick={() => onDelete(contract.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border hover:bg-secondary bg-transparent"
            onClick={handleViewPDF}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
