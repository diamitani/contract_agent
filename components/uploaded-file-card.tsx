"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Download, Clock, FileIcon } from "lucide-react"
import type { UploadedFile } from "@/lib/contract-store"

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
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
            <IconComponent className="w-5 h-5 text-accent" />
          </div>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            {file.file_type.split("/")[1]?.toUpperCase() || "FILE"}
          </Badge>
        </div>
        <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {file.file_name}
        </CardTitle>
        <CardDescription className="text-muted-foreground">{formatFileSize(file.file_size)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock className="w-4 h-4" />
          <span>Uploaded {new Date(file.created_at).toLocaleDateString()}</span>
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
            <a href={file.storage_path} download={file.file_name} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
