'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Textarea } from '@repo/ui/textarea'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type EditVendorFormData } from '../../../hooks/use-form-schema'

type DescriptionFieldProps = {
  isEditing: boolean
  isCreate: boolean
  initialValue: string | undefined | null
  onDoubleClickEdit?: () => void
  onBlurSave?: () => void
  canEdit?: boolean
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ isEditing, isCreate, initialValue, onDoubleClickEdit, onBlurSave, canEdit }) => {
  const { control, formState } = useFormContext<EditVendorFormData>()
  const { convertToReadOnly } = usePlateEditor()

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
            <Textarea
              autoFocus={!!onBlurSave}
              placeholder="Write your vendor description"
              {...field}
              value={typeof field.value === 'string' ? field.value : ''}
              onBlur={() => onBlurSave?.()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur()
                }
              }}
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
      <HoverPencilWrapper showPencil={!!canEdit} onPencilClick={onDoubleClickEdit}>
        {initialValue ? (
          initialValue.includes('slate') ? (
            <div className="min-h-5" onDoubleClick={onDoubleClickEdit}>
              {convertToReadOnly(initialValue)}
            </div>
          ) : (
            <p className="min-h-5 whitespace-pre-wrap" onDoubleClick={onDoubleClickEdit}>
              {initialValue}
            </p>
          )
        ) : (
          <p className="text-muted-foreground italic" onDoubleClick={onDoubleClickEdit}>
            No description set
          </p>
        )}
      </HoverPencilWrapper>
    </div>
  )
}

export default DescriptionField
