'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { type EditTaskFormData } from '../../../hooks/use-form-schema'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { usePlateHydration } from '@/components/shared/plate/usePlateHydration'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

type DetailsFieldProps = {
  isEditing: boolean
  initialValue: string | undefined | null
}

const DetailsField: React.FC<DetailsFieldProps> = ({ isEditing, initialValue }) => {
  const { control, formState, resetField } = useFormContext<EditTaskFormData>()
  const hydrate = usePlateHydration({ resetField })
  const { convertToReadOnly } = usePlateEditor()

  return isEditing ? (
    <FormField
      control={control}
      name="details"
      render={({ field }) => (
        <FormItem className="w-full py-4">
          <div className="flex items-center">
            <FormLabel>Details</FormLabel>
            <SystemTooltip
              icon={<InfoIcon size={14} className="mx-1 mt-1" />}
              content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
            />
          </div>
          <FormControl>
            <PlateEditor onChange={field.onChange} onHydrate={hydrate(field.name)} initialValue={initialValue ?? undefined} placeholder="Write your task details" />
          </FormControl>
          {formState.errors.details && <p className="text-red-500 text-sm">{formState.errors.details.message}</p>}
        </FormItem>
      )}
    />
  ) : (
    initialValue && <div className="my-4 cursor-not-allowed">{convertToReadOnly(initialValue as string)}</div>
  )
}

export default DetailsField
