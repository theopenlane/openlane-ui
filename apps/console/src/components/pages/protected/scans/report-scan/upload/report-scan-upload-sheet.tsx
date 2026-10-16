'use client'

import React, { useRef, useState } from 'react'
import { Check, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { Callout } from '@/components/shared/callout/callout'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-categories'
import { SCAN_PERFORMER, type TReportScanPerformer } from '@/constants/scan-performers'
import { useCompleteTask } from '@/hooks/useCompleteTask'
import { useNotification } from '@/hooks/useNotification'
import { useRecommendationsFeed } from '@/hooks/useRecommendationsFeed'
import { REPORT_SCAN_STARTED_NOTIFICATION, type TReportScanFile, useCreateReportScan, useReportScanAvailability } from '@/lib/graphql-hooks/report-scan'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SuggestedTaskKindBadge } from '@/components/pages/protected/overview/suggested-task-kind-badge'
import { REPORT_SECTION_META } from '../sections'
import { useSavesToTrustCenter } from '../hooks/use-saves-to-trust-center'
import { ReportFileField } from './report-file-field'
import { LooksForCard, type TLooksForItem } from './looks-for-card'
import { VendorReviewExplainer } from './vendor-review-explainer'

const OWN_LOOKS_FOR: TLooksForItem[] = [
  { icon: REPORT_SECTION_META.platforms.icon, title: 'Platforms and systems', description: 'What your report says is in scope, including the platform, systems, assets and vendors' },
  { icon: REPORT_SECTION_META.groups.icon, title: 'Groups', description: 'The roles your report names as responsible for parts of the program' },
  { icon: REPORT_SECTION_META.controls.icon, title: 'Controls', description: `The controls you operate, and the ${SOC_2_FRAMEWORK_NAME} criteria each one satisfies` },
  { icon: REPORT_SECTION_META.reviews.icon, title: 'Reviews and findings', description: 'The procedures the auditor performed, and anything they noted as an exception' },
]

export type TReportScanVendor = { id: string; name: string }

export type TReportScanUploadMode = { kind: 'own'; suggestedTaskId?: string } | { kind: 'vendor'; vendor?: TReportScanVendor; initialReport?: TReportScanFile }

type TModeCopy = {
  performer: TReportScanPerformer
  title: (vendor?: TReportScanVendor) => string
  intro: (vendor?: TReportScanVendor) => string
  uploadLabel: string
  submitLabel: string
  errorTitle: string
}

const MODE_COPY: Record<TReportScanUploadMode['kind'], TModeCopy> = {
  own: {
    performer: SCAN_PERFORMER.REPORT_PARSE,
    title: () => `Import your ${SOC_2_FRAMEWORK_NAME} report`,
    intro: () =>
      `Upload a ${SOC_2_FRAMEWORK_NAME} report to extract information about your systems, vendors, controls, and audit findings. You can review and select what to import before anything is created.`,
    uploadLabel: `Upload your ${SOC_2_FRAMEWORK_NAME} report`,
    submitLabel: 'Start import',
    errorTitle: "We couldn't upload your report",
  },
  vendor: {
    performer: SCAN_PERFORMER.VENDOR_REPORT_REVIEW,
    title: (vendor) => (vendor ? `Review ${vendor.name}'s ${SOC_2_FRAMEWORK_NAME} report` : `Create a vendor from a ${SOC_2_FRAMEWORK_NAME} report`),
    intro: (vendor) =>
      vendor
        ? `We'll read ${vendor.name}'s ${SOC_2_FRAMEWORK_NAME} report and record a completed review on the vendor, with the auditor's opinion, a risk rating and every exception the auditor found.`
        : `We'll read the vendor's ${SOC_2_FRAMEWORK_NAME} report, match it to a vendor you already have or create one from the report's name, domains, description and services, and record a completed review on it.`,
    uploadLabel: `Upload the vendor's ${SOC_2_FRAMEWORK_NAME} report`,
    submitLabel: 'Start review',
    errorTitle: "We couldn't start the review",
  },
}

type ReportScanUploadSheetProps = {
  mode: TReportScanUploadMode
  onClose: () => void
}

export const ReportScanUploadSheet = ({ mode, onClose }: ReportScanUploadSheetProps) => {
  const [report, setReport] = useState<TReportScanFile | null>(mode.kind === 'vendor' ? (mode.initialReport ?? null) : null)
  const copy = MODE_COPY[mode.kind]
  const submittingRef = useRef(false)
  const suggestedTaskId = mode.kind === 'own' ? mode.suggestedTaskId : undefined
  const vendor = mode.kind === 'vendor' ? mode.vendor : undefined
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createReportScan, isPending: isSubmitting } = useCreateReportScan()
  const { completeTask, isCompleting } = useCompleteTask()
  const { suggestions } = useRecommendationsFeed({ enabled: !!suggestedTaskId, excludeTerminal: true })
  const savesToTrustCenter = useSavesToTrustCenter()
  const { canStart, blockedReason } = useReportScanAvailability(copy.performer)
  const suggestion = suggestedTaskId ? suggestions.find((task) => task.id === suggestedTaskId) : undefined

  const handleClose = () => {
    if (!isSubmitting) onClose()
  }

  const handleSubmit = async () => {
    if (!report || submittingRef.current) return
    submittingRef.current = true

    try {
      await createReportScan({ performer: copy.performer, report, vendorId: vendor?.id })
      successNotification(REPORT_SCAN_STARTED_NOTIFICATION[copy.performer])
      onClose()
    } catch (error) {
      errorNotification({ title: copy.errorTitle, description: parseErrorMessage(error) })
    } finally {
      submittingRef.current = false
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
            title={copy.title(vendor)}
            aboveTitle={suggestion ? <SuggestedTaskKindBadge taskKind={suggestion.taskKind} /> : undefined}
            onClose={handleClose}
            primaryAction={suggestion ? { label: 'Mark as complete', icon: <Check size={16} />, onClick: () => void handleMarkComplete(), loading: isCompleting } : undefined}
          />
        }
        footer={
          <div className="flex w-full flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              <DisabledReasonTooltip reason={blockedReason}>
                <Button variant="primary" icon={<Sparkles size={16} />} iconPosition="left" onClick={() => void handleSubmit()} disabled={!report || isSubmitting || !canStart} loading={isSubmitting}>
                  {copy.submitLabel}
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

          <p className="text-sm">{copy.intro(vendor)}</p>

          <ReportFileField value={report} onChange={setReport} vendorId={vendor?.id} uploadLabel={copy.uploadLabel} />

          {mode.kind === 'own' ? <LooksForCard items={OWN_LOOKS_FOR} /> : <VendorReviewExplainer />}

          {mode.kind === 'own' && savesToTrustCenter ? (
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
