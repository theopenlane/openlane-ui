'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { csvAcceptedFileTypes, csvAcceptedFileTypesShort } from '@/components/shared/file-upload/file-upload-config'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { parseDelimitedText, serializeCsv, MAX_IMPORT_FILE_SIZE_MB, type TDelimitedGrid } from '@/components/shared/record-import/lib/delimited-file'
import { Callout } from '@/components/shared/callout/callout'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { useCreateBulkCSVVendorRiskScore, useUpdateBulkCSVVendorRiskScore } from '@/lib/graphql-hooks/vendor-risk-score'
import { planRiskAnswerImport, toCreateCsv, toUpdateCsv, type TRiskAnswerImportPlan } from './risk-answers-csv'
import { type TRiskQuestion } from './risk-answers'

const MAX_LISTED_ERRORS = 8

type TRiskAnswersUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  items: readonly TRiskQuestion[]
}

const toCsvFile = ({ headers, rows }: { headers: string[]; rows: string[][] }, name: string) => new File([serializeCsv(headers, rows)], name, { type: 'text/csv' })

const disabledReasonFor = (plan: TRiskAnswerImportPlan | null, answerCount: number) => {
  if (!plan) return 'Choose a CSV file first.'
  if (plan.errors.length > 0) return 'Fix the rows listed above and upload the file again.'
  if (answerCount === 0) return 'The file has no answers to import.'
  return undefined
}

export const RiskAnswersUploadDialog: React.FC<TRiskAnswersUploadDialogProps> = ({ open, onOpenChange, vendorId, items }) => {
  const [grid, setGrid] = useState<TDelimitedGrid | null | undefined>(undefined)
  const [fileName, setFileName] = useState<string | null>(null)
  const importInFlightRef = useRef(false)
  const [uploadKey, setUploadKey] = useState(0)
  const queryClient = useQueryClient()
  const createBulk = useCreateBulkCSVVendorRiskScore()
  const updateBulk = useUpdateBulkCSVVendorRiskScore()
  const { successNotification, errorNotification } = useNotification()
  const isImporting = createBulk.isPending || updateBulk.isPending
  const plan = useMemo<TRiskAnswerImportPlan | null>(() => {
    if (grid === undefined) return null
    return grid ? planRiskAnswerImport(grid, items) : { creates: [], updates: [], skippedCount: 0, errors: ['The file is empty or could not be read as a CSV.'] }
  }, [grid, items])
  const answerCount = (plan?.creates.length ?? 0) + (plan?.updates.length ?? 0)

  const reset = () => {
    setGrid(undefined)
    setFileName(null)
    setUploadKey((key) => key + 1)
  }

  const handleOpenChange = (next: boolean) => {
    if (isImporting) return
    if (!next) reset()
    onOpenChange(next)
  }

  const handleFile = async (uploaded: TUploadedFile) => {
    if (!uploaded.file) return
    setFileName(uploaded.name ?? null)
    try {
      setGrid(parseDelimitedText(await uploaded.file.text()))
    } catch {
      setGrid(null)
    }
  }

  const handleImport = async () => {
    if (!plan || answerCount === 0 || plan.errors.length > 0 || importInFlightRef.current) return
    importInFlightRef.current = true
    try {
      if (plan.creates.length > 0) await createBulk.mutateAsync({ input: toCsvFile(toCreateCsv(vendorId, plan.creates), 'risk-answers-new.csv') })
      const updated = plan.updates.length > 0 ? await updateBulk.mutateAsync({ input: toCsvFile(toUpdateCsv(plan.updates), 'risk-answers-updated.csv') }) : undefined
      const skippedUpdates = plan.updates.length - (updated?.updateBulkCSVVendorRiskScore.updatedIDs?.length ?? 0)
      const savedCount = answerCount - skippedUpdates
      if (skippedUpdates > 0) {
        errorNotification({
          title: 'Some answers were not saved',
          description: `${pluralizeWithCount(savedCount, 'answer')} saved; ${pluralizeWithCount(skippedUpdates, 'answer')} could not be updated. Reopen the sheet to check them.`,
        })
      } else {
        successNotification({ title: 'Answers imported', description: `${pluralizeWithCount(savedCount, 'answer')} saved.` })
      }
      reset()
      onOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Could not import the answers', description: parseErrorMessage(error) })
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['vendorRiskScores', 'scoring', vendorId] })
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScores', 'questionUsage'] })
      importInFlightRef.current = false
    }
  }

  const importDisabledReason = disabledReasonFor(plan, answerCount)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload answered CSV</DialogTitle>
          <DialogDescription>
            Use the questions CSV you downloaded, with the Answer, Likelihood and Impact columns filled in. Rows without an answer are skipped, and a blank Notes cell keeps the current note.
          </DialogDescription>
        </DialogHeader>

        <FileUpload
          key={uploadKey}
          onFileUpload={handleFile}
          maxFileSizeInMb={MAX_IMPORT_FILE_SIZE_MB}
          acceptedFileTypes={csvAcceptedFileTypes}
          acceptedFileTypesShort={csvAcceptedFileTypesShort}
          multipleFiles={false}
        />

        {plan && (
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-medium">{fileName}</p>
            {plan.errors.length > 0 ? (
              <Callout variant="danger" compact title={`${pluralizeWithCount(plan.errors.length, 'problem')} to fix`}>
                <ul className="list-disc space-y-0.5 pl-4">
                  {plan.errors.slice(0, MAX_LISTED_ERRORS).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                  {plan.errors.length > MAX_LISTED_ERRORS && <li>…and {plan.errors.length - MAX_LISTED_ERRORS} more</li>}
                </ul>
              </Callout>
            ) : (
              <Callout variant="info" compact>
                {pluralizeWithCount(plan.creates.length, 'new answer')} and {pluralizeWithCount(plan.updates.length, 'updated answer')} will be saved
                {plan.skippedCount > 0 ? `; ${pluralizeWithCount(plan.skippedCount, 'row')} without an answer will be skipped` : ''}.
              </Callout>
            )}
          </div>
        )}

        <DialogFooter>
          <CancelButton onClick={() => handleOpenChange(false)} disabled={isImporting} />
          <DisabledReasonTooltip reason={isImporting ? undefined : importDisabledReason}>
            <Button type="button" icon={<Upload size={16} />} iconPosition="left" onClick={handleImport} disabled={!!importDisabledReason || isImporting} loading={isImporting}>
              Import answers
            </Button>
          </DisabledReasonTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
