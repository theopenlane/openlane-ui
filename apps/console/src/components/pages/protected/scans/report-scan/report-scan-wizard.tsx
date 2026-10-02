'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { defineStepper } from '@stepperize/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@uidotdev/usehooks'
import { FileText } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { getYear } from 'date-fns'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SOC_2_SYSTEM_STANDARD } from '@/constants/standards'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-categories'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { emptyReportScanExistingIds, useReportScanExistingRecords } from '@/lib/graphql-hooks/report-scan'
import { useSystemStandard } from '@/lib/graphql-hooks/standard'
import { ScanSummarySidebar } from '../shared/scan-summary-sidebar'
import { StepProgress } from '../shared/step-progress'
import { ReportFoundSummary } from './components/report-found-summary'
import { ReportScanHeading } from './components/report-scan-heading'
import { useReportScanImport } from './hooks/use-report-scan-import'
import { useReportScanState } from './hooks/use-report-scan-state'
import { useSavesToTrustCenter } from './hooks/use-saves-to-trust-center'
import { ReportScanStepBody } from './report-scan-step-body'
import { reportStepVisibility } from './sections'
import { resolvePlatform, resolveSystem } from './selection'
import { buildSummarySections } from './summary-sections'
import { REPORT_SCAN_STEPS, REPORT_SECTION_IDS, type ParsedReport } from './types'

const LOOKUP_DEBOUNCE_MS = 400

const EMPTY_EXISTING_IDS = emptyReportScanExistingIds()

type ReportScanWizardProps = {
  scanId: string
  reportName: string
  report: ParsedReport
}

export const ReportScanWizard = ({ scanId, reportName, report }: ReportScanWizardProps) => {
  const router = useRouter()
  const visibility = useMemo(() => reportStepVisibility(report), [report])
  const visibleSteps = useMemo(() => REPORT_SCAN_STEPS.filter((step) => visibility[step.id]), [visibility])
  const { useStepper } = useMemo(() => defineStepper(visibleSteps), [visibleSteps])
  const state = useReportScanState(
    scanId,
    report,
    visibleSteps.map((step) => step.id),
    visibility.program,
  )
  const stepper = useStepper({ step: state.stepId, onStepChange: (stepId) => state.setStepId(stepId), onInvalidStep: () => state.setStepId(visibleSteps[0].id) })
  useEffect(() => {
    document.querySelector('[data-scroll-container="main"]')?.scrollTo({ top: 0 })
  }, [state.stepId, state.hasStarted])

  const [programName] = useState(() => `${SOC_2_FRAMEWORK_NAME} - ${getYear(new Date())}`)

  const platformNamesKey = [...new Set(report.platforms.flatMap((platform) => [platform.name, resolvePlatform(platform, state.platformOverrides).name.trim()]).filter(Boolean))].sort().join('\n')
  const debouncedPlatformNamesKey = useDebounce(platformNamesKey, LOOKUP_DEBOUNCE_MS)
  const lookupNames = useMemo(
    () => ({
      platforms: debouncedPlatformNamesKey.split('\n').filter(Boolean),
      vendors: report.vendors.map((vendor) => vendor.name),
      assets: report.assets.map((asset) => asset.name),
      groups: report.groups.map((group) => group.name),
      controls: report.controls.map((control) => control.refCode),
    }),
    [report, debouncedPlatformNamesKey],
  )
  const { data: existing = EMPTY_EXISTING_IDS, isPending: isExistingPending, error: existingError } = useReportScanExistingRecords(lookupNames)
  useQueryErrorNotification({ error: existingError, description: 'Failed to check which records already exist in Openlane' })

  const { standardId: soc2StandardId, isPending: isStandardPending } = useSystemStandard(SOC_2_SYSTEM_STANDARD)
  const savesToTrustCenter = useSavesToTrustCenter()

  const { handleImport, isImporting, canImport } = useReportScanImport({ scanId, report, state, program: state.program, existing, soc2StandardId, programName })

  const { selection, platformOverrides, systemOverrides, program } = state
  const summarySections = useMemo(
    () => buildSummarySections({ report, selection, visibility, platformOverrides, systemOverrides, program, programName }),
    [report, selection, visibility, platformOverrides, systemOverrides, program, programName],
  )

  const hasUnnamedRecord =
    report.platforms.some((platform) => selection.platforms.has(platform.id) && !resolvePlatform(platform, platformOverrides).name.trim()) ||
    report.systems.some((system) => selection.systems.has(system.id) && !resolveSystem(system, systemOverrides).name.trim())

  const importDisabledReason =
    isExistingPending || platformNamesKey !== debouncedPlatformNamesKey
      ? 'Checking which records already exist in Openlane'
      : existingError
        ? "We couldn't check which records already exist, so importing could create duplicates. Please try again later."
        : program.create && isStandardPending
          ? `Loading the ${SOC_2_FRAMEWORK_NAME} framework`
          : hasUnnamedRecord
            ? 'Every selected platform and system needs a name'
            : !canImport
              ? 'Select at least one record to import'
              : undefined

  const handleFinishLater = () => {
    state.persistProgress()
    router.push('/notifications')
  }

  const currentSection = REPORT_SECTION_IDS.find((section) => section === stepper.current.id)
  const handleSkipSection = () => {
    if (currentSection) state.setSectionSelection(currentSection)(new Set())
    stepper.next()
  }

  if (!state.hasStarted) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <ReportScanHeading reportName={reportName} />
        <ReportFoundSummary report={report} visibility={visibility} />
        {savesToTrustCenter ? (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <FileText size={16} className="shrink-0" />
            {reportName} is saved in your Trust Center as a private document.
            <Link href="/trust-center/documents" className="text-blue-500 hover:underline">
              View in documents
            </Link>
          </p>
        ) : null}
        <div className="mt-6 flex items-center justify-between">
          <Button variant="secondary" onClick={handleFinishLater}>
            Finish later
          </Button>
          <Button variant="primary" onClick={() => state.setHasStarted(true)}>
            Get started
          </Button>
        </div>
      </div>
    )
  }

  const isConfirmStep = stepper.current.id === 'confirm'

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <ReportScanHeading reportName={reportName} />

      <div className="mt-6">
        <StepProgress label={isConfirmStep ? 'Ready to import' : `Step ${stepper.index + 1} of ${stepper.count - 1} · ${stepper.current.label}`} progress={(stepper.index + 1) / stepper.count} />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" onClick={handleFinishLater}>
          Finish later
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          {currentSection ? (
            <Button variant="secondary" onClick={handleSkipSection}>
              Skip this section
            </Button>
          ) : null}
          {!stepper.isFirst ? (
            <Button variant="secondary" onClick={() => stepper.prev()}>
              Back
            </Button>
          ) : null}
          {stepper.isLast ? (
            <DisabledReasonTooltip reason={isImporting ? undefined : importDisabledReason}>
              <Button variant="primary" onClick={() => void handleImport()} loading={isImporting} disabled={isImporting || !!importDisabledReason}>
                Import
              </Button>
            </DisabledReasonTooltip>
          ) : (
            <Button variant="primary" onClick={() => stepper.next()}>
              Save and continue
            </Button>
          )}
        </div>
      </div>

      <div className={cn('grid grid-cols-1 gap-6', !isConfirmStep && 'lg:grid-cols-[2fr_1fr]')}>
        <div className="min-w-0">
          <ReportScanStepBody stepId={stepper.current.id} report={report} state={state} existing={existing} summarySections={summarySections} />
        </div>

        {!isConfirmStep ? (
          <div>
            <ScanSummarySidebar sections={summarySections} onEditStep={state.setStepId} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
