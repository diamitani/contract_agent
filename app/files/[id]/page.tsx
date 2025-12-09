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

  const supabase = createBrowserClient()

  useEffect(() => {
    fetchFile()
    fetchFolders()
  }, [fileId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const fetchFile = async () => {
    try {
      const { data, error } = await supabase.from("uploaded_files").select("*").eq("id", fileId).single()

      if (error) throw error
      setFile(data)
      setNewName(data.file_name)
    } catch (error) {
      console.error("Error fetching file:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFolders = async () => {
    try {
      const { data } = await supabase.from("folders").select("*").order("name")
      setFolders(data || [])
    } catch (error) {
      console.error("Error fetching folders:", error)
    }
  }

  const handleRename = async () => {
    if (!file || !newName.trim()) return

    try {
      await supabase.from("uploaded_files").update({ file_name: newName.trim() }).eq("id", file.id)

      setFile({ ...file, file_name: newName.trim() })
      setIsEditing(false)
    } catch (error) {
      console.error("Error renaming file:", error)
    }
  }

  const handleFolderChange = async (folderId: string) => {
    if (!file) return

    try {
      await supabase
        .from("uploaded_files")
        .update({ folder_id: folderId === "none" ? null : folderId })
        .eq("id", file.id)

      setFile({ ...file, folder_id: folderId === "none" ? null : folderId })
    } catch (error) {
      console.error("Error updating folder:", error)
    }
  }

  const handleDelete = async () => {
    if (!file) return

    try {
      await supabase.from("uploaded_files").delete().eq("id", file.id)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

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
                extracted_text: result.extractedText,
              }
            : null,
        )
      } else {
        const error = await response.json()
        alert("Analysis failed: " + (error.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Analysis error:", error)
      alert("Analysis failed. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !file) return

    const userMessage = chatInput
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
          context: file.extracted_text || "",
          history: chatMessages,
          analysis: file.analysis_result,
        }),
      })

      if (response.ok) {
        const contentType = response.headers.get("content-type") || ""

        if (contentType.includes("application/json")) {
          const error = await response.json()
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Error: ${error.error || "Failed to get response"}` },
          ])
        } else {
          // Plain text response
          const text = await response.text()
          setChatMessages((prev) => [...prev, { role: "assistant", content: text }])
        }
      } else {
        const errorText = await response.text()
        let errorMessage = "Failed to get response"
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errorMessage}` }])
      }
    } catch (error) {
      console.error("Chat error:", error)
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Failed to get response. Please try again." },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setChatInput(question)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatExtractedText = (text: string) => {
    if (!text) return null

    // Check if the text is mostly gibberish
    const readableChars = text.match(/[a-zA-Z]/g)?.length || 0
    const totalChars = text.length
    if (readableChars / totalChars < 0.3) {
      return (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Unable to extract readable text from this document.</p>
          <p className="text-sm text-muted-foreground mt-2">
            The document may be scanned or in a format that requires OCR processing.
          </p>
        </div>
      )
    }

    // Split into paragraphs and format
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim())

    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim()

      // Check if it looks like a heading
      const isHeading =
        trimmed.length < 100 &&
        (/^[0-9]+\.?\s/.test(trimmed) ||
          /^[A-Z][A-Z\s]+$/.test(trimmed) ||
          /^(ARTICLE|SECTION|WHEREAS|NOW THEREFORE|RECITALS|AGREEMENT|CONTRACT)/i.test(trimmed))

      if (isHeading) {
        return (
          <h3 key={index} className="font-semibold text-foreground mt-6 mb-2 text-base">
            {trimmed}
          </h3>
        )
      }

      return (
        <p key={index} className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {trimmed}
        </p>
      )
    })
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
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">File not found</h2>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  const analysis = file.analysis_result

  const suggestedQuestions = [
    "What are the main obligations for each party?",
    "Are there any red flags I should be concerned about?",
    "What happens if I want to terminate this contract?",
    "Explain the compensation structure in simple terms",
    "What rights am I giving up by signing this?",
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-8 w-full max-w-xs"
                        autoFocus
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
                      className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors truncate max-w-md"
                      onClick={() => setIsEditing(true)}
                      title={file.file_name}
                    >
                      {file.file_name}
                    </h1>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatBytes(file.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Select value={file.folder_id || "none"} onValueChange={handleFolderChange}>
                <SelectTrigger className="w-40">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${folder.color}`} />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" asChild>
                <a href={file.storage_path} download={file.file_name}>
                  <Download className="w-4 h-4" />
                </a>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="text-destructive bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete file?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the file.
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
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Preview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Document Preview</CardTitle>
                <Button onClick={handleAnalyze} disabled={analyzing} size="sm">
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {file.extracted_text ? "Re-analyze" : "Analyze Document"}
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {file.extracted_text ? (
                  <ScrollArea className="h-[500px] border rounded-lg p-6 bg-muted/30">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {formatExtractedText(file.extracted_text)}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[300px] border rounded-lg flex items-center justify-center bg-muted/30">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground mb-2">Document not yet analyzed</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click "Analyze Document" to extract text and get AI insights
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Overview Card */}
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Contract Overview
                  </CardTitle>
                  <CardDescription>
                    {analysis.contract_type || "Contract"} • {analysis.parties?.length || 0} parties involved
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Parties */}
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium">Parties Involved</span>
                      </div>
                      <div className="space-y-2">
                        {analysis.parties?.length > 0 ? (
                          analysis.parties.map((party: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{party.role}</span>
                              <span className="font-medium truncate ml-2">{party.name}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No parties identified</p>
                        )}
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium">Duration</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{analysis.duration || "Not specified"}</p>
                    </div>

                    {/* Compensation */}
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-medium">Compensation</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analysis.compensation?.description || "Not specified"}
                      </p>
                      {analysis.compensation?.details?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {analysis.compensation.details.slice(0, 3).map((detail: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground">
                              • {detail}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Important Dates */}
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium">Important Dates</span>
                      </div>
                      <div className="space-y-1">
                        {analysis.dates?.slice(0, 3).map((date: string, i: number) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            {date}
                          </p>
                        ))}
                        {(!analysis.dates || analysis.dates.length === 0) && (
                          <p className="text-sm text-muted-foreground">No specific dates mentioned</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis & Chat Sidebar */}
          <div className="space-y-6">
            {/* AI Analysis */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    AI Analysis
                  </CardTitle>
                  {file.analysis_status === "completed" && (
                    <Badge className="bg-green-500/10 text-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {analysis ? (
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="terms">Terms</TabsTrigger>
                      <TabsTrigger value="risks">Risks</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Overview</h4>
                          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                        </div>
                        {analysis.rights_granted?.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Rights Granted</h4>
                            <ul className="space-y-1">
                              {analysis.rights_granted.slice(0, 5).map((right: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                                  {right}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="terms" className="mt-4">
                      <div className="space-y-2">
                        {analysis.key_terms?.length > 0 ? (
                          analysis.key_terms.map((term: string, i: number) => (
                            <div key={i} className="p-2 rounded bg-muted/50">
                              <p className="text-sm">{term}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No key terms identified</p>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="risks" className="mt-4">
                      <div className="space-y-2">
                        {analysis.risks?.length > 0 ? (
                          analysis.risks.map((risk: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded bg-destructive/10">
                              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                              <p className="text-sm">{risk}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No significant risks identified</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      AI analysis will appear here after you analyze the document
                    </p>
                    <Button onClick={handleAnalyze} disabled={analyzing} size="sm">
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Start Analysis
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Ask Questions
                </CardTitle>
                <CardDescription>Chat with AI about this contract</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Suggested Questions */}
                  {chatMessages.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Suggested questions:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.slice(0, 3).map((q, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs h-auto py-1.5 px-2 bg-transparent"
                            onClick={() => handleSuggestedQuestion(q)}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Messages */}
                  <ScrollArea className="h-[300px] border rounded-lg p-3">
                    <div className="space-y-3">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Ask a question about this contract
                        </div>
                      ) : (
                        chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg ${msg.role === "user" ? "bg-primary/10 ml-4" : "bg-muted mr-4"}`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))
                      )}
                      {chatLoading && (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mr-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Chat Input */}
                  <form onSubmit={handleChatSubmit} className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about this contract..."
                      disabled={chatLoading || !file.extracted_text}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={chatLoading || !chatInput.trim() || !file.extracted_text}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  {!file.extracted_text && (
                    <p className="text-xs text-muted-foreground text-center">
                      Analyze the document first to enable chat
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
