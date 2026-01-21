'use client'

import React from 'react'
import { ProcedureFrequency } from '@repo/codegen/src/schema.ts'
import { Card } from '@repo/ui/cardpanel'
import { Binoculars, Calendar, CalendarCheck2, CalendarClock, ClockArrowUp, FileStack, ScanEye, ScrollText } from 'lucide-react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import { CreateProcedureFormData } from '@/components/pages/protected/procedures/create/hooks/use-form-schema.ts'
import { formatTimeSince } from '@/utils/date'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { ProcedureStatusOptions } from '@/components/shared/enum-mapper/policy-enum'
import { TMetadata } from '@/components/pages/protected/procedures/create/form/create-procedure-form.tsx'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import CustomTypeEnumChip from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

type TStatusCardProps = {
  form: UseFormReturn<CreateProcedureFormData>
  metadata?: TMetadata
}

const StatusCard: React.FC<TStatusCardProps> = ({ form, metadata }) => {
  const statusOptions = ProcedureStatusOptions

  const reviewFrequencyOptions = Object.values(ProcedureFrequency).map((value) => ({
    label: value.charAt(0) + value.slice(1).toLowerCase(),
    value,
  }))

  const { enumOptions, isSuccess: isTypesSuccess } = useGetCustomTypeEnums({
    where: {
      objectType: 'procedure',
      field: 'kind',
    },
  })

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
                      if (value) {
                        field.onChange(value)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">{statusOptions.find((item) => item.value === field.value)?.label}</SelectTrigger>
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
                  <Select value={field.value!.toString()} onValueChange={(value) => field.onChange(value === 'true')}>
                    <SelectTrigger className="w-full">{field.value!.toString()}</SelectTrigger>
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
                    value={field.value!.toString()}
                    onValueChange={(value) => {
                      if (value) {
                        field.onChange(value)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">{reviewFrequencyOptions.find((item) => item.value === field.value)?.label}</SelectTrigger>
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

          <div className="w-48">{metadata?.revision}</div>
        </div>

        {/* Procedure type */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="flex gap-2 items-center">
            <ScrollText size={16} className="text-brand" />
            <span>Procedure Type</span>
          </div>

          <div className="w-48">
            <FormField
              control={form.control}
              name="procedureKindName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select value={field.value || ''} onValueChange={(value) => field.onChange(value)} disabled={!isTypesSuccess}>
                      <SelectTrigger className="w-full">{enumOptions?.find((opt) => opt.value === field.value)?.label ?? 'Select type'}</SelectTrigger>

                      <SelectContent>
                        {enumOptions?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <CustomTypeEnumChip option={option} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>

                  {form.formState.errors.procedureKindName && <p className="text-red-500 text-sm">{form.formState.errors.procedureKindName.message}</p>}
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Created At */}
        {metadata && (
          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
            <div className="flex gap-2 items-center">
              <CalendarCheck2 size={16} className="text-brand" />
              <span>Created At</span>
            </div>

            <div className="w-48">{formatTimeSince(metadata.createdAt)}</div>
          </div>
        )}

        {/* Updated At */}
        {metadata && (
          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
            <div className="flex gap-2 items-center">
              <CalendarClock size={16} className="text-brand" />
              <span>Updated At</span>
            </div>

            <div className="w-48">{formatTimeSince(metadata.updatedAt)}</div>
          </div>
        )}

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
