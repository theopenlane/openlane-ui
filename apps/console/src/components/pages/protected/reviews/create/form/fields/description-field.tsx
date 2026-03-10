'use client'

import React, { useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { type ReviewFormData } from '../../../hooks/use-form-schema'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type Value } from 'platejs'

type DescriptionFieldProps = {
  isEditing: boolean
  isCreate: boolean
  initialValue: string | Value | undefined | null
  isFormInitialized?: boolean
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, isCreate, initialValue, isFormInitialized }) => {
  const { control, formState } = useFormContext<ReviewFormData>()
  const hasInitializedRef = useRef(false)

  return isEditing || isCreate ? (
    <FormField
      control={control}
      name="details"
      render={({ field }) => (
        <FormItem className="w-full py-4">
          <div className="flex items-center">
            <FormLabel>Details</FormLabel>
            <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide detailed notes captured during the review</p>} />
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
              placeholder="Write your review details"
            />
          </FormControl>
          {formState.errors.details && <p className="text-red-500 text-sm">{formState.errors.details.message}</p>}
        </FormItem>
      )}
    />
  ) : (
    initialValue && (
      <div className="w-full">
        <label htmlFor="details" className="block text-lg my-1 font-semibold">
          Details
        </label>
        {initialValue ? (
          <div className="min-h-5 pb-4">
            <PlateEditor toolbarClassName="-mt-20" placeholder="No details set" key={JSON.stringify(initialValue)} initialValue={initialValue} readonly={true} variant="readonly" />
          </div>
        ) : (
          <p className="text-muted-foreground italic pb-4">No details set</p>
        )}
      </div>
    )
  )
}

export default DescriptionField
