'use client'

import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeTypeName, pluralizeWithCount, toHumanLabel } from '@/utils/strings'
import { ImportStepNav } from './import-step-nav'
import { FieldReferenceDialog } from './field-reference-dialog'
import { UploadStep } from './steps/upload-step'
import { MappingStep } from './steps/mapping-step'
import { ReviewStep } from './steps/review-step'
import { useRecordImport } from './lib/use-record-import'

export type TRecordImportDialogProps = {
  entityType: ObjectTypes
  displayName?: string
  displayNamePlural?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (file: File) => Promise<void>
}

export const RecordImportDialog: React.FC<TRecordImportDialogProps> = ({ entityType, displayName, displayNamePlural, open, onOpenChange, onImport }) => {
  const { successNotification, errorNotification } = useNotification()
  const [isImporting, setIsImporting] = useState(false)
  const [isFieldReferenceOpen, setIsFieldReferenceOpen] = useState(false)

  const {
    step,
    isFirstStep,
    isLastStep,
    goToStep,
    goNext,
    goBack,
    parsed,
    applyFile,
    columns,
    fields,
    requiredFields,
    mapping,
    setColumnField,
    validation,
    plan,
    reset,
    toImportFile,
    isLoadingExample,
    isExampleError,
  } = useRecordImport(entityType, open)

  const entityLabel = displayName ?? toHumanLabel(entityType)
  const entityLabelPlural = displayNamePlural ?? toHumanLabel(pluralizeTypeName(entityLabel))
  const rowCount = parsed?.rows.length ?? 0
  const recordCount = (count: number) => `${count.toLocaleString()} ${(count === 1 ? entityLabel : entityLabelPlural).toLowerCase()}`

  const close = () => {
    onOpenChange(false)
    reset()
  }

  const handleImport = async () => {
    setIsImporting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 0))
      const file = toImportFile()
      if (!file) return

      await onImport(file)
      successNotification({
        title: `${entityLabelPlural} imported`,
        description: `${recordCount(rowCount)} imported from ${parsed?.fileName}.`,
      })
      close()
    } catch (error) {
      errorNotification({ title: 'Import failed', description: parseErrorMessage(error) })
    } finally {
      setIsImporting(false)
    }
  }

  const hasBlockingIssues = validation.blockingIssues.length > 0
  const canContinue = step === 'upload' ? Boolean(parsed) && rowCount > 0 && !isLoadingExample : !hasBlockingIssues

  const footerHint = () => {
    if (step === 'upload') {
      if (!parsed) return 'Choose a file to continue'
      if (isLoadingExample) return `Loading the ${entityLabel.toLowerCase()} field reference…`
      if (rowCount === 0) return 'Choose a file with at least one data row'

      return `Header row and ${pluralizeWithCount(rowCount, 'data row')} parsed`
    }

    if (step === 'map') {
      if (hasBlockingIssues) return 'Resolve the issues above to continue'

      return `${pluralizeWithCount(validation.mappedColumnCount, 'column')} mapped · ${validation.ignoredColumnCount} ignored`
    }

    return 'Nothing in your original file is changed'
  }

  const blockDismissWhileImporting = (event: Event | KeyboardEvent) => {
    if (isImporting) event.preventDefault()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
        <DialogContent
          className="flex max-h-[90dvh] max-w-[min(1200px,92vw)] flex-col gap-4 overflow-hidden"
          onEscapeKeyDown={blockDismissWhileImporting}
          onInteractOutside={blockDismissWhileImporting}
        >
          <DialogHeader>
            <DialogTitle>Import your {entityLabelPlural.toLowerCase()}</DialogTitle>
            <DialogDescription>Upload your file and we&apos;ll help you map the columns to Openlane fields.</DialogDescription>
          </DialogHeader>

          <ImportStepNav current={step} />

          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            {isExampleError ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                The {entityLabel.toLowerCase()} field reference could not be loaded, so columns cannot be mapped. Please try again later.
              </p>
            ) : (
              <>
                {step === 'upload' && (
                  <UploadStep entityLabel={entityLabel} parsed={parsed} onFileParsed={applyFile} requiredFields={requiredFields} onOpenFieldReference={() => setIsFieldReferenceOpen(true)} />
                )}
                {step === 'map' && parsed && (
                  <MappingStep entityLabel={entityLabel} columns={columns} fields={fields} mapping={mapping} validation={validation} rowCount={rowCount} onColumnFieldChange={setColumnField} />
                )}
                {step === 'review' && parsed && (
                  <ReviewStep entityLabelPlural={entityLabelPlural} parsed={parsed} columns={columns} mapping={mapping} plan={plan} onEditMapping={() => goToStep('map')} />
                )}
              </>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t pt-4">
            <div className="mr-auto">
              {isFirstStep ? (
                <CancelButton onClick={close} />
              ) : (
                <Button variant="outline" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={goBack} disabled={isImporting}>
                  Back
                </Button>
              )}
            </div>
            <span role="status" aria-live="polite" className="text-sm text-muted-foreground">
              {footerHint()}
            </span>
            {isLastStep ? (
              <Button variant="primary" onClick={handleImport} loading={isImporting} disabled={isImporting || !parsed || hasBlockingIssues}>
                {isImporting ? 'Importing…' : `Import ${recordCount(rowCount)}`}
              </Button>
            ) : (
              <Button variant="primary" icon={<ArrowRight size={16} />} onClick={goNext} disabled={!canContinue}>
                Continue
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <FieldReferenceDialog open={isFieldReferenceOpen} onOpenChange={setIsFieldReferenceOpen} entityType={entityType} entityLabel={entityLabel} />
    </>
  )
}
