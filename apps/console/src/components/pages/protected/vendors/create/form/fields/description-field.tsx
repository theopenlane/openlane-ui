'use client'

import React, { useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { EditVendorFormData } from '../../../hooks/use-form-schema'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { Value } from 'platejs'

type DescriptionFieldProps = {
  isEditing: boolean
  isCreate: boolean
  initialValue: string | Value | undefined | null
  isFormInitialized?: boolean
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, isCreate, initialValue, isFormInitialized }) => {
  const { control, formState } = useFormContext<EditVendorFormData>()
  const hasInitialized = useRef(false)

  console.log('Rendering DescriptionField with initialValue:', initialValue)

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
                console.log('PlateEditor onChange called, hasInitialized:', hasInitialized.current, 'isFormInitialized:', isFormInitialized)

                if (!hasInitialized.current && isFormInitialized) {
                  hasInitialized.current = true
                  return
                }

                if (hasInitialized.current && isFormInitialized) {
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
    initialValue && (
      <div className="w-full">
        <label htmlFor="description" className="block text-lg my-1 font-semibold">
          Description
        </label>
        <div className={'min-h-5'}>
          <PlateEditor toolbarClassName="-mt-20" placeholder="No description set" key={JSON.stringify(initialValue)} initialValue={initialValue} readonly={true} variant="readonly" />
        </div>
      </div>
    )
  )
}

export default DescriptionField
