'use client'

import React from 'react'
import { InternalPolicyDocumentStatus, InternalPolicyFrequency } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'
import { Binoculars, ScanEye, Stamp, ClockArrowUp, FileStack, ScrollText, Calendar, InfoIcon } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { CreatePolicyFormData } from '@/components/pages/protected/policies/hooks/use-form-schema.ts'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { CalendarPopover } from '@repo/ui/calendar-popover'

type TStatusCardProps = {
  form: UseFormReturn<CreatePolicyFormData>
}

const StatusCard: React.FC<TStatusCardProps> = ({ form }) => {
  const statusOptions = Object.values(InternalPolicyDocumentStatus).map((value) => ({
    label: value.charAt(0) + value.slice(1).toLowerCase(),
    value,
  }))

  const reviewFrequencyOptions = Object.values(InternalPolicyFrequency).map((value) => ({
    label: value.charAt(0) + value.slice(1).toLowerCase(),
    value,
  }))

  const booleanOptions = [
    {
      label: 'True',
      value: 'true',
    },
    { label: 'False', value: 'false' },
  ]

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Status */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <Binoculars size={16} className="text-brand" />
            <span>Status</span>
          </div>

          <div className="w-48">
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                    }}
                  >
                    <SelectTrigger className="w-full">{statusOptions.find((item) => item.value === form.getValues('status'))?.label || 'Select status'}</SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && <p className="text-red-500 text-sm">{form.formState.errors.status.message}</p>}
                </>
              )}
            />
          </div>
        </div>

        {/* Approval Required */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <ScanEye size={16} className="text-brand" />
            <span>Approval Required</span>
          </div>

          <div className="w-48">
            <Controller
              name="approvalRequired"
              control={form.control}
              render={({ field }) => (
                <>
                  <Select value={field.value.toString()} onValueChange={(value) => field.onChange(value === 'true')}>
                    <SelectTrigger className="w-full">{field.value.toString()}</SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.approvalRequired && <p className="text-red-500 text-sm">{form.formState.errors.approvalRequired.message}</p>}
                </>
              )}
            />
          </div>
        </div>

        {/* Set Approval group */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <Stamp size={16} className="text-brand" />
            <span>Set approval group</span>
          </div>

          <div className="flex gap-2"></div>
        </div>

        {/* Review Frequency */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <ClockArrowUp size={16} className="text-brand" />
            <span>Reviewing Frequency</span>
          </div>

          <div className="w-48">
            <Controller
              name="reviewFrequency"
              control={form.control}
              render={({ field }) => (
                <>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => {
                      field.onChange(value === 'unassigned' ? null : value || undefined)
                    }}
                  >
                    <SelectTrigger className="w-full">{form.getValues('reviewFrequency').toString()}</SelectTrigger>
                    <SelectContent>
                      {reviewFrequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.reviewFrequency && <p className="text-red-500 text-sm">{form.formState.errors.reviewFrequency.message}</p>}
                </>
              )}
            />
          </div>
        </div>

        {/* Version */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <FileStack size={16} className="text-brand" />
            <span>Version</span>
          </div>

          <div className="flex gap-2"></div>
        </div>

        {/* Policy type */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <ScrollText size={16} className="text-brand" />
            <span>Policy Type</span>
          </div>

          <div className="w-48">
            <FormField
              control={form.control}
              name="policyType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input variant="medium" {...field} className="w-full" />
                  </FormControl>
                  {form.formState.errors.policyType && <p className="text-red-500 text-sm">{form.formState.errors.policyType.message}</p>}
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Due date */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <Calendar size={16} className="text-brand" />
            <span>Set review date</span>
          </div>

          <div className="w-48">
            <Controller
              name="reviewDue"
              control={form.control}
              render={({ field }) => (
                <>
                  <CalendarPopover field={field} disabledFrom={new Date()} />
                  {form.formState.errors.reviewDue && <p className="text-red-500 text-sm">{form.formState.errors.reviewDue.message}</p>}
                </>
              )}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

export default StatusCard
