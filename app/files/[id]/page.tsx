"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { deleteUploadedFile, getFolders, getUploadedFiles, moveFileToFolder, updateUploadedFile } from "@/lib/contract-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  FileText,
  Download,
  Trash2,
  FolderOpen,
  Brain,
  MessageSquare,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Shield,
  Expand,
  ZoomIn,
  ZoomOut,
  X,
  Lock,
  Crown,
  Pencil,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

interface UploadedFile {
  id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  folder_id: string | null
  extracted_text: string | null
  analysis_status: string | null
  analysis_result: any
  created_at: string
}

interface Folder {
  id: string
  name: string
  color: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface EditHistoryEntry {
  instruction: string
  timestamp: string
}

export default function FileViewerPage() {
  const params = useParams()
  const router = useRouter()
  const fileId = params.id as string

  const [file, setFile] = useState<UploadedFile | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [pdfScale, setPdfScale] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [pdfError, setPdfError] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)

  // Edit workspace state
  const [editText, setEditText] = useState("")
  const [editInstruction, setEditInstruction] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editHistory, setEditHistory] = useState<EditHistoryEntry[]>([])
  const [editSnapshots, setEditSnapshots] = useState<string[]>([])
  const [editError, setEditError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const editChatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      const sessionRes = await fetch("/api/auth/session")
      const sessionData = await sessionRes.json()
      if (!sessionData?.user) {
        router.push("/auth/sign-in")
        return
      }

      const subscriptionRes = await fetch("/api/check-subscription")
      const subscriptionData = await subscriptionRes.json()
      setHasSubscription(subscriptionData?.status === "unlimited")

      const [uploadedFiles, foldersData] = await Promise.all([getUploadedFiles(), getFolders()])
      const fileData = uploadedFiles.find((entry) => entry.id === fileId)

      if (!fileData) {
        router.push("/dashboard")
        return
      }

      setFile(fileData)
      setNewName(fileData.file_name)
      setEditText(fileData.extracted_text || "")
      setFolders(foldersData || [])
      setLoading(false)
    }

    fetchData()
  }, [fileId, router])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  useEffect(() => {
    editChatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [editHistory])

  const handleRename = async () => {
    if (!file || !newName.trim()) return
    const updated = await updateUploadedFile(file.id, { file_name: newName.trim() })
    if (updated) {
      setFile((prev) => (prev ? { ...prev, file_name: newName.trim() } : null))
      setIsEditing(false)
    }
  }

  const handleFolderChange = async (folderId: string) => {
    if (!file) return
    const newFolderId = folderId === "none" ? null : folderId
    const moved = await moveFileToFolder(file.id, newFolderId)
    if (moved) setFile((prev) => (prev ? { ...prev, folder_id: newFolderId } : null))
  }

  const handleDelete = async () => {
    if (!file) return
    const deleted = await deleteUploadedFile(file.id)
    if (deleted) router.push("/dashboard")
  }

  const handleAnalyze = async () => {
    if (!file || !hasSubscription) return
    setAnalyzing(true)
    try {
      const response = await fetch("/api/analyze-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, storagePath: file.storage_path }),
      })
      if (response.ok) {
        const result = await response.json()
        setFile((prev) =>
          prev ? { ...prev, analysis_status: "completed", analysis_result: result.analysis } : null,
        )
      } else {
        const error = await response.json()
        if (error.requiresSubscription) setHasSubscription(false)
      }
    } catch {}
    finally { setAnalyzing(false) }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !file || !hasSubscription) return
    const userMessage = chatInput.trim()
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setChatLoading(true)
    try {
      const response = await fetch("/api/chat-about-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          message: userMessage,
          context: file.extracted_text,
          history: chatMessages,
          analysis: file.analysis_result,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      } else {
        const error = await response.json()
        if (error.requiresSubscription) setHasSubscription(false)
        setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${error.error || "Failed"}` }])
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, an error occurred." }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editInstruction.trim() || !editText.trim() || editLoading) return
    const instruction = editInstruction.trim()
    setEditInstruction("")
    setEditLoading(true)
    setEditError(null)

    // Save snapshot for undo
    setEditSnapshots((prev) => [...prev, editText])

    try {
      const response = await fetch("/api/edit-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText: editText,
          instruction,
          history: editHistory,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setEditHistory((prev) => [
          ...prev,
          { instruction, timestamp: new Date().toLocaleTimeString() },
        ])
        setEditText(data.editedText)
      } else {
        const err = await response.json()
        setEditError(err.error || "Edit failed")
        // Roll back snapshot since edit failed
        setEditSnapshots((prev) => prev.slice(0, -1))
      }
    } catch {
      setEditError("Network error. Please try again.")
      setEditSnapshots((prev) => prev.slice(0, -1))
    } finally {
      setEditLoading(false)
    }
  }

  const handleUndo = () => {
    if (editSnapshots.length === 0) return
    const previous = editSnapshots[editSnapshots.length - 1]
    setEditText(previous)
    setEditSnapshots((prev) => prev.slice(0, -1))
    setEditHistory((prev) => prev.slice(0, -1))
  }

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(editText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadEdited = () => {
    const blob = new Blob([editText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = (file?.file_name.replace(/\.[^.]+$/, "") || "contract") + "-edited.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getGoogleViewerUrl = (url: string) =>
    `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`

  const renderPdfViewer = () => {
    if (!file) return null
    const isPdf = file.file_type === "application/pdf" || file.file_name.toLowerCase().endsWith(".pdf")
    const isImage = file.file_type.startsWith("image/")

    if (isImage) {
      return (
        <div className="h-[600px] flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
          <img
            src={file.storage_path || "/placeholder.svg"}
            alt={file.file_name}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${pdfScale / 100})` }}
          />
        </div>
      )
    }

    return (
      <div className="h-[600px] border rounded-lg overflow-hidden relative bg-muted/30">
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/80 backdrop-blur rounded-lg p-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPdfScale(Math.max(50, pdfScale - 10))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs w-10 text-center">{pdfScale}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPdfScale(Math.min(200, pdfScale + 10))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(true)}>
            <Expand className="w-3.5 h-3.5" />
          </Button>
        </div>

        {pdfLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {pdfError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <FileText className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Unable to preview document</p>
            <Button asChild variant="outline" size="sm">
              <a href={file.storage_path} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />Download to View
              </a>
            </Button>
          </div>
        ) : (
          <iframe
            src={isPdf
              ? getGoogleViewerUrl(file.storage_path)
              : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.storage_path)}`}
            className="w-full h-full border-0"
            style={{ transform: `scale(${pdfScale / 100})`, transformOrigin: "top left" }}
            onLoad={() => setPdfLoading(false)}
            onError={() => { setPdfLoading(false); setPdfError(true) }}
            title={file.file_name}
          />
        )}
      </div>
    )
  }

  const SubscriptionPaywall = ({ feature }: { feature: string }) => (
    <div className="flex flex-col items-center text-center gap-4 py-16">
      <div className="p-3 rounded-full bg-primary/10">
        <Crown className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h3 className="text-base font-semibold mb-1">Unlock {feature}</h3>
        <p className="text-muted-foreground text-sm mb-4 max-w-xs">
          AI-powered contract editing, analysis, and chat require the Unlimited plan.
        </p>
      </div>
      <Button asChild>
        <Link href="/checkout/unlimited">
          <Lock className="w-4 h-4 mr-2" />Upgrade to Unlimited
        </Link>
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">File not found</p>
      </div>
    )
  }

  const analysisResult = file.analysis_result

  return (
    <div className="min-h-screen bg-background">
      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{file.file_name}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 h-[calc(95vh-60px)]">
            <iframe
              src={file.file_name.toLowerCase().endsWith(".pdf")
                ? getGoogleViewerUrl(file.storage_path)
                : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.storage_path)}`}
              className="w-full h-full border-0"
              title={file.file_name}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="max-w-md h-9"
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  autoFocus
                />
                <Button size="sm" onClick={handleRename}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold truncate">{file.file_name}</h1>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(file.created_at).toLocaleDateString()}</span>
              <span>·</span>
              <span>{formatFileSize(file.file_size)}</span>
              <span>·</span>
              <Select value={file.folder_id || "none"} onValueChange={handleFolderChange}>
                <SelectTrigger className="h-5 text-xs border-0 p-0 gap-1 w-auto bg-transparent">
                  <FolderOpen className="w-3 h-3" />
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <a href={file.storage_path} target="_blank" rel="noopener noreferrer">
                <Download className="w-3.5 h-3.5 mr-1.5" />Download
              </a>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete File</AlertDialogTitle>
                  <AlertDialogDescription>Delete "{file.file_name}"? This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="mb-5">
            <TabsTrigger value="view">
              <FileText className="w-3.5 h-3.5 mr-1.5" />View
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Pencil className="w-3.5 h-3.5 mr-1.5" />AI Edit
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <Brain className="w-3.5 h-3.5 mr-1.5" />Analysis
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Ask AI
            </TabsTrigger>
          </TabsList>

          {/* VIEW TAB */}
          <TabsContent value="view">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Original document</p>
              {hasSubscription ? (
                <Button onClick={handleAnalyze} disabled={analyzing} size="sm" variant="outline">
                  {analyzing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1.5" />}
                  {file.analysis_result ? "Re-analyze" : "Analyze"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/checkout/unlimited"><Lock className="w-3.5 h-3.5 mr-1.5" />Unlock Analysis</Link>
                </Button>
              )}
            </div>
            {renderPdfViewer()}
          </TabsContent>

          {/* AI EDIT TAB */}
          <TabsContent value="edit">
            {!hasSubscription ? (
              <SubscriptionPaywall feature="AI Contract Editing" />
            ) : (
              <div className="grid lg:grid-cols-2 gap-4" style={{ minHeight: "560px" }}>
                {/* Left: editable contract text */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Contract Text</p>
                    <div className="flex items-center gap-1">
                      {editSnapshots.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleUndo}>
                          <RotateCcw className="w-3 h-3" />Undo
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleCopyText}>
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleDownloadEdited}>
                        <Download className="w-3 h-3" />Save .txt
                      </Button>
                    </div>
                  </div>
                  {editText ? (
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="font-mono text-xs leading-relaxed resize-none bg-secondary/30 border-border"
                      style={{ minHeight: "520px" }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center bg-secondary/30 rounded-lg border border-dashed border-border gap-3 p-8" style={{ minHeight: "520px" }}>
                      <FileText className="w-10 h-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center max-w-xs">
                        No text extracted from this file. Re-upload as PDF, DOCX, or TXT.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: AI edit instructions */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">AI Edit Instructions</p>
                  <div
                    className="flex-1 overflow-y-auto bg-secondary/20 rounded-xl border border-border p-3"
                    style={{ minHeight: "440px" }}
                  >
                    {editHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                        <Sparkles className="w-8 h-8 text-primary/50" />
                        <p className="text-sm text-muted-foreground text-center max-w-xs">
                          Describe what to change and AI will edit the contract text.
                        </p>
                        <div className="flex flex-col gap-2 w-full max-w-xs">
                          {[
                            "Change payment to net-30",
                            "Add a 90-day termination clause",
                            "Make the NDA mutual",
                            "Increase the royalty rate to 20%",
                          ].map((s) => (
                            <button
                              key={s}
                              onClick={() => setEditInstruction(s)}
                              className="text-xs text-left px-3 py-2 rounded-lg bg-card border border-border hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
                            >
                              "{s}"
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editHistory.map((entry, i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-end">
                              <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2 text-sm max-w-[85%]">
                                {entry.instruction}
                              </div>
                            </div>
                            <div className="flex justify-start">
                              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2 text-sm max-w-[85%]">
                                <span className="flex items-center gap-1.5 text-green-500 font-medium text-xs">
                                  <Check className="w-3 h-3" />Applied at {entry.timestamp}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {editLoading && (
                      <div className="flex justify-start mt-2">
                        <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2.5">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                      </div>
                    )}
                    {editError && (
                      <p className="text-xs text-destructive text-center py-2 mt-2">{editError}</p>
                    )}
                    <div ref={editChatEndRef} />
                  </div>

                  <form onSubmit={handleEditSubmit} className="flex gap-2">
                    <Input
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      placeholder="e.g. Change the payment terms to net-30…"
                      className="bg-input border-border"
                      disabled={editLoading || !editText}
                    />
                    <Button
                      type="submit"
                      disabled={editLoading || !editInstruction.trim() || !editText}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 shrink-0"
                    >
                      {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground">
                    {editHistory.length > 0
                      ? `${editHistory.length} edit${editHistory.length !== 1 ? "s" : ""} applied · ${editSnapshots.length} undo step${editSnapshots.length !== 1 ? "s" : ""} available`
                      : "Edits apply directly to the contract text on the left"}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ANALYSIS TAB */}
          <TabsContent value="analysis">
            {!hasSubscription ? (
              <SubscriptionPaywall feature="Contract Analysis" />
            ) : analysisResult ? (
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Overview</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{analysisResult.contract_type}</Badge>
                        <Button onClick={handleAnalyze} disabled={analyzing} size="sm" variant="outline">
                          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                          Re-analyze
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{analysisResult.summary}</p>
                    <div className="flex flex-wrap gap-6 text-sm">
                      {analysisResult.parties?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5" />Parties</p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysisResult.parties.map((p: any, i: number) => (
                              <Badge key={i} variant="outline">{p.name} · {p.role}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysisResult.duration && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Duration</p>
                          <p className="text-sm">{analysisResult.duration}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {analysisResult.compensation?.description && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-1.5"><DollarSign className="w-4 h-4" />Compensation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{analysisResult.compensation.description}</p>
                      {analysisResult.compensation.details?.map((d: string, i: number) => (
                        <p key={i} className="text-sm flex items-start gap-2"><span className="text-primary shrink-0">•</span>{d}</p>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysisResult.key_terms?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Key Terms</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.key_terms.map((t: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analysisResult.obligations?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Obligations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysisResult.obligations.map((ob: any, i: number) => (
                        <div key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                          <span><strong>{ob.party}:</strong> {ob.obligation}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {analysisResult.risks?.length > 0 && (
                  <Card className="border-amber-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" />Risks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analysisResult.risks.map((r: string, i: number) => (
                        <div key={i} className="text-sm flex items-start gap-2">
                          <Shield className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          {r}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Brain className="w-12 h-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-semibold mb-1">No Analysis Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">AI will extract parties, terms, obligations, and risks.</p>
                </div>
                <Button onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                  {analyzing ? "Analyzing…" : "Analyze Contract"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* CHAT TAB */}
          <TabsContent value="chat">
            {!hasSubscription ? (
              <SubscriptionPaywall feature="Contract Chat" />
            ) : (
              <div className="flex flex-col gap-3" style={{ minHeight: "520px" }}>
                <div className="flex-1 overflow-y-auto bg-secondary/20 rounded-xl border border-border p-4" style={{ minHeight: "420px" }}>
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                      <MessageSquare className="w-10 h-10 text-primary/40" />
                      <p className="text-sm text-muted-foreground">Ask anything about this contract</p>
                      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                        {["What are the key obligations?", "Explain the termination clause", "What are the payment terms?", "Any red flags?"].map((q) => (
                          <button
                            key={q}
                            onClick={() => setChatInput(q)}
                            className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-card border border-border text-foreground rounded-bl-sm"
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question about this contract…"
                    disabled={chatLoading}
                    className="bg-input border-border"
                  />
                  <Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()} className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
