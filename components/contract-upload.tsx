"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import type { UploadedFile } from "@/lib/contract-store"

interface ContractUploadProps {
  onUpload: (file: UploadedFile) => void
}

export function ContractUpload({ onUpload }: ContractUploadProps) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === "application/pdf" || file.name.endsWith(".docx") || file.name.endsWith(".doc"))) {
      setSelectedFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadStatus("Uploading file...")

    try {
      setUploadStatus("Processing & uploading document...")

      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/upload-file", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Upload failed")
      }

      const uploadedFile = await response.json()

      setUploadStatus("Done!")
      onUpload(uploadedFile)
      router.push(`/files/${uploadedFile.id}`)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setSelectedFile(null)
      setUploading(false)
      setTimeout(() => setUploadStatus(""), 3000)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Upload Contract for Review</CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload contracts to store, analyze with AI, and get instant insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          {selectedFile ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-foreground">{selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {uploadStatus && <p className="text-sm text-muted-foreground">{uploadStatus}</p>}
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground mb-2">Drag and drop your contract here</p>
              <p className="text-sm text-muted-foreground mb-4">Supports PDF, DOC, DOCX files</p>
              <label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
                <Button variant="outline" className="border-border hover:bg-secondary bg-transparent" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
