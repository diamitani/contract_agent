"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ContractCard } from "@/components/contract-card"
import { SavedContractCard } from "@/components/saved-contract-card"
import { UploadedFileCard } from "@/components/uploaded-file-card"
import { ContractUpload } from "@/components/contract-upload"
import { PDFPreviewModal } from "@/components/pdf-preview-modal"
import { FolderManager } from "@/components/folder-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { contractTemplates, type ContractTemplate } from "@/lib/contracts"
import {
  deleteContract,
  deleteUploadedFile,
  getFolders,
  type SavedContract,
  type UploadedFile,
  type Folder,
} from "@/lib/contract-store"
import { Search, FileText, FolderOpen, Upload, PlusCircle, LayoutDashboard } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface DashboardClientProps {
  initialContracts: SavedContract[]
  initialUploadedFiles: UploadedFile[]
  user: User
}

export function DashboardClient({ initialContracts, initialUploadedFiles, user }: DashboardClientProps) {
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>(initialContracts)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialUploadedFiles)
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewContract, setPreviewContract] = useState<ContractTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    getFolders().then(setFolders)
  }, [])

  const categories = Array.from(new Set(contractTemplates.map((c) => c.category)))

  const filteredTemplates = contractTemplates.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || contract.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Filter files by selected folder
  const filteredFiles = uploadedFiles.filter((file) => {
    if (selectedFolder === null) return true
    return file.folder_id === selectedFolder
  })

  const handlePreview = (contract: ContractTemplate) => {
    setPreviewContract(contract)
    setPreviewOpen(true)
  }

  const handleDeleteSaved = async (id: string) => {
    const success = await deleteContract(id)
    if (success) {
      setSavedContracts((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const handleDeleteUploaded = async (id: string) => {
    const success = await deleteUploadedFile(id)
    if (success) {
      setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
    }
  }

  const handleUpload = (file: UploadedFile) => {
    setUploadedFiles((prev) => [file, ...prev])
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Dashboard Header */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
              </h1>
              <p className="text-muted-foreground">
                Manage your contracts, create new ones, and upload documents for review
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{savedContracts.length}</p>
                <p className="text-xs text-muted-foreground">Saved Contracts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Upload className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{uploadedFiles.length}</p>
                <p className="text-xs text-muted-foreground">Uploaded</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{folders.length}</p>
                <p className="text-xs text-muted-foreground">Folders</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Content */}
      <section className="container mx-auto px-4 py-8">
        <Tabs defaultValue="saved" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger
              value="saved"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              My Contracts
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload & Review
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create New
            </TabsTrigger>
          </TabsList>

          {/* My Contracts Tab */}
          <TabsContent value="saved" className="space-y-6">
            {savedContracts.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-lg">
                <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-foreground mb-2">No saved contracts yet</p>
                <p className="text-muted-foreground">Start creating contracts and they&apos;ll appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedContracts.map((contract) => (
                  <SavedContractCard key={contract.id} contract={contract} onDelete={handleDeleteSaved} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upload & Review Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Folder Sidebar */}
              <Card className="lg:col-span-1">
                <CardContent className="pt-6">
                  <FolderManager
                    folders={folders}
                    onFoldersChange={setFolders}
                    selectedFolder={selectedFolder}
                    onSelectFolder={setSelectedFolder}
                  />
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                <ContractUpload onUpload={handleUpload} />

                {filteredFiles.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        {selectedFolder
                          ? `Files in ${folders.find((f) => f.id === selectedFolder)?.name}`
                          : "All Uploaded Files"}
                      </h3>
                      <Badge variant="secondary">{filteredFiles.length} files</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredFiles.map((file) => (
                        <UploadedFileCard key={file.id} file={file} onDelete={handleDeleteUploaded} />
                      ))}
                    </div>
                  </>
                )}

                {filteredFiles.length === 0 && uploadedFiles.length > 0 && selectedFolder && (
                  <div className="text-center py-12 bg-card border border-border rounded-lg">
                    <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-foreground mb-2">No files in this folder</p>
                    <p className="text-muted-foreground">Upload files or move existing files here</p>
                  </div>
                )}

                {uploadedFiles.length === 0 && (
                  <div className="text-center py-12 bg-card border border-border rounded-lg">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-foreground mb-2">No uploaded files yet</p>
                    <p className="text-muted-foreground">Upload contracts to analyze and organize them</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Create New Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
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
              {filteredTemplates.map((contract) => (
                <ContractCard key={contract.id} contract={contract} onPreview={() => handlePreview(contract)} />
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-foreground">No templates found</p>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <PDFPreviewModal contract={previewContract} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  )
}
