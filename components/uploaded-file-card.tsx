"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Eye, Clock, FileIcon, Sparkles } from "lucide-react"
import type { UploadedFile } from "@/lib/contract-store"
import Link from "next/link"

interface UploadedFileCardProps {
  file: UploadedFile
  onDelete: (id: string) => void
}

export function UploadedFileCard({ file, onDelete }: UploadedFileCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = () => {
    if (file.file_type.includes("pdf")) return FileText
    return FileIcon
  }

  const IconComponent = getFileIcon()

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <IconComponent className="w-5 h-5 text-accent" />
          </div>
          <div className="flex gap-2 flex-wrap justify-end shrink-0">
            {file.analysis_status === "completed" && (
              <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Analyzed
              </Badge>
            )}
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              {file.file_type.split("/")[1]?.toUpperCase() || "FILE"}
            </Badge>
          </div>
        </div>
        <div className="mt-3 w-full overflow-hidden">
          <CardTitle
            className="text-lg text-foreground group-hover:text-primary transition-colors truncate block w-full max-w-full"
            title={file.file_name}
          >
            {file.file_name}
          </CardTitle>
          <CardDescription className="text-muted-foreground">{formatFileSize(file.file_size)}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="truncate">Uploaded {new Date(file.created_at).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border hover:bg-secondary bg-transparent"
            onClick={() => onDelete(file.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link href={`/files/${file.id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
