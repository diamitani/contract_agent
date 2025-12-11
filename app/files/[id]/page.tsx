"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  const [checkingSubscription, setCheckingSubscription] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/sign-in")
        return
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("subscription_status")
        .eq("user_id", user.id)
        .maybeSingle()

      setHasSubscription(profile?.subscription_status === "active")
      setCheckingSubscription(false)

      const { data: fileData, error: fileError } = await supabase
        .from("uploaded_files")
        .select("*")
        .eq("id", fileId)
        .eq("user_id", user.id)
        .single()

      if (fileError || !fileData) {
        router.push("/dashboard")
        return
      }

      setFile(fileData)
      setNewName(fileData.file_name)

      const { data: foldersData } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

      setFolders(foldersData || [])
      setLoading(false)
    }

    fetchData()
  }, [fileId, router])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const handleRename = async () => {
    if (!file || !newName.trim()) return
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from("uploaded_files")
      .update({ file_name: newName.trim() })
      .eq("id", file.id)
      .eq("user_id", user.id)

    if (!error) {
      setFile((prev) => (prev ? { ...prev, file_name: newName.trim() } : null))
      setIsEditing(false)
    }
  }

  const handleFolderChange = async (folderId: string) => {
    if (!file) return
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const newFolderId = folderId === "none" ? null : folderId
    const { error } = await supabase
      .from("uploaded_files")
      .update({ folder_id: newFolderId })
      .eq("id", file.id)
      .eq("user_id", user.id)

    if (!error) {
      setFile((prev) => (prev ? { ...prev, folder_id: newFolderId } : null))
    }
  }

  const handleDelete = async () => {
    if (!file) return
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("uploaded_files").delete().eq("id", file.id).eq("user_id", user.id)
    if (!error) router.push("/dashboard")
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
          prev
            ? {
                ...prev,
                analysis_status: "completed",
                analysis_result: result.analysis,
              }
            : null,
        )
      } else {
        const error = await response.json()
        if (error.requiresSubscription) setHasSubscription(false)
        alert("Analysis failed: " + (error.error || "Unknown error"))
      }
    } catch (error) {
      alert("Analysis failed. Please try again.")
    } finally {
      setAnalyzing(false)
    }
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
    } catch (error) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, an error occurred." }])
    } finally {
      setChatLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const SubscriptionPaywall = ({ feature }: { feature: string }) => (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Crown className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Unlock {feature}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Get AI-powered contract analysis, document chat, and unlimited contract generation with the Unlimited
              plan.
            </p>
          </div>
          <Button asChild>
            <Link href="/pricing">
              <Lock className="w-4 h-4 mr-2" />
              Upgrade Now
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const getGoogleViewerUrl = (url: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
  }

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
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg p-1">
          <Button variant="ghost" size="icon" onClick={() => setPdfScale(Math.max(50, pdfScale - 10))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs w-12 text-center">{pdfScale}%</span>
          <Button variant="ghost" size="icon" onClick={() => setPdfScale(Math.min(200, pdfScale + 10))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(true)}>
            <Expand className="w-4 h-4" />
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
            <p className="text-muted-foreground">Unable to preview document</p>
            <Button asChild variant="outline">
              <a href={file.storage_path} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download to View
              </a>
            </Button>
          </div>
        ) : (
          <iframe
            src={
              isPdf
                ? getGoogleViewerUrl(file.storage_path)
                : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.storage_path)}`
            }
            className="w-full h-full border-0"
            style={{ transform: `scale(${pdfScale / 100})`, transformOrigin: "top left" }}
            onLoad={() => setPdfLoading(false)}
            onError={() => {
              setPdfLoading(false)
              setPdfError(true)
            }}
            title={file.file_name}
          />
        )}
      </div>
    )
  }

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
        <p>File not found</p>
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
              src={
                file.file_name.toLowerCase().endsWith(".pdf")
                  ? getGoogleViewerUrl(file.storage_path)
                  : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.storage_path)}`
              }
              className="w-full h-full border-0"
              title={file.file_name}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="max-w-md"
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                />
                <Button size="sm" onClick={handleRename}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <h1
                className="text-2xl font-bold truncate cursor-pointer hover:text-primary"
                onClick={() => setIsEditing(true)}
                title="Click to rename"
              >
                {file.file_name}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={file.storage_path} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete File</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{file.file_name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* File Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{formatFileSize(file.file_size)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{new Date(file.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <Select value={file.folder_id || "none"} onValueChange={handleFolderChange}>
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="No folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Document Viewer */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Document Viewer</CardTitle>
                  {hasSubscription ? (
                    <Button onClick={handleAnalyze} disabled={analyzing} size="sm">
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          {file.analysis_result ? "Re-analyze" : "Analyze Contract"}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/pricing">
                        <Lock className="w-4 h-4 mr-2" />
                        Unlock Analysis
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>{renderPdfViewer()}</CardContent>
            </Card>
          </div>

          {/* Analysis & Chat */}
          <div>
            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analysis">
                  <Brain className="w-4 h-4 mr-2" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="chat">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ask Questions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="mt-4">
                {!hasSubscription ? (
                  <SubscriptionPaywall feature="Contract Analysis" />
                ) : analysisResult ? (
                  <div className="space-y-4">
                    {/* Contract Overview */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Contract Overview</CardTitle>
                          <Badge variant="secondary">{analysisResult.contract_type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{analysisResult.summary}</p>

                        {analysisResult.parties?.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <Users className="w-4 h-4" /> Parties Involved
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.parties.map((party: any, i: number) => (
                                <Badge key={i} variant="outline">
                                  {party.name} ({party.role})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResult.duration && (
                          <div className="mt-4 pt-4 border-t flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              <strong>Duration:</strong> {analysisResult.duration}
                            </span>
                          </div>
                        )}

                        {analysisResult.compensation?.description && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <DollarSign className="w-4 h-4" /> Compensation
                            </h4>
                            <p className="text-sm text-muted-foreground">{analysisResult.compensation.description}</p>
                            {analysisResult.compensation.details?.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {analysisResult.compensation.details.map((detail: string, i: number) => (
                                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary">•</span> {detail}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Key Terms */}
                    {analysisResult.key_terms?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Key Terms</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.key_terms.map((term: string, i: number) => (
                              <Badge key={i} variant="secondary">
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Obligations */}
                    {analysisResult.obligations?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Obligations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysisResult.obligations.map((ob: any, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                <span>
                                  <strong>{ob.party}:</strong> {ob.obligation}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Risks */}
                    {analysisResult.risks?.length > 0 && (
                      <Card className="border-amber-500/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Potential Risks
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysisResult.risks.map((risk: string, i: number) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">No Analysis Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Click "Analyze Contract" to get AI-powered insights including parties, terms, obligations, and
                          potential risks.
                        </p>
                        <Button onClick={handleAnalyze} disabled={analyzing}>
                          {analyzing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4 mr-2" />
                          )}
                          {analyzing ? "Analyzing..." : "Analyze Contract"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="chat" className="mt-4">
                {!hasSubscription ? (
                  <SubscriptionPaywall feature="Contract Chat" />
                ) : (
                  <Card className="h-[600px] flex flex-col">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Ask Questions About This Contract</CardTitle>
                      <CardDescription>Get instant answers about terms, obligations, or any clause</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0">
                      <ScrollArea className="flex-1 pr-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">Ask anything about this contract</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {[
                                "What are the key obligations?",
                                "Explain the termination clause",
                                "What are the payment terms?",
                              ].map((q) => (
                                <Button key={q} variant="outline" size="sm" onClick={() => setChatInput(q)}>
                                  {q}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {chatMessages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div
                                  className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              </div>
                            ))}
                            {chatLoading && (
                              <div className="flex justify-start">
                                <div className="bg-muted rounded-lg px-4 py-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>
                        )}
                      </ScrollArea>
                      <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask a question..."
                          disabled={chatLoading}
                        />
                        <Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
