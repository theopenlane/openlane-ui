'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Checkbox } from '@repo/ui/checkbox'
import { Button } from '@repo/ui/button'
import { AlertTriangle, CalendarClock, Mail, Repeat, Rocket, SendHorizontal, Users } from 'lucide-react'
import { TZDate } from '@date-fns/tz'
import { ModeOption } from './mode-option'
import { TimezoneSelect } from '@/components/shared/timezone-select/timezone-select'
import { formatDateTime, getBrowserTimeZone } from '@/utils/date'
import { type CampaignRecurrenceValues, describeRecurrence } from '../recurrence/campaign-recurrence'
import { RecurrenceFields } from '../recurrence/recurrence-fields'

export type LaunchContent = { kind: 'questionnaire' | 'email'; label?: string }

export interface LaunchSummary {
  recipientCount: number
  content: LaunchContent
}

export type LaunchCampaignValues = {
  scheduledAt: string | null
  recurrence: CampaignRecurrenceValues
}

interface LaunchCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLaunch: (values: LaunchCampaignValues) => Promise<void> | void
  isPending?: boolean
  summary: LaunchSummary
  initialRecurrence: CampaignRecurrenceValues
}

const formatTimeLabel = (hours: number, minutes: number) => new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = i % 2 === 0 ? 0 : 30
  return { value: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, label: formatTimeLabel(hours, minutes) }
})

export const LaunchCampaignDialog: React.FC<LaunchCampaignDialogProps> = ({ open, onOpenChange, onLaunch, isPending, summary, initialRecurrence }) => {
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), [])
  const [mode, setMode] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [scheduledTime, setScheduledTime] = useState<string>('09:00')
  const [timeZone, setTimeZone] = useState<string>(browserTimeZone)
  const [recurrence, setRecurrence] = useState<CampaignRecurrenceValues>(initialRecurrence)
  const [confirmed, setConfirmed] = useState(false)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!open) return
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [open])

  const scheduledAt = useMemo(() => {
    if (mode === 'immediate' || !scheduledDate) return null
    const [hours, minutes] = scheduledTime.split(':').map(Number)
    return new TZDate(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate(), hours, minutes, timeZone)
  }, [mode, scheduledDate, scheduledTime, timeZone])

  const dstAdjustedTime = useMemo(() => {
    if (!scheduledAt) return null
    const [hours, minutes] = scheduledTime.split(':').map(Number)
    return scheduledAt.getHours() !== hours || scheduledAt.getMinutes() !== minutes ? formatTimeLabel(scheduledAt.getHours(), scheduledAt.getMinutes()) : null
  }, [scheduledAt, scheduledTime])

  const isScheduleInFuture = !!scheduledAt && now > 0 && scheduledAt.getTime() > now
  const canLaunch = confirmed && (mode === 'immediate' || isScheduleInFuture)

  const handleLaunch = () => {
    if (!canLaunch) return
    onLaunch({ scheduledAt: scheduledAt?.toISOString() ?? null, recurrence })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-lg flex-col">
        <DialogHeader>
          <DialogTitle>Launch campaign</DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="font-medium">This campaign will be launched to recipients.</span>
            <span className="text-muted-foreground">Once launched, you won&apos;t be able to edit the campaign, email, or questionnaire. You can still add recipients after launch.</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">When do you want to launch?</span>
          <div role="radiogroup" aria-label="Launch timing" className="grid grid-cols-2 gap-3">
            <ModeOption
              icon={<SendHorizontal size={18} className="text-brand" />}
              title="Launch immediately"
              description="Send the campaign as soon as you launch."
              selected={mode === 'immediate'}
              onSelect={() => setMode('immediate')}
            />
            <ModeOption
              icon={<CalendarClock size={18} className="text-brand" />}
              title="Schedule for later"
              description="Choose a date and time to launch the campaign."
              selected={mode === 'scheduled'}
              onSelect={() => setMode('scheduled')}
            />
          </div>
        </div>

        {mode === 'scheduled' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Launch date &amp; time</span>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CalendarPopover portal onChange={(val) => setScheduledDate(val)} />
              </div>
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TimezoneSelect value={timeZone} onChange={setTimeZone} referenceDate={scheduledAt} />
            {dstAdjustedTime && <span className="text-xs text-muted-foreground">This time is skipped by daylight saving in the selected timezone; the campaign will launch at {dstAdjustedTime}.</span>}
            {scheduledAt && timeZone !== browserTimeZone && <span className="text-xs text-muted-foreground">Your local time: {formatDateTime(scheduledAt.toISOString())}</span>}
          </div>
        )}

        <RecurrenceFields values={recurrence} onChange={setRecurrence} />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Summary</span>
          <div className="flex flex-col divide-y divide-border rounded-md border border-border">
            <div className="flex items-center justify-between gap-4 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Users size={16} /> Recipients
              </span>
              <span className="text-sm">
                {summary.recipientCount} recipient{summary.recipientCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                {summary.content.kind === 'questionnaire' ? (
                  <>
                    <Rocket size={16} /> Questionnaire template
                  </>
                ) : (
                  <>
                    <Mail size={16} /> Email template
                  </>
                )}
              </span>
              <span className="text-sm">{summary.content.label ?? 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Repeat size={16} /> Repeats
              </span>
              <span className="text-sm">{describeRecurrence(recurrence)}</span>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={confirmed} onCheckedChange={(checked) => setConfirmed(checked === true)} />I understand that this campaign will be launched and changes can&apos;t be made.
        </label>

        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" icon={<Rocket size={16} />} iconPosition="left" onClick={handleLaunch} disabled={!canLaunch || isPending}>
            {isPending ? 'Launching...' : 'Launch campaign'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
