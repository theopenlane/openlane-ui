'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { SheetTitle } from '@repo/ui/sheet'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { EditTaskFormData } from '../../../hooks/use-form-schema'

type TitleFieldProps = {
  isEditing: boolean
}

const TitleField: React.FC<TitleFieldProps> = ({ isEditing }) => {
  const { control, getValues, formState } = useFormContext<EditTaskFormData>()
  const title = getValues('title')

  return (
    <SheetTitle>
      {isEditing ? (
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem className="w-1/3">
              <div className="flex items-center">
                <FormLabel>Title</FormLabel>
                <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the task later.</p>} />
              </div>
              <FormControl>
                <Input variant="medium" {...field} className="w-full" />
              </FormControl>
              {formState.errors.title && <p className="text-red-500 text-sm">{formState.errors.title.message}</p>}
            </FormItem>
          )}
        />
      ) : (
        title ?? 'No title'
      )}
    </SheetTitle>
  )
}

export default TitleField
