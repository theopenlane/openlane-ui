'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@theopenlane/ui/form'
import { Input } from '@theopenlane/ui/input'
import { SystemTooltip } from '@theopenlane/ui/system-tooltip'
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
          <FormMessage error={formState.errors.title} />
        </FormItem>
      )}
    />
  )
}

export default TitleField
