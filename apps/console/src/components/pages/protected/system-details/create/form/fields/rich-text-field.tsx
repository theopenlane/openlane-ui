'use client'

import React, { useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { type Value } from 'platejs'
import { type SystemDetailFormData } from '../../../hooks/use-form-schema'

type RichTextFieldProps = {
  name: keyof SystemDetailFormData
  label: string
  tooltip?: string
  placeholder?: string
  isEditing: boolean
  isCreate: boolean
  initialValue: string | Value | undefined | null
  isFormInitialized?: boolean
}

const RichTextField: React.FC<RichTextFieldProps> = ({ name, label, tooltip, placeholder, isEditing, isCreate, initialValue, isFormInitialized }) => {
  const { control, formState } = useFormContext<SystemDetailFormData>()
  const hasInitializedRef = useRef(false)
  const errorMessage = formState.errors[name]?.message
  const showError = typeof errorMessage === 'string'

  return isEditing || isCreate ? (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full py-4">
          <div className="flex items-center">
            <FormLabel>{label}</FormLabel>
            {tooltip && <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>{tooltip}</p>} />}
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
              placeholder={placeholder}
            />
          </FormControl>
          {showError && <p className="text-red-500 text-sm">{errorMessage}</p>}
        </FormItem>
      )}
    />
  ) : initialValue ? (
    <div className="w-full">
      <label className="block text-lg my-1 font-semibold">{label}</label>
      <div className="min-h-5 pb-4">
        <PlateEditor
          toolbarClassName="-mt-20"
          placeholder={placeholder ?? `No ${label.toLowerCase()} set`}
          key={JSON.stringify(initialValue)}
          initialValue={initialValue}
          readonly={true}
          variant="readonly"
        />
      </div>
    </div>
  ) : (
    <div className="w-full">
      <label className="block text-lg my-1 font-semibold">{label}</label>
      <p className="text-muted-foreground italic pb-4">No {label.toLowerCase()} set</p>
    </div>
  )
}

export default RichTextField
