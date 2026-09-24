'use client'

import React, { useState } from 'react'
import { Check, ExternalLink, FileText, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { ScanScanType } from '@repo/codegen/src/schema'
import { Callout } from '@/components/shared/callout/callout'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { pdfAcceptedFileTypes, pdfAcceptedFileTypesShort } from '@/components/shared/file-upload/file-upload-config'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-categories'
import { useCompleteTask } from '@/hooks/useCompleteTask'
import { useNotification } from '@/hooks/useNotification'
import { useRecommendationsFeed } from '@/hooks/useRecommendationsFeed'
import { REPORT_SCAN_PERFORMER, useActiveReportScan, useCreateReportScan } from '@/lib/graphql-hooks/report-scan'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SuggestedTaskKindBadge } from '@/components/pages/protected/overview/suggested-task-kind-badge'
import { REPORT_SECTION_META } from '../sections'
import { useSavesToTrustCenter } from '../hooks/use-saves-to-trust-center'

const MAX_REPORT_SIZE_MB = 50

const BYTES_PER_KB = 1024

const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB

const formatReportSize = (bytes: number) => (bytes < BYTES_PER_MB ? `${Math.max(1, Math.round(bytes / BYTES_PER_KB))} KB` : `${(bytes / BYTES_PER_MB).toFixed(1)} MB`)

const LOOKS_FOR = [
  { icon: REPORT_SECTION_META.platforms.icon, title: 'Platforms and systems', description: 'What your report says is in scope, including the platform, systems, assets and vendors' },
  { icon: REPORT_SECTION_META.groups.icon, title: 'Groups', description: 'The roles your report names as responsible for parts of the program' },
  { icon: REPORT_SECTION_META.controls.icon, title: 'Controls', description: `The controls you operate, and the ${SOC_2_FRAMEWORK_NAME} criteria each one satisfies` },
  { icon: REPORT_SECTION_META.reviews.icon, title: 'Reviews and findings', description: 'The procedures the auditor performed, and anything they noted as an exception' },
]

type ReportScanUploadSheetProps = {
  suggestedTaskId?: string
  onClose: () => void
}

export const ReportScanUploadSheet = ({ suggestedTaskId, onClose }: ReportScanUploadSheetProps) => {
  const [file, setFile] = useState<File | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createReportScan, isPending: isSubmitting } = useCreateReportScan()
  const { completeTask, isCompleting } = useCompleteTask()
  const { suggestions } = useRecommendationsFeed({ enabled: !!suggestedTaskId, excludeTerminal: true })
  const savesToTrustCenter = useSavesToTrustCenter()
  const { activeReportScan, isPending: isActiveScanPending } = useActiveReportScan()
  const suggestion = suggestedTaskId ? suggestions.find((task) => task.id === suggestedTaskId) : undefined
  const submitDisabledReason = activeReportScan ? `We're still reading ${activeReportScan.target}. You'll get a notification when it's ready, then you can upload another report.` : undefined

  const handleClose = () => {
    if (!isSubmitting) onClose()
  }

  const handleSubmit = async () => {
    if (!file) return

    try {
      await createReportScan({ input: { scanType: ScanScanType.REPORT, performedBy: REPORT_SCAN_PERFORMER, target: file.name }, scanFiles: [file] })
      successNotification({ title: "We're reading your report", description: "Usually a couple of minutes. Carry on, we'll notify you when it's ready to review." })
      onClose()
    } catch (error) {
      errorNotification({ title: "We couldn't upload your report", description: parseErrorMessage(error) })
    }
  }

  const handleMarkComplete = async () => {
    if (suggestion && (await completeTask(suggestion.id))) onClose()
  }

  const references = suggestion?.metadata.references ?? []

  return (
    <Sheet open onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        minWidth={480}
        initialWidth={720}
        resizable={false}
        header={
          <SlideoutHeader
            title={`Import your ${SOC_2_FRAMEWORK_NAME} report`}
            aboveTitle={suggestion ? <SuggestedTaskKindBadge taskKind={suggestion.taskKind} /> : undefined}
            onClose={handleClose}
            primaryAction={suggestion ? { label: 'Mark as complete', icon: <Check size={16} />, onClick: () => void handleMarkComplete(), loading: isCompleting } : undefined}
          />
        }
        footer={
          <div className="flex w-full flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              <DisabledReasonTooltip reason={submitDisabledReason}>
                <Button
                  variant="primary"
                  icon={<Sparkles size={16} />}
                  iconPosition="left"
                  onClick={() => void handleSubmit()}
                  disabled={!file || isSubmitting || isActiveScanPending || !!submitDisabledReason}
                  loading={isSubmitting}
                >
                  Start import
                </Button>
              </DisabledReasonTooltip>
              <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                Not now
              </Button>
            </div>
            {references.length > 0 ? (
              <div className="flex flex-col items-end gap-1">
                <p className="text-xs font-semibold text-muted-foreground">Resources</p>
                {references.map((reference) => (
                  <a key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline">
                    {reference.name}
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {suggestion ? (
            <Callout variant="recommendation" compact title="Suggested by Openlane">
              You told us during setup that you&apos;ve completed a {SOC_2_FRAMEWORK_NAME} audit. Importing the report is the fastest way to stand up your program.
            </Callout>
          ) : null}

          <p className="text-sm">
            Your report already describes your platform, the vendors in scope, the controls you operate and anything the auditor flagged. Drop the PDF and we&apos;ll read it in the background. Nothing
            is created until you review it.
          </p>

          {file ? (
            <Card className="flex items-center gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <FileText size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatReportSize(file.size)}</p>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary">
                Ready
              </Badge>
              <Button variant="icon" size="icon" icon={<X size={16} />} onClick={() => setFile(null)} descriptiveTooltipText="Remove file" />
            </Card>
          ) : (
            <FileUpload
              acceptedFileTypes={pdfAcceptedFileTypes}
              acceptedFileTypesShort={pdfAcceptedFileTypesShort}
              maxFileSizeInMb={MAX_REPORT_SIZE_MB}
              multipleFiles={false}
              inputLabel={`Upload your ${SOC_2_FRAMEWORK_NAME} report`}
              onFileUpload={(uploaded) => setFile(uploaded.file ?? null)}
            />
          )}

          <Card className="flex flex-col gap-4 p-5">
            <p className="text-sm font-semibold text-muted-foreground">What we&apos;ll look for</p>
            {LOOKS_FOR.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </Card>

          {savesToTrustCenter ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="shrink-0" />
              Saved to your Trust Center as a private document. You can make it protected or public whenever you&apos;re ready.
            </p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
