'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Checkbox } from '@repo/ui/checkbox'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { AlertTriangle, CalendarClock, Mail, Rocket, SendHorizontal, Users } from 'lucide-react'

export interface LaunchSummary {
  recipientCount: number
  emailTemplateName?: string
  questionnaireLabel?: string
}

interface LaunchCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLaunch: (scheduledAt: string | null) => Promise<void> | void
  isPending?: boolean
  summary: LaunchSummary
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = i % 2 === 0 ? 0 : 30
  const label = new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return { value: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, label }
})

export const LaunchCampaignDialog: React.FC<LaunchCampaignDialogProps> = ({ open, onOpenChange, onLaunch, isPending, summary }) => {
  const [mode, setMode] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [scheduledTime, setScheduledTime] = useState<string>('09:00')
  const [confirmed, setConfirmed] = useState(false)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!open) {
      setMode('immediate')
      setScheduledDate(null)
      setScheduledTime('09:00')
      setConfirmed(false)
      return
    }
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [open])

  const scheduledAt = useMemo(() => {
    if (mode === 'immediate' || !scheduledDate) return null
    const [hours, minutes] = scheduledTime.split(':').map(Number)
    const combined = new Date(scheduledDate)
    combined.setHours(hours, minutes, 0, 0)
    return combined
  }, [mode, scheduledDate, scheduledTime])

  const isScheduleInFuture = !!scheduledAt && now > 0 && scheduledAt.getTime() > now
  const canLaunch = confirmed && (mode === 'immediate' || isScheduleInFuture)

  const handleLaunch = () => {
    if (!canLaunch) return
    onLaunch(mode === 'immediate' ? null : (scheduledAt?.toISOString() ?? null))
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
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('immediate')}
              className={cn('flex flex-col gap-1 rounded-md border p-3 text-left', mode === 'immediate' ? 'border-brand bg-brand/5' : 'border-border hover:bg-muted/50')}
            >
              <SendHorizontal size={18} className="text-brand" />
              <span className="text-sm font-medium">Launch immediately</span>
              <span className="text-xs text-muted-foreground">Send the campaign as soon as you launch.</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('scheduled')}
              className={cn('flex flex-col gap-1 rounded-md border p-3 text-left', mode === 'scheduled' ? 'border-brand bg-brand/5' : 'border-border hover:bg-muted/50')}
            >
              <CalendarClock size={18} className="text-brand" />
              <span className="text-sm font-medium">Schedule for later</span>
              <span className="text-xs text-muted-foreground">Choose a date and time to launch the campaign.</span>
            </button>
          </div>
        </div>

        {mode === 'scheduled' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Launch date &amp; time</span>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CalendarPopover onChange={(val) => setScheduledDate(val)} />
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
          </div>
        )}

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
                <Mail size={16} /> Email template
              </span>
              <span className="text-sm">{summary.emailTemplateName ?? 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between gap-4 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Rocket size={16} /> Questionnaire
              </span>
              <span className="text-sm">{summary.questionnaireLabel ?? 'None'}</span>
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
