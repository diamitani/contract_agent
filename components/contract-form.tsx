"use client"

import type React from "react"
import { Eye } from "lucide-react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Send, Loader2, MessageSquare, FileText, CreditCard, Zap, Crown } from "lucide-react"
import type { ContractTemplate, ContractField } from "@/lib/contracts"
import { FieldExplanationTooltip } from "@/components/field-explanation-tooltip"

interface ContractFormProps {
  contract: ContractTemplate
  onSubmit: (data: Record<string, string>) => Promise<void>
  isSubmitting: boolean
  showPaymentPrompt?: boolean
  onPreviewClick?: () => void
}

export function ContractForm({
  contract,
  onSubmit,
  isSubmitting,
  showPaymentPrompt = false,
  onPreviewClick,
}: ContractFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [mode, setMode] = useState<"form" | "chat">("form")
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: `Hi! I'm your contract assistant for the ${contract.name}. Ask me anything or just tell me the ${contract.fields[0].label} to get started.`,
    },
  ])
  const [chatInput, setChatInput] = useState("")
  const [currentChatField, setCurrentChatField] = useState(0)
  const [isChatLoading, setIsChatLoading] = useState(false)

  const fieldsPerStep = 4
  const totalSteps = Math.ceil(contract.fields.length / fieldsPerStep)
  const currentFields = contract.fields.slice(currentStep * fieldsPerStep, (currentStep + 1) * fieldsPerStep)
  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep((prev) => prev + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isChatLoading) return

    const userMessage = chatInput
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsChatLoading(true)

    try {
      const response = await fetch("/api/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: chatMessages,
          contractType: contract.slug,
          contractName: contract.name,
          currentField: contract.fields[currentChatField],
          allFields: contract.fields,
          formData,
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        const currentField = contract.fields[currentChatField]
        if (currentField && userMessage.toLowerCase() !== "skip") {
          if (!userMessage.includes("?") && !userMessage.startsWith("what") && !userMessage.startsWith("how")) {
            setFormData((prev) => ({ ...prev, [currentField.id]: userMessage }))
          }
        }

        setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }])

        if (
          data.response.toLowerCase().includes("next") ||
          data.response.toLowerCase().includes("moving on") ||
          data.response.toLowerCase().includes("let's continue")
        ) {
          if (currentChatField < contract.fields.length - 1) {
            setCurrentChatField((prev) => prev + 1)
          }
        }
      } else {
        throw new Error("Failed to get AI response")
      }
    } catch (error) {
      console.error("Chat error:", error)
      const currentField = contract.fields[currentChatField]
      if (userMessage.toLowerCase() !== "skip") {
        setFormData((prev) => ({ ...prev, [currentField.id]: userMessage }))
      }

      if (currentChatField < contract.fields.length - 1) {
        const nextField = contract.fields[currentChatField + 1]
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Got it! Next: ${nextField.label.toLowerCase()}?${nextField.description ? ` (${nextField.description})` : ""}`,
          },
        ])
        setCurrentChatField((prev) => prev + 1)
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "All fields complete! Click Generate Contract below." },
        ])
      }
    } finally {
      setIsChatLoading(false)
    }
  }

  const handlePreview = () => {
    const dataString = encodeURIComponent(JSON.stringify(formData))
    window.open(`/preview/${contract.slug}?data=${dataString}`, "_blank")
  }

  const renderField = (field: ContractField) => {
    const value = formData[field.id] || ""

    return (
      <div key={field.id} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
            {field.label}
          </Label>
          <FieldExplanationTooltip
            fieldLabel={field.label}
            fieldDescription={field.description}
            contractType={contract.name}
            fieldName={field.name}
          />
        </div>
        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        {field.type === "textarea" ? (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
            rows={3}
          />
        ) : field.type === "currency" ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              id={field.id}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder || "0.00"}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground pl-7"
            />
          </div>
        ) : field.type === "percentage" ? (
          <div className="relative">
            <Input
              id={field.id}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder || "0"}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-7"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
          </div>
        ) : (
          <Input
            id={field.id}
            type={field.type === "date" ? "date" : field.type === "number" ? "number" : field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        )}
      </div>
    )
  }

  const GenerateButton = ({ fullWidth = false }: { fullWidth?: boolean }) => (
    <div className={`flex gap-2 ${fullWidth ? "w-full" : ""}`}>
      <Button
        type="button"
        variant="outline"
        onClick={handlePreview}
        className="border-border hover:bg-secondary bg-transparent px-4"
      >
        <Eye className="w-4 h-4 mr-2" />
        Preview
      </Button>

      {showPaymentPrompt ? (
        <Button
          type="submit"
          disabled={isSubmitting}
          className={`bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex-1`}
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
          ) : (
            <><CreditCard className="w-4 h-4 mr-2" />Generate — $19.99</>
          )}
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" />Generate Contract</>
          )}
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => setMode("form")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === "form"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Form
        </button>
        <button
          onClick={() => setMode("chat")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === "chat"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          AI Chat
        </button>
      </div>

      {mode === "form" ? (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-secondary" />
          </div>

          {/* Fields */}
          <div className="space-y-4 py-2">
            {currentFields.map(renderField)}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {currentStep === totalSteps - 1 ? (
              <GenerateButton />
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {/* Pricing hint */}
          {currentStep === totalSteps - 1 && showPaymentPrompt && (
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary" />
                Single <strong className="text-foreground">$19.99</strong>
              </span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                Unlimited <strong className="text-amber-500">$9.99/mo</strong>
              </span>
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-3">
          {/* Chat window */}
          <div className="h-[380px] overflow-y-auto space-y-3 p-4 bg-secondary/30 rounded-xl border border-border">
            {chatMessages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                currentChatField < contract.fields.length
                  ? `Enter ${contract.fields[currentChatField]?.label?.toLowerCase() || "your answer"}…`
                  : "All fields complete"
              }
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              disabled={currentChatField >= contract.fields.length}
            />
            <Button
              type="submit"
              disabled={currentChatField >= contract.fields.length || !chatInput.trim() || isChatLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Progress */}
          <div className="space-y-1">
            <Progress value={(currentChatField / contract.fields.length) * 100} className="h-1 bg-secondary" />
            <p className="text-xs text-muted-foreground text-center">
              {currentChatField} / {contract.fields.length} fields
            </p>
          </div>

          {/* Generate button when done */}
          {currentChatField >= contract.fields.length && (
            <form onSubmit={handleFormSubmit} className="space-y-2">
              <GenerateButton fullWidth />
              {showPaymentPrompt && (
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />
                    Single <strong className="text-foreground">$19.99</strong>
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    Unlimited <strong className="text-amber-500">$9.99/mo</strong>
                  </span>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  )
}
