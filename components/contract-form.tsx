"use client"

import type React from "react"
import { Eye } from "lucide-react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      content: `Hi! I'm your AI contract assistant. I'm here to help you fill out the ${contract.name}. I can answer questions, provide examples, and guide you through each field. What would you like to know, or shall we get started with the first field: ${contract.fields[0].label}?`,
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
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
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
      // Call AI chat assistant API
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
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        // Auto-extract field values if the message looks like field data
        const currentField = contract.fields[currentChatField]
        if (currentField && userMessage.toLowerCase() !== "skip") {
          // Simple heuristic: if message is not a question, treat as field value
          if (!userMessage.includes("?") && !userMessage.startsWith("what") && !userMessage.startsWith("how")) {
            setFormData((prev) => ({ ...prev, [currentField.id]: userMessage }))
          }
        }

        setChatMessages((prev) => [...prev, { role: "assistant", content: data.response }])

        // Check if we should move to next field
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
      // Fallback to simple mode
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
            content: `Got it! Now, what is the ${nextField.label.toLowerCase()}?${nextField.description ? ` (${nextField.description})` : ""}`,
          },
        ])
        setCurrentChatField((prev) => prev + 1)
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Perfect! I have all the information needed. Click the 'Generate Contract' button below to create your personalized contract.",
          },
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
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className="text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            {field.label}
            <span className="text-muted-foreground text-xs">Optional</span>
          </span>
          <FieldExplanationTooltip
            fieldLabel={field.label}
            fieldDescription={field.description}
            contractType={contract.name}
            fieldName={field.name}
          />
        </Label>
        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        {field.type === "textarea" ? (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        ) : field.type === "date" ? (
          <Input
            id={field.id}
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="bg-input border-border text-foreground"
          />
        ) : field.type === "number" ? (
          <Input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        ) : field.type === "currency" ? (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
        ) : (
          <Input
            id={field.id}
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        )}
      </div>
    )
  }

  const renderGenerateButton = (isFullWidth = false) => {
    const buttonGroup = (
      <div className={`flex gap-2 ${isFullWidth ? "w-full" : ""}`}>
        <Button
          type="button"
          variant="outline"
          onClick={handlePreview}
          size="lg"
          className="border-border hover:bg-secondary bg-transparent min-h-[48px] px-6"
        >
          <Eye className="w-5 h-5 mr-2" />
          Preview
        </Button>

        {showPaymentPrompt ? (
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className={`bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-white font-semibold text-base min-h-[48px] flex-1`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Generate Contract - $19.99
              </>
            )}
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className={`bg-primary text-primary-foreground hover:bg-primary/90 min-h-[48px] flex-1`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Generate Contract
              </>
            )}
          </Button>
        )}
      </div>
    )

    return buttonGroup
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === "form" ? "default" : "outline"}
          onClick={() => setMode("form")}
          className={mode === "form" ? "bg-primary text-primary-foreground" : "border-border"}
        >
          <FileText className="w-4 h-4 mr-2" />
          Form Mode
        </Button>
        <Button
          variant={mode === "chat" ? "default" : "outline"}
          onClick={() => setMode("chat")}
          className={mode === "chat" ? "bg-primary text-primary-foreground" : "border-border"}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat Mode
        </Button>
      </div>

      {mode === "form" ? (
        <form onSubmit={handleFormSubmit}>
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </CardTitle>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2 bg-secondary" />
              <CardDescription className="text-muted-foreground mt-4">
                Fill in the information for your contract. All fields are optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentFields.map(renderField)}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="border-border hover:bg-secondary bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep === totalSteps - 1 ? (
                  renderGenerateButton()
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

              {currentStep === totalSteps - 1 && showPaymentPrompt && (
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>
                        Single: <strong className="text-foreground">$19.99</strong>
                      </span>
                    </div>
                    <span className="text-border">|</span>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>
                        Unlimited: <strong className="text-amber-500">$9.99/mo</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      ) : (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Conversational Form
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Answer questions one at a time to fill out your contract. Type "skip" to leave any field blank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-y-auto mb-4 space-y-4 p-4 bg-secondary/30 rounded-lg">
              {chatMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your answer or 'skip' to leave blank..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                disabled={currentChatField >= contract.fields.length}
              />
              <Button
                type="submit"
                disabled={currentChatField >= contract.fields.length || !chatInput.trim() || isChatLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isChatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>

            {currentChatField >= contract.fields.length && (
              <div className="mt-4">
                {renderGenerateButton(true)}

                {showPaymentPrompt && (
                  <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mt-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>
                        Single: <strong className="text-foreground">$19.99</strong>
                      </span>
                    </div>
                    <span className="text-border">|</span>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>
                        Unlimited: <strong className="text-amber-500">$9.99/mo</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-center">
              <Progress value={(currentChatField / contract.fields.length) * 100} className="h-2 bg-secondary" />
              <p className="text-xs text-muted-foreground mt-2">
                {currentChatField} of {contract.fields.length} fields completed
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
