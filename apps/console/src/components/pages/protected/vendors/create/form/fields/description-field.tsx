'use client'

import React, { useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { type Value } from 'platejs'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type EditVendorFormData } from '../../../hooks/use-form-schema'

type DescriptionFieldProps = {
  isEditing: boolean
  isCreate: boolean
  initialValue: string | Value | undefined | null
  isFormInitialized?: boolean
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, isCreate, initialValue, isFormInitialized }) => {
  const { control, formState } = useFormContext<EditVendorFormData>()
  const hasInitializedRef = useRef(false)

  return isEditing || isCreate ? (
    <FormField
      control={control}
      name="description"
      render={({ field }) => (
        <FormItem className="w-full py-4">
          <div className="flex items-center">
            <FormLabel>Description</FormLabel>
            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a detailed description of the vendor</p>} />
          </div>
          <FormControl>
            <PlateEditor
              onChange={(val) => {
                if (!hasInitializedRef.current && isFormInitialized) {
                  hasInitializedRef.current = true
                  return
                }
                if (hasInitializedRef.current && isFormInitialized) {
                  field.onChange(val)
                }
              }}
              initialValue={initialValue ?? ''}
              placeholder="Write your vendor description"
            />
          </FormControl>
          {formState.errors.description && <p className="text-red-500 text-sm">{formState.errors.description.message}</p>}
        </FormItem>
      )}
    />
  ) : (
    <div className="w-full">
      <div className="flex items-center mb-1">
        <span className="font-medium">Description</span>
        <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a detailed description of the vendor and what it is used for</p>} />
      </div>
      {initialValue ? (
        <div className="min-h-5 pb-4">
          <PlateEditor toolbarClassName="-mt-20" key={JSON.stringify(initialValue)} initialValue={initialValue} readonly={true} variant="readonly" />
        </div>
      ) : (
        <p className="text-muted-foreground italic pb-4">No description set</p>
      )}
    </div>
  )
}

export default DescriptionField
