'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { EditTaskFormData } from '../../../hooks/use-form-schema'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from 'platejs'

type DetailsFieldProps = {
  isEditing: boolean
  initialValue: string | undefined | null
}

const DetailsField: React.FC<DetailsFieldProps> = ({ isEditing, initialValue }) => {
  const { control, formState, setValue } = useFormContext<EditTaskFormData>()
  const { convertToReadOnly } = usePlateEditor()

  const handleChange = (value: Value) => {
    setValue('details', value)
  }

  return isEditing ? (
    <FormField
      control={control}
      name="details"
      render={() => (
        <FormItem className="w-full py-4">
          <div className="flex items-center">
            <FormLabel>Details</FormLabel>
            <SystemTooltip
              icon={<InfoIcon size={14} className="mx-1 mt-1" />}
              content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
            />
          </div>
          <FormControl>
            <PlateEditor onChange={(val) => handleChange(val)} initialValue={inititalValue ?? undefined} placeholder="Write your task details" />
          </FormControl>
          {formState.errors.details && <p className="text-red-500 text-sm">{formState.errors.details.message}</p>}
        </FormItem>
      )}
    />
  ) : (
    inititalValue && <div className="my-4">{convertToReadOnly(inititalValue as string)}</div>
  )
}

export default DetailsField
