'use client'

import { useCallback } from 'react'
import { Controller, useController, type UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { type Value } from 'platejs'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { usePlateHydration } from '@/components/shared/plate/usePlateHydration'
import { ControlImplementationStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import { type TFormData } from './use-form-schema'

type ControlImplementationFieldsProps = {
  form: UseFormReturn<TFormData>
  detailsInitialValue?: TFormData['details']
}

export const ControlImplementationFields = ({ form, detailsInitialValue }: ControlImplementationFieldsProps) => {
  const { control } = form
  const hydrateDetails = usePlateHydration(form, 'details', detailsInitialValue)
  const { field: detailsField } = useController({ control, name: 'details' })
  const detailsOnChange = detailsField.onChange

  const handleDetailsChange = useCallback((value: Value) => hydrateDetails(value, detailsOnChange), [hydrateDetails, detailsOnChange])

  return (
    <div className="@container p-4 border rounded-lg space-y-4">
      <div className="flex flex-col gap-2">
        <Label>Details</Label>
        <PlateEditor initialValue={detailsInitialValue} onChange={handleDetailsChange} />
      </div>

      <div className="grid grid-cols-1 @md:grid-cols-2 gap-4 border-t pt-4">
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ControlImplementationStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Date Implemented</Label>
          <Controller
            name="implementationDate"
            control={control}
            render={({ field }) => <CalendarPopover field={field} disabledFrom={new Date()} defaultToday buttonClassName="w-full flex justify-between items-center h-10 border-border" />}
          />
        </div>
      </div>
    </div>
  )
}
