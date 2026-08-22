'use client'

import React, { useState } from 'react'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { ArrowLeft } from 'lucide-react'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
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
  const isFirstStep = currentStep === 0
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
            <SlideoutHeader
              title={title}
              aboveTitle={showBreadcrumb ? <div className="text-sm text-muted-foreground">{breadcrumbContent ?? breadcrumb}</div> : undefined}
              titleAdornment={
                <Badge variant="outline" className="font-mono text-xs">
                  STEP {currentStep + 1} OF {totalSteps}
                </Badge>
              }
              onClose={handleClose}
            />
          }
          footer={
            <>
              <CancelButton onClick={handleClose} disabled={isSaving || isCompleting} />
              <SaveButton type="button" variant="secondary" onClick={onSaveDraft} disabled={isSaving || isCompleting} isSaving={isSaving} title="Save Draft" savingTitle="Saving..." />
              {!isFirstStep && (
                <Button variant="outline" onClick={() => onStepChange(currentStep - 1)} disabled={isSaving || isCompleting} icon={<ArrowLeft size={16} />} iconPosition="left">
                  Previous
                </Button>
              )}
              <Button type="button" variant="primary" onClick={handleNext} disabled={!canProceed || isSaving || isCompleting}>
                {isLastStep ? (isCompleting ? 'Saving...' : completeLabel) : 'Next'}
              </Button>
            </>
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
