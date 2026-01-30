'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { SheetTitle } from '@repo/ui/sheet'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { EditTaskFormData } from '../../../hooks/use-form-schema'
import useEscapeKey from '@/hooks/useEscapeKey'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

type TitleFieldProps = {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate?: (val: { title: string }) => void
  initialValue?: string
  internalEditing: keyof EditTaskFormData | null
  setInternalEditing: (field: keyof EditTaskFormData | null) => void
}

const TitleField: React.FC<TitleFieldProps> = ({ isEditing, isEditAllowed = true, handleUpdate, initialValue, internalEditing, setInternalEditing }) => {
  const { control, getValues, setValue, formState } = useFormContext<EditTaskFormData>()

  const handleBlur = () => {
    if (isEditing) return

    const newValue = getValues('title')?.trim()
    const oldValue = initialValue?.trim()

    if (!newValue || newValue === oldValue) {
      setInternalEditing(null)
      return
    }

    handleUpdate?.({ title: newValue })
    setInternalEditing(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const handleDoubleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing('title')
    }
  }

  useEscapeKey(
    () => {
      if (internalEditing === 'title' && initialValue) {
        setValue('title', initialValue)
        setInternalEditing(null)
      }
    },
    { enabled: internalEditing === 'title' },
  )

  const isCurrentlyEditing = isEditing || internalEditing === 'title'

  return (
    <SheetTitle onDoubleClick={handleDoubleClick} className={isEditAllowed ? 'cursor-pointer w-fit' : 'cursor-not-allowed'}>
      {isCurrentlyEditing ? (
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
                <Input {...field} variant="medium" className="w-full" onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus />
              </FormControl>
              {formState.errors.title && <p className="text-red-500 text-sm">{formState.errors.title.message}</p>}
            </FormItem>
          )}
        />
      ) : (
        <HoverPencilWrapper className={'pr-5'} showPencil={isEditAllowed} onPencilClick={handleDoubleClick}>
          {initialValue || 'No title'}
        </HoverPencilWrapper>
      )}
    </SheetTitle>
  )
}

export default TitleField
