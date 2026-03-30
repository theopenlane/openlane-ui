'use client'

import React, { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Switch } from '@repo/ui/switch'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { type CampaignFormData } from '../hooks/use-campaign-form-schema'

interface ScheduleStepProps {
  form: UseFormReturn<CampaignFormData>
}

export const ScheduleStep: React.FC<ScheduleStepProps> = ({ form }) => {
  const [sendImmediately, setSendImmediately] = useState<boolean>(form.getValues('sendImmediately'))

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={form.control}
        name="sendImmediately"
        render={({ field }) => (
          <div className="flex items-center gap-3">
            <Switch
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked)
                setSendImmediately(checked)
              }}
            />
            <div>
              <p className="text-sm font-medium">Send Immediately</p>
              <p className="text-xs text-muted-foreground">If enabled, the campaign will be sent as soon as it is launched.</p>
            </div>
          </div>
        )}
      />

      {!sendImmediately && (
        <>
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <CalendarPopover
                    field={{
                      value: field.value ?? '',
                      onChange: (val: string) => field.onChange(val || null),
                      onBlur: field.onBlur,
                      name: field.name,
                      ref: field.ref,
                    }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">The due date is when you want a response to be completed by.</p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Run Date</FormLabel>
                <FormControl>
                  <CalendarPopover
                    field={{
                      value: field.value ?? '',
                      onChange: (val: string) => field.onChange(val || null),
                      onBlur: field.onBlur,
                      name: field.name,
                      ref: field.ref,
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reminderEnabled"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                <div>
                  <p className="text-sm font-medium">Reminder</p>
                  <p className="text-xs text-muted-foreground">If enabled, you will have a notification from us on your email.</p>
                </div>
              </div>
            )}
          />
        </>
      )}
    </div>
  )
}
