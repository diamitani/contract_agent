"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { saveUploadedFile, type UploadedFile } from "@/lib/contract-store"
import { createClient } from "@/lib/supabase/client"

interface ContractUploadProps {
  onUpload: (file: UploadedFile) => void
}

export function ContractUpload({ onUpload }: ContractUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
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

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be signed in to upload files")
      }

      // Create a unique file path
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("contract-files")
        .upload(fileName, selectedFile)

      if (uploadError) {
        // If storage bucket doesn't exist, use a data URL as fallback
        console.warn("Storage upload failed, using local reference:", uploadError)
        const fileUrl = URL.createObjectURL(selectedFile)

        const uploadedFile = await saveUploadedFile({
          file_name: selectedFile.name,
          file_type: selectedFile.type || `application/${fileExt}`,
          file_size: selectedFile.size,
          storage_path: fileUrl,
        })

        if (uploadedFile) {
          onUpload(uploadedFile)
        }
      } else {
        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("contract-files").getPublicUrl(fileName)

        const uploadedFile = await saveUploadedFile({
          file_name: selectedFile.name,
          file_type: selectedFile.type || `application/${fileExt}`,
          file_size: selectedFile.size,
          storage_path: publicUrl,
        })

        if (uploadedFile) {
          onUpload(uploadedFile)
        }
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setSelectedFile(null)
      setUploading(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Upload Contract for Review</CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload existing contracts to store them securely in your account
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
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-foreground">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
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
