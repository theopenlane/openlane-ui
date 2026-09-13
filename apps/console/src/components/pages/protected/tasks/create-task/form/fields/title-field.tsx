'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { type EditTaskFormData } from '../../../hooks/use-form-schema'

const TitleField: React.FC = () => {
  const { control, formState } = useFormContext<EditTaskFormData>()

  return (
    <FormField
      control={control}
      name="title"
      render={({ field }) => (
        <FormItem className="w-80">
          <div className="flex items-center">
            <FormLabel>Title</FormLabel>
            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the task later.</p>} />
          </div>
          <FormControl>
            <Input {...field} variant="medium" className="w-full" autoFocus />
          </FormControl>
          {formState.errors.title && <p className="text-red-500 text-sm">{formState.errors.title.message}</p>}
        </FormItem>
      )}
    />
  )
}

export default TitleField
