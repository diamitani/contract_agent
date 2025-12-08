"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileUp, Trash2, Eye, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import type { UploadedContract } from "@/lib/contract-store"

interface UploadedContractCardProps {
  contract: UploadedContract
  onDelete: (id: string) => void
  onView: (contract: UploadedContract) => void
}

export function UploadedContractCard({ contract, onDelete, onView }: UploadedContractCardProps) {
  const statusConfig = {
    uploaded: { icon: FileUp, color: "bg-amber-500/10 text-amber-500", label: "Uploaded" },
    analyzing: { icon: Loader2, color: "bg-blue-500/10 text-blue-500", label: "Analyzing" },
    analyzed: { icon: CheckCircle, color: "bg-green-500/10 text-green-500", label: "Analyzed" },
  }

  const status = statusConfig[contract.status]
  const StatusIcon = status.icon

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
            <FileUp className="w-5 h-5 text-accent" />
          </div>
          <Badge className={status.color}>
            <StatusIcon className={`w-3 h-3 mr-1 ${contract.status === "analyzing" ? "animate-spin" : ""}`} />
            {status.label}
          </Badge>
        </div>
        <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {contract.fileName}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {contract.fileType.toUpperCase()} • Uploaded {new Date(contract.uploadedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contract.analysis && (
          <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm text-foreground line-clamp-2">{contract.analysis.summary}</p>
            {contract.analysis.risks.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-amber-500 text-xs">
                <AlertCircle className="w-3 h-3" />
                {contract.analysis.risks.length} potential risks identified
              </div>
            )}
          </div>
        )}
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
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onView(contract)}
            disabled={contract.status === "analyzing"}
          >
            <Eye className="w-4 h-4 mr-2" />
            {contract.status === "analyzed" ? "View Analysis" : "View"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
