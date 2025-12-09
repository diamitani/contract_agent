"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  AlertTriangle,
  Calendar,
  Shield,
  Sparkles,
  FolderOpen,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { UploadedFile, Folder } from "@/lib/contract-store"
import { updateUploadedFile, deleteUploadedFile, getFolders } from "@/lib/contract-store"

export default function FileViewerPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  // AI Analysis state
  const [analyzing, setAnalyzing] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    async function fetchFile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/sign-in")
        return
      }

      const { data, error } = await supabase
        .from("uploaded_files")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (error || !data) {
        router.push("/dashboard")
        return
      }

      setFile(data)
      setEditName(data.file_name)
      setSelectedFolder(data.folder_id || null)

      const folderList = await getFolders()
      setFolders(folderList)

      setLoading(false)
    }

    fetchFile()
  }, [id, router])

  const handleSaveName = async () => {
    if (!file || !editName.trim()) return

    const updated = await updateUploadedFile(file.id, { file_name: editName })
    if (updated) {
      setFile(updated)
      setIsEditing(false)
    }
  }

  const handleMoveToFolder = async (folderId: string | null) => {
    if (!file) return

    const updated = await updateUploadedFile(file.id, { folder_id: folderId })
    if (updated) {
      setFile(updated)
      setSelectedFolder(folderId)
    }
  }

  const handleDelete = async () => {
    if (!file) return

    if (confirm("Are you sure you want to delete this file?")) {
      const success = await deleteUploadedFile(file.id)
      if (success) {
        router.push("/dashboard")
      }
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
      }
    } catch (error) {
      console.error("Analysis error:", error)
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
        }),
      })

      if (response.ok) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ""

        setChatMessages((prev) => [...prev, { role: "assistant", content: "" }])

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantMessage += chunk

          setChatMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = { role: "assistant", content: assistantMessage }
            return newMessages
          })
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!file) return null

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={file.storage_path} download={file.file_name} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Info & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-lg font-semibold"
                          />
                          <Button size="icon" variant="ghost" onClick={handleSaveName}>
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{file.file_name}</CardTitle>
                          <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={file.analysis_status === "completed" ? "default" : "secondary"}>
                    {file.analysis_status === "completed" ? "Analyzed" : "Not Analyzed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Folder Selection */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Move to Folder</label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={selectedFolder === null ? "default" : "outline"}
                      onClick={() => handleMoveToFolder(null)}
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      No Folder
                    </Button>
                    {folders.map((folder) => (
                      <Button
                        key={folder.id}
                        size="sm"
                        variant={selectedFolder === folder.id ? "default" : "outline"}
                        onClick={() => handleMoveToFolder(folder.id)}
                        style={{ borderColor: folder.color }}
                      >
                        <FolderOpen className="w-4 h-4 mr-1" style={{ color: folder.color }} />
                        {folder.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDF Preview / Text Content */}
            <Card>
              <CardHeader>
                <CardTitle>Document Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {file.file_type.includes("pdf") ? (
                  <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                    <iframe
                      src={`${file.storage_path}#toolbar=1&navpanes=0`}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  </div>
                ) : file.extracted_text ? (
                  <ScrollArea className="h-[600px] border rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm">{file.extracted_text}</pre>
                  </ScrollArea>
                ) : (
                  <div className="h-[300px] border rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Preview not available</p>
                      <p className="text-sm text-muted-foreground">Run analysis to extract text content</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis & Chat Sidebar */}
          <div className="space-y-6">
            {/* AI Analysis */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Analysis
                  </CardTitle>
                  {!file.analysis_result && (
                    <Button size="sm" onClick={handleAnalyze} disabled={analyzing}>
                      {analyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {analyzing ? "Analyzing..." : "Analyze"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {file.analysis_result ? (
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="summary" className="flex-1">
                        Summary
                      </TabsTrigger>
                      <TabsTrigger value="risks" className="flex-1">
                        Risks
                      </TabsTrigger>
                      <TabsTrigger value="terms" className="flex-1">
                        Terms
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="mt-4">
                      <p className="text-sm text-muted-foreground">{file.analysis_result.summary}</p>

                      {file.analysis_result.dates && file.analysis_result.dates.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4" /> Key Dates
                          </h4>
                          <div className="space-y-1">
                            {file.analysis_result.dates.map((date, i) => (
                              <Badge key={i} variant="outline" className="mr-1">
                                {date}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="risks" className="mt-4">
                      {file.analysis_result.risks && file.analysis_result.risks.length > 0 ? (
                        <ul className="space-y-2">
                          {file.analysis_result.risks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No significant risks identified.</p>
                      )}
                    </TabsContent>

                    <TabsContent value="terms" className="mt-4">
                      {file.analysis_result.key_terms && file.analysis_result.key_terms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {file.analysis_result.key_terms.map((term, i) => (
                            <Badge key={i} variant="secondary">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No key terms extracted.</p>
                      )}

                      {file.analysis_result.obligations && file.analysis_result.obligations.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4" /> Obligations
                          </h4>
                          <ul className="space-y-1">
                            {file.analysis_result.obligations.map((obl, i) => (
                              <li key={i} className="text-sm text-muted-foreground">
                                • {obl}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click "Analyze" to get AI-powered insights about this contract
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat About Contract */}
            <Card className="flex flex-col h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Ask Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 pr-4 mb-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Ask questions about this contract</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about this contract..."
                    className="min-h-[40px] max-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleChatSubmit(e)
                      }
                    }}
                  />
                  <Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()}>
                    {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
