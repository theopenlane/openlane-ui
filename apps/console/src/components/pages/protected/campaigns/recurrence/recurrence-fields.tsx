'use client'

import React, { useId, useState } from 'react'
import { startOfDay } from 'date-fns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { TimezoneSelect } from '@/components/shared/timezone-select/timezone-select'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type CampaignFrequency } from '@repo/codegen/src/schema'
import { type CampaignRecurrenceValues, SUPPORTED_RECURRENCE_FREQUENCIES, describeRecurrence } from './campaign-recurrence'

const FREQUENCY_OPTIONS = SUPPORTED_RECURRENCE_FREQUENCIES.map((value) => ({ value, label: getEnumLabel(value) }))

type RecurrenceFieldsProps = {
  values: CampaignRecurrenceValues
  onChange: (values: CampaignRecurrenceValues) => void
}

export const RecurrenceFields: React.FC<RecurrenceFieldsProps> = ({ values, onChange }) => {
  const [today] = useState(() => startOfDay(new Date()))

  const frequencyOptions = FREQUENCY_OPTIONS.some((option) => option.value === values.frequency)
    ? FREQUENCY_OPTIONS
    : [...FREQUENCY_OPTIONS, { value: values.frequency, label: getEnumLabel(values.frequency) }]

  const frequencyId = useId()
  const intervalId = useId()

  const handleIntervalChange = (rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10)
    onChange({ ...values, interval: Number.isNaN(parsed) ? 1 : Math.max(parsed, 1) })
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Checkbox checked={values.isRecurring} onCheckedChange={(checked) => onChange({ ...values, isRecurring: checked === true })} />
        Repeat this campaign on a schedule
      </label>

      {values.isRecurring && (
        <div className="flex flex-col gap-3 rounded-md border border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor={frequencyId}>
                Frequency
              </label>
              <Select value={values.frequency} onValueChange={(value) => onChange({ ...values, frequency: value as CampaignFrequency })}>
                <SelectTrigger id={frequencyId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor={intervalId}>
                Interval
              </label>
              <Input id={intervalId} type="number" min={1} value={values.interval} onChange={(e) => handleIntervalChange(e.currentTarget.value)} />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Repeats: {describeRecurrence(values)}</span>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Timezone</span>
            <TimezoneSelect value={values.timezone} onChange={(timezone) => onChange({ ...values, timezone })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">End date (optional)</span>
            <CalendarPopover portal defaultValue={values.endAt} disabledFrom={today} onChange={(endAt) => onChange({ ...values, endAt })} />
          </div>
        </div>
      )}
    </div>
  )
}
