'use client'

import React, { useId, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Label } from '@repo/ui/label'
import { Checkbox } from '@repo/ui/checkbox'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Callout } from '@/components/shared/callout/callout'
import { StepBadge } from '@/components/shared/step-badge/step-badge'
import { formatDate } from '@/utils/date'
import { cn } from '@repo/ui/lib/utils'
import {
  AICPA_LOGO_GUIDELINES_URL,
  AVAILABLE_SOC_REPORT_TYPES,
  DEFAULT_SOC_REPORT_TYPE,
  SOC_REPORT_MAX_AGE_MONTHS,
  type SocReportType,
  isAvailableSocReportType,
  isReportDateEligible,
  oldestEligibleReportDate,
  socBadgeForReportType,
} from './soc-badge-config'
import { SocBadgeAssets } from './soc-badge-assets'

type TSocBadgePanelProps = {
  className?: string
}

type TSocBadgeStepProps = {
  stepNumber: number
  title: string
  done: boolean
  active: boolean
  children: React.ReactNode
}

const SocBadgeStep: React.FC<TSocBadgeStepProps> = ({ stepNumber, title, done, active, children }) => (
  <section className="flex gap-4">
    <StepBadge stepNumber={stepNumber} done={done} active={active} size="sm" />
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <h3 className="text-base font-semibold leading-6">{title}</h3>
      {children}
    </div>
  </section>
)

export const SocBadgePanel: React.FC<TSocBadgePanelProps> = ({ className }) => {
  const reportTypeId = useId()
  const reportDateId = useId()
  const opinionId = useId()
  const guidelinesId = useId()

  const [reportType, setReportType] = useState<SocReportType>(DEFAULT_SOC_REPORT_TYPE)
  const [reportDate, setReportDate] = useState<Date | null>(null)
  const [opinionUnmodified, setOpinionUnmodified] = useState(false)
  const [guidelinesRead, setGuidelinesRead] = useState(false)

  const reportTooOld = !!reportDate && !isReportDateEligible(reportDate)
  const isEligible = !!reportDate && !reportTooOld && opinionUnmodified
  const isReady = isEligible && guidelinesRead
  const badge = socBadgeForReportType(reportType)

  const handleReportDateChange = (date: Date | null) => {
    setReportDate(date)
    if (!date || !isReportDateEligible(date)) setGuidelinesRead(false)
  }

  const handleOpinionChange = (checked: boolean) => {
    setOpinionUnmodified(checked)
    if (!checked) setGuidelinesRead(false)
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <SocBadgeStep stepNumber={1} title="Confirm eligibility" done={isEligible} active={!isEligible}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <Label id={reportTypeId}>Report type</Label>
            <Select value={reportType} onValueChange={(value) => isAvailableSocReportType(value) && setReportType(value)}>
              <SelectTrigger aria-labelledby={reportTypeId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_SOC_REPORT_TYPES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label id={reportDateId}>Report date</Label>
            <CalendarPopover defaultValue={reportDate} onChange={handleReportDateChange} disableFuture aria-labelledby={reportDateId} aria-invalid={reportTooOld} />
          </div>
        </div>

        {reportTooOld && (
          <Callout variant="warning" compact title="This report is too old to use the logo">
            The AICPA only allows the logo while your most recent report is no more than {SOC_REPORT_MAX_AGE_MONTHS} months old. Your report is dated {formatDate(reportDate.toISOString())}; it needs
            to be dated on or after {formatDate(oldestEligibleReportDate().toISOString())}. Come back once your next report is issued.
          </Callout>
        )}

        <div className="flex items-start gap-2">
          <Checkbox id={opinionId} checked={opinionUnmodified} onCheckedChange={(checked) => handleOpinionChange(checked === true)} className="mt-0.5" />
          <div className="flex flex-col gap-1">
            <Label htmlFor={opinionId}>The auditor issued an unmodified opinion</Label>
            <p className="text-sm text-muted-foreground">
              The report must be issued by a licensed CPA firm (or a non-U.S. equivalent such as a Chartered Accountant). The AICPA does not allow the logo for a qualified, adverse or disclaimed
              opinion.
            </p>
          </div>
        </div>
      </SocBadgeStep>

      <SocBadgeStep stepNumber={2} title="Review the AICPA guidelines" done={isReady} active={isEligible && !guidelinesRead}>
        <p className="text-sm text-muted-foreground">
          The logo may only be used as the AICPA describes, and only after your organization has submitted the AICPA registration form.{' '}
          <a href={AICPA_LOGO_GUIDELINES_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 align-middle text-blue-500 hover:underline">
            Read the logo guidelines
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
        </p>
        <div className="flex items-center gap-2">
          <Checkbox id={guidelinesId} checked={guidelinesRead} disabled={!isEligible} onCheckedChange={(checked) => setGuidelinesRead(checked === true)} />
          <Label htmlFor={guidelinesId}>I have read and will follow the AICPA logo guidelines</Label>
        </div>
      </SocBadgeStep>

      <SocBadgeStep stepNumber={3} title="Add the badge to your site" done={false} active={isReady}>
        {isReady && badge ? <SocBadgeAssets badge={badge} /> : <p className="text-sm text-muted-foreground">Complete the steps above to download the logo or copy the embed code.</p>}
      </SocBadgeStep>
    </div>
  )
}
