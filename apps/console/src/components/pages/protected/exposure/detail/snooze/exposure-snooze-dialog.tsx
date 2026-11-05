'use client'

import React, { useId, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Callout } from '@/components/shared/callout/callout'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { formatDate } from '@/utils/date'
import { getVulnerabilityDueDate, type TVulnerabilityDueDateSource } from '@/utils/vulnerability-due-date'
import { CUSTOM_SNOOZE, DEFAULT_SNOOZE_OPTION, SNOOZE_OPTIONS, earliestCustomSnoozeDate, getSnoozedRemediationSla, isSnoozeOption, resolveSnoozeUntil, type TSnoozeOption } from './snooze-options'

type TSlaDefinitionsStatus = 'pending' | 'error' | 'success'

type TSnoozePreview = { until: Date | null; currentDueDate: Date | null; extendsDueDate: boolean }

const getDisabledReason = (entityLabel: string, { until, extendsDueDate }: TSnoozePreview, slaDefinitionsStatus: TSlaDefinitionsStatus, allowNonExtending: boolean): string | undefined => {
  if (slaDefinitionsStatus === 'pending') return 'Loading SLA definitions…'
  if (slaDefinitionsStatus === 'error') return "Couldn't load SLA definitions. Please try again later."
  if (!until) return 'Choose a date to snooze until.'
  if (!extendsDueDate && !allowNonExtending) return `This ${entityLabel} is already due on or after the selected date.`
  return undefined
}

const describePreview = (entityLabel: string, until: Date, { currentDueDate, extendsDueDate }: TSnoozePreview): string => {
  const untilLabel = formatDate(until.toISOString())
  if (!extendsDueDate) return currentDueDate ? `Already due ${formatDate(currentDueDate.toISOString())}, on or after the selected date.` : `No due date can be set for this ${entityLabel}.`
  if (!currentDueDate) return `Due date will be ${untilLabel}.`
  return `Due date moves from ${formatDate(currentDueDate.toISOString())} to ${untilLabel}.`
}

type TExposureSnoozeFormProps = {
  entityLabel: string
  itemName: string
  item: TVulnerabilityDueDateSource
  slaDefinitions: SlaDefinitionsNodeNonNull[]
  slaDefinitionsStatus: TSlaDefinitionsStatus
  isPending: boolean
  allowNonExtending?: boolean
  onSnooze: (until: Date, comment: string) => Promise<void>
  onClose: () => void
  children?: React.ReactNode
}

export const ExposureSnoozeForm: React.FC<TExposureSnoozeFormProps> = ({
  entityLabel,
  itemName,
  item,
  slaDefinitions,
  slaDefinitionsStatus,
  isPending,
  allowNonExtending = false,
  onSnooze,
  onClose,
  children,
}) => {
  const [option, setOption] = useState<TSnoozeOption>(DEFAULT_SNOOZE_OPTION)
  const [customDate, setCustomDate] = useState<Date | null>(null)
  const [comment, setComment] = useState('')
  const durationLabelId = useId()
  const dateLabelId = useId()
  const commentId = useId()
  const { errorNotification } = useNotification()
  const inFlightRef = useRef(false)

  const until = resolveSnoozeUntil(option, customDate)
  const { dueDate: currentDueDate, slaDays } = getVulnerabilityDueDate(item, slaDefinitions)
  const preview: TSnoozePreview = { until, currentDueDate, extendsDueDate: until !== null && getSnoozedRemediationSla(item, until, slaDays) !== null }
  const disabledReason = getDisabledReason(entityLabel, preview, slaDefinitionsStatus, allowNonExtending)

  const handleSnooze = async () => {
    if (!until || disabledReason || inFlightRef.current) return
    inFlightRef.current = true
    try {
      await onSnooze(until, comment)
    } catch (error) {
      errorNotification({ title: `Failed to snooze ${entityLabel}`, description: parseErrorMessage(error) })
    } finally {
      inFlightRef.current = false
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Snooze {entityLabel}</DialogTitle>
        <DialogDescription>
          Push the remediation due date for <span className="font-medium text-text-header">{itemName}</span>.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span id={durationLabelId} className="text-sm font-medium">
            Snooze for
          </span>
          <Tabs value={option} onValueChange={(value) => isSnoozeOption(value) && setOption(value)} variant="solid">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4" aria-labelledby={durationLabelId}>
              {SNOOZE_OPTIONS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {option === CUSTOM_SNOOZE && (
            <div className="flex flex-col gap-2">
              <span id={dateLabelId} className="text-sm font-medium">
                Snooze until
              </span>
              <CalendarPopover defaultValue={customDate} onChange={setCustomDate} disabledFrom={earliestCustomSnoozeDate()} aria-labelledby={dateLabelId} />
            </div>
          )}
        </div>

        {until && (
          <Callout variant={preview.extendsDueDate ? 'plain' : 'warning'} compact>
            {describePreview(entityLabel, until, preview)}
          </Callout>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor={commentId} className="text-sm font-medium">
            Comment <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea id={commentId} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Waiting on the vendor patch scheduled for next sprint." rows={3} />
        </div>

        {children}
      </div>
      <div className="flex justify-end gap-2">
        <CancelButton disabled={isPending} onClick={onClose} />
        <DisabledReasonTooltip reason={isPending ? undefined : disabledReason}>
          <Button icon={<Clock size={16} />} iconPosition="left" loading={isPending} disabled={isPending || Boolean(disabledReason)} onClick={handleSnooze}>
            Snooze
          </Button>
        </DisabledReasonTooltip>
      </div>
    </>
  )
}

type TExposureSnoozeDialogProps = {
  isOpen: boolean
  isPending: boolean
  onClose: () => void
  children: React.ReactNode
}

export const ExposureSnoozeDialog: React.FC<TExposureSnoozeDialogProps> = ({ isOpen, isPending, onClose, children }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
    <DialogContent className="sm:max-w-[520px] bg-secondary">{children}</DialogContent>
  </Dialog>
)
