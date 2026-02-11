'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { EditAssetFormData } from '../../../hooks/use-form-schema'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from 'platejs'

type DescriptionFieldProps = {
  isEditing: boolean
  initialValue: string | undefined | null
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, initialValue }) => {
  const { control, formState, setValue } = useFormContext<EditAssetFormData>()
  const { convertToReadOnly } = usePlateEditor()

  const handleChange = (value: Value) => {
    setValue('description', value)
  }

  return isEditing ? (
    <FormField
      control={control}
      name="description"
      render={() => (
        <FormItem className="w-full py-4">
          <div className="flex items-center">
            <FormLabel>Description</FormLabel>
            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a detailed description of the asset</p>} />
          </div>
          <FormControl>
            <PlateEditor onChange={(val) => handleChange(val)} initialValue={initialValue ?? undefined} placeholder="Write your asset description" />
          </FormControl>
          {formState.errors.description && <p className="text-red-500 text-sm">{formState.errors.description.message}</p>}
        </FormItem>
      )}
    />
  ) : (
    initialValue && <div className="my-4 cursor-not-allowed">{convertToReadOnly(initialValue as string)}</div>
  )
}

export default DescriptionField
