'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { SaveIcon, X } from 'lucide-react'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { Badge } from '@repo/ui/badge'

export interface StepperStep {
  title: string
  description: string
  content: React.ReactNode
}

export interface StepperSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  steps: StepperStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onCancel: () => void
  onSaveDraft: () => void | Promise<void>
  onComplete: () => void | Promise<void>
  completeLabel?: string
  isSaving?: boolean
  isCompleting?: boolean
  isDirty?: boolean
  canProceed?: boolean
  breadcrumb?: string | null
  breadcrumbContent?: React.ReactNode
}

export function StepperSheet({
  open,
  onOpenChange,
  title,
  steps,
  currentStep,
  onStepChange,
  onCancel,
  onSaveDraft,
  onComplete,
  completeLabel = 'Submit',
  isSaving = false,
  isCompleting = false,
  isDirty = false,
  canProceed = true,
  breadcrumb,
  breadcrumbContent,
}: StepperSheetProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const totalSteps = steps.length
  const isLastStep = currentStep === totalSteps - 1
  const step = steps[currentStep]

  const handleClose = () => {
    if (isDirty) {
      setShowCancelDialog(true)
      return
    }
    onCancel()
  }

  const handleConfirmClose = () => {
    setShowCancelDialog(false)
    onCancel()
  }

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      onStepChange(currentStep + 1)
    }
  }

  const showBreadcrumb = breadcrumb || breadcrumbContent

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleClose()
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex flex-col"
          minWidth="40vw"
          initialWidth="60vw"
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            handleClose()
          }}
          header={
            <SheetHeader>
              <SheetTitle className="sr-only">{title}</SheetTitle>
              <div className="flex flex-col gap-4">
                {showBreadcrumb && <div className="text-sm text-muted-foreground">{breadcrumbContent ?? breadcrumb}</div>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <Badge variant="outline" className="font-mono text-xs">
                      STEP {currentStep + 1} OF {totalSteps}
                    </Badge>
                  </div>
                  <button type="button" onClick={handleClose} className="cursor-pointer mr-6">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={handleClose} disabled={isSaving || isCompleting}>
                    Cancel
                  </Button>
                  <Button variant="secondary" onClick={onSaveDraft} disabled={isSaving || isCompleting} icon={<SaveIcon size={16} />} iconPosition="left">
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button variant="primary" onClick={handleNext} disabled={!canProceed || isSaving || isCompleting}>
                    {isLastStep ? (isCompleting ? 'Launching...' : completeLabel) : 'Next'}
                  </Button>
                </div>
              </div>
            </SheetHeader>
          }
        >
          {step && (
            <div className="flex flex-col gap-4 mt-2">
              <div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              <div className="flex-1">{step.content}</div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <CancelDialog isOpen={showCancelDialog} onConfirm={handleConfirmClose} onCancel={() => setShowCancelDialog(false)} />
    </>
  )
}
