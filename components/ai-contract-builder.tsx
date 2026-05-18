"use client"

import { useState, useRef, useEffect } from "react"
import { contractTemplates, type ContractTemplate, type ContractField } from "@/lib/contracts"
import { saveContract } from "@/lib/contract-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { APP_ID } from "@/lib/constants"
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  Loader2,
  Brain,
  Zap,
  AlertCircle,
  ChevronRight,
  Eye,
  Send,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

type AIModel = "deepseek" | "openrouter" | "auto"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  model?: string
}

interface AiContractBuilderProps {
  onContractSaved?: () => void
}

export function AiContractBuilder({ onContractSaved }: AiContractBuilderProps) {
  const [selectedContract, setSelectedContract] = useState<ContractTemplate | null>(null)
  const [model, setModel] = useState<AIModel>("auto")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [streamingContent, setStreamingContent] = useState("")
  const [status, setStatus] = useState<"idle" | "streaming" | "complete" | "error">("idle")
  const [messages, setMessages] = useState<Message[]>([])
  const [activeTab, setActiveTab] = useState<"form" | "output">("form")
  const [copied, setCopied] = useState(false)
  const [usedModel, setUsedModel] = useState<string>("")
  const { toast } = useToast()
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current && status === "streaming") {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [streamingContent, status])

  const handleContractChange = (slug: string) => {
    const contract = contractTemplates.find((t) => t.slug === slug) || null
    setSelectedContract(contract)
    setFormData({})
    setGeneratedContent("")
    setStreamingContent("")
    setStatus("idle")
    setActiveTab("form")
    setMessages([])
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const resolveModel = (): AIModel => {
    if (model !== "auto") return model
    return "openrouter"
  }

  const generateContract = async () => {
    if (!selectedContract) return

    setIsGenerating(true)
    setStreamingContent("")
    setGeneratedContent("")
    setStatus("streaming")
    setActiveTab("output")

    const chosenModel = resolveModel()
    setUsedModel(chosenModel)

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: `Generate a ${selectedContract.name}`,
      },
    ])

    try {
      const response = await fetch("/api/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_type: selectedContract.slug,
          contract_name: selectedContract.name,
          fields: formData,
          timestamp: new Date().toISOString(),
          model: chosenModel,
        }),
      })

      if (!response.ok) throw new Error("Generation failed")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No response body")

      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (!data) continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === "delta" && parsed.content) {
                fullContent += parsed.content
                setStreamingContent(fullContent)
              } else if (parsed.type === "complete") {
                if (parsed.content && !fullContent) {
                  fullContent = parsed.content
                  setStreamingContent(fullContent)
                }
                setGeneratedContent(fullContent)
                setStatus("complete")

                const saved = await saveContract({
                  title: selectedContract.name,
                  contract_type: selectedContract.slug,
                  content: fullContent,
                  form_data: formData,
                  status: "completed",
                  app_id: APP_ID,
                })

                if (saved) {
                  toast({ title: "Contract saved to dashboard" })
                  onContractSaved?.()
                }

                setMessages((prev) => [
                  ...prev,
                  {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: fullContent,
                    model: parsed.model || chosenModel,
                  },
                ])
              } else if (parsed.type === "error") {
                throw new Error(parsed.message)
              }
            } catch {
              // skip non-json
            }
          }
        }
      }

      if (!generatedContent && streamingContent) {
        setGeneratedContent(streamingContent)
        setStatus("complete")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed"
      setStatus("error")
      toast({ title: "Generation failed", description: msg, variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    const text = generatedContent || streamingContent
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: "Copied to clipboard" })
  }

  const handleDownload = () => {
    const text = generatedContent || streamingContent
    if (!text) return
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement("a")
    a.href = url
    a.download = `${selectedContract?.slug || "contract"}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const models: { value: AIModel; label: string; icon: typeof Brain; description: string }[] = [
    { value: "auto", label: "Auto (Best Available)", icon: Zap, description: "Auto-select best model" },
    { value: "deepseek", label: "DeepSeek V3", icon: Brain, description: "Cost-efficient, fast" },
    { value: "openrouter", label: "Ollama (OpenRouter)", icon: Sparkles, description: "Local models via OpenRouter" },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contract Selection + Form */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Contract Builder
                </CardTitle>
                <CardDescription>Select a template, fill details, and generate</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contract + Model Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Type</Label>
                <Select onValueChange={handleContractChange} value={selectedContract?.slug || ""}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Choose a contract type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-[300px]">
                    {contractTemplates.map((t) => (
                      <SelectItem key={t.slug} value={t.slug} className="text-foreground">
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          {t.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select value={model} onValueChange={(v) => setModel(v as AIModel)}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {models.map((m) => {
                      const Icon = m.icon
                      return (
                        <SelectItem key={m.value} value={m.value} className="text-foreground">
                          <span className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" />
                            {m.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Form Fields */}
            {selectedContract && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "form" | "output")}>
                <TabsList className="bg-secondary/50 border border-border">
                  <TabsTrigger value="form" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <FileText className="w-4 h-4 mr-2" />
                    Fill Details
                  </TabsTrigger>
                  <TabsTrigger value="output" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Eye className="w-4 h-4 mr-2" />
                    Output
                    {status !== "idle" && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {status === "streaming" ? "..." : status === "complete" ? "Done" : "Error"}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="form" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedContract.fields.map((field) => (
                      <FieldInput
                        key={field.id}
                        field={field}
                        value={formData[field.id] || ""}
                        onChange={(v) => handleFieldChange(field.id, v)}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Button
                      onClick={generateContract}
                      disabled={isGenerating}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Generate Contract
                        </>
                      )}
                    </Button>
                    {usedModel && status === "complete" && (
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        Generated with {usedModel}
                      </Badge>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="output" className="mt-4">
                  {status === "idle" && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Fill in the contract details and click Generate</p>
                    </div>
                  )}

                  {status === "streaming" && (
                    <Card className="bg-card/50 border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-primary mb-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Generating contract...</span>
                          <Badge variant="outline" className="ml-auto text-xs border-primary/30 text-primary">
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            {usedModel || model}
                          </Badge>
                        </div>
                        <ScrollArea ref={outputRef} className="h-[500px] rounded-md bg-background/50 p-4">
                          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{streamingContent}</pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {status === "complete" && (
                    <Card className="bg-card/50 border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-foreground">Contract generated</span>
                            <Badge variant="secondary" className="text-xs">
                              {(generatedContent || streamingContent).length.toLocaleString()} chars
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleCopy} className="h-8">
                              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                              {copied ? "Copied" : "Copy"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownload} className="h-8">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <ScrollArea className="h-[500px] rounded-md bg-background/50 p-4">
                          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                            {generatedContent || streamingContent}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {status === "error" && (
                    <Card className="bg-destructive/5 border-destructive/30">
                      <CardContent className="p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <p className="text-foreground font-medium mb-2">Generation failed</p>
                        <p className="text-sm text-muted-foreground mb-4">Try selecting a different model or check your API keys</p>
                        <Button variant="outline" onClick={() => { setStatus("idle"); setActiveTab("form") }}>
                          Try Again
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {!selectedContract && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Select a contract type to get started</p>
                <p className="text-sm">Choose from {contractTemplates.length}+ industry templates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        {/* Model Info */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Models Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {models.slice(1).map((m) => {
              const Icon = m.icon
              const isActive = model === m.value || (model === "auto" && usedModel === m.value)
              return (
                <div
                  key={m.value}
                  className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                    isActive ? "bg-primary/10" : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-between border-border hover:bg-secondary bg-transparent">
              <Link href="/dashboard">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  My Contracts
                </span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between border-border hover:bg-secondary bg-transparent">
              <Link href="/templates">
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Browse Templates
                </span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between border-border hover:bg-secondary bg-transparent">
              <Link href="/pricing">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  View Pricing
                </span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ContractField
  value: string
  onChange: (value: string) => void
}) {
  const commonProps = {
    id: field.id,
    placeholder: field.placeholder || `Enter ${field.label.toLowerCase()}`,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    className: "bg-input border-border text-foreground placeholder:text-muted-foreground",
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="text-foreground">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea {...commonProps} rows={3} />
      ) : field.type === "select" && field.options ? (
        <select {...commonProps} className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="" className="text-muted-foreground">Select {field.label.toLowerCase()}...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt} className="text-foreground">{opt}</option>
          ))}
        </select>
      ) : (
        <Input type={field.type === "number" ? "number" : field.type === "currency" ? "text" : field.type} {...commonProps} />
      )}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  )
}
