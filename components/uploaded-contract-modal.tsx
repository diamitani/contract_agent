"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, AlertTriangle, CheckCircle, Info, ExternalLink } from "lucide-react"
import type { UploadedContract } from "@/lib/contract-store"

interface UploadedContractModalProps {
  contract: UploadedContract | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadedContractModal({ contract, open, onOpenChange }: UploadedContractModalProps) {
  if (!contract) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-foreground">{contract.fileName}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Uploaded {new Date(contract.uploadedAt).toLocaleDateString()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Summary */}
            {contract.analysis && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    AI Analysis Summary
                  </h3>
                  <p className="text-muted-foreground bg-secondary/50 p-4 rounded-lg">{contract.analysis.summary}</p>
                </div>

                <Separator className="bg-border" />

                {/* Sections */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Contract Sections
                  </h3>
                  <div className="grid gap-3">
                    {contract.analysis.sections.map((section, index) => (
                      <div key={index} className="bg-secondary/30 p-4 rounded-lg border border-border">
                        <h4 className="font-medium text-foreground mb-1">{section.title}</h4>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Risks */}
                {contract.analysis.risks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Potential Risks
                    </h3>
                    <div className="space-y-2">
                      {contract.analysis.risks.map((risk, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-foreground">{risk}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {contract.analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Recommendations
                    </h3>
                    <div className="space-y-2">
                      {contract.analysis.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 bg-green-500/5 border border-green-500/20 p-3 rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-foreground">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1 border-border hover:bg-secondary bg-transparent" asChild>
            <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open File
            </a>
          </Button>
          <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <a href={contract.fileUrl} download={contract.fileName}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
