'use client'

import React, { useId, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { cn } from '@repo/ui/lib/utils'
import { SCAN_PERFORMER } from '@/constants/scan-performers'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-categories'
import { useNotification } from '@/hooks/useNotification'
import { REPORT_SCAN_STARTED_NOTIFICATION, useCreateReportScan, useReportScanAvailability } from '@/lib/graphql-hooks/report-scan'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { isReportContentStepId, REPORT_SECTION_META, REPORT_STEP_SECTIONS, type ReportContentStepId } from '../sections'
import { REPORT_SCAN_STEPS } from '../types'

const AUDIT_STEPS: ReportContentStepId[] = ['reviews', 'findings', 'controls']

const OTHER_STEPS = REPORT_SCAN_STEPS.map((step) => step.id).filter((stepId): stepId is ReportContentStepId => isReportContentStepId(stepId) && !AUDIT_STEPS.includes(stepId))

const DEFAULT_SELECTION: ReportContentStepId[] = ['reviews', 'findings']

const STEP_DEPENDENCIES: { step: ReportContentStepId; requires: ReportContentStepId }[] = [{ step: 'program', requires: 'controls' }]

const NO_SECTION_REASON = 'Choose at least one section to import.'

export type TTrustCenterReportFile = { fileId: string; fileName: string }

type TSectionCheckboxProps = { stepId: ReportContentStepId; checked: boolean; requires?: ReportContentStepId; onCheckedChange: (checked: boolean) => void }

const SectionCheckbox = ({ stepId, checked, requires, onCheckedChange }: TSectionCheckboxProps) => {
  const id = useId()
  const meta = REPORT_SECTION_META[stepId]
  const Icon = meta.icon

  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} checked={checked} disabled={!!requires} onCheckedChange={(value) => onCheckedChange(value === true)} className="mt-0.5" />
      <label htmlFor={id} className={cn('flex min-w-0 items-start gap-2', requires ? 'opacity-60' : 'cursor-pointer')}>
        <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{meta.label}</span>
          <span className="block text-sm text-muted-foreground">{requires ? `Select ${REPORT_SECTION_META[requires].label} to include this.` : meta.summary}</span>
        </span>
      </label>
    </div>
  )
}

type TTrustCenterReportImportDialogProps = {
  report: TTrustCenterReportFile
  onClose: () => void
}

export const TrustCenterReportImportDialog = ({ report, onClose }: TTrustCenterReportImportDialogProps) => {
  const [selected, setSelected] = useState<Set<ReportContentStepId>>(() => new Set(DEFAULT_SELECTION))
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createReportScan, isPending: isSubmitting } = useCreateReportScan()
  const { canStart, blockedReason } = useReportScanAvailability(SCAN_PERFORMER.REPORT_PARSE)
  const disabledReason = blockedReason ?? (selected.size === 0 ? NO_SECTION_REASON : undefined)

  const submittingRef = useRef(false)
  const missingRequirement = (stepId: ReportContentStepId) => {
    const requirement = STEP_DEPENDENCIES.find((dependency) => dependency.step === stepId)?.requires
    return requirement && !selected.has(requirement) ? requirement : undefined
  }

  const toggle = (stepId: ReportContentStepId, checked: boolean) =>
    setSelected((previous) => {
      const next = new Set(previous)
      if (checked) next.add(stepId)
      else next.delete(stepId)
      STEP_DEPENDENCIES.forEach((dependency) => {
        if (!next.has(dependency.requires)) next.delete(dependency.step)
      })
      return next
    })

  const handleClose = () => {
    if (!isSubmitting) onClose()
  }

  const handleRunImport = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    const sections = [...AUDIT_STEPS, ...OTHER_STEPS].filter((stepId) => selected.has(stepId)).flatMap((stepId) => REPORT_STEP_SECTIONS[stepId])

    try {
      await createReportScan({ performer: SCAN_PERFORMER.REPORT_PARSE, report: { kind: 'existing', ...report }, sections })
      successNotification(REPORT_SCAN_STARTED_NOTIFICATION[SCAN_PERFORMER.REPORT_PARSE])
      onClose()
    } catch (error) {
      errorNotification({ title: "We couldn't start the import", description: parseErrorMessage(error) })
    } finally {
      submittingRef.current = false
    }
  }

  const renderSections = (stepIds: ReportContentStepId[]) =>
    stepIds.map((stepId) => (
      <SectionCheckbox key={stepId} stepId={stepId} checked={selected.has(stepId)} requires={missingRequirement(stepId)} onCheckedChange={(checked) => toggle(stepId, checked)} />
    ))

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from this {SOC_2_FRAMEWORK_NAME} report?</DialogTitle>
          <DialogDescription>
            We can read {report.fileName} and add what your auditor recorded to Openlane. You&apos;ll review everything before it is created, and the report is not uploaded again.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {renderSections(AUDIT_STEPS)}
          <div className="flex flex-col gap-4 border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground">Usually imported during onboarding</p>
            {renderSections(OTHER_STEPS)}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Not now
          </Button>
          <DisabledReasonTooltip reason={disabledReason}>
            <Button
              variant="primary"
              icon={<Sparkles size={16} />}
              iconPosition="left"
              onClick={() => void handleRunImport()}
              disabled={isSubmitting || !canStart || !!disabledReason}
              loading={isSubmitting}
            >
              Run import
            </Button>
          </DisabledReasonTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
