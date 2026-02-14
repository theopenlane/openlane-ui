'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { SheetTitle } from '@repo/ui/sheet'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { EditAssetFormData } from '../../../hooks/use-form-schema'
import useEscapeKey from '@/hooks/useEscapeKey'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'

type NameFieldProps = {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdate?: (val: { name: string }) => void
  initialValue?: string
  internalEditing: string | null
  setInternalEditing: (field: string | null) => void
}

const NameField: React.FC<NameFieldProps> = ({ isEditing, isEditAllowed = true, handleUpdate, initialValue, internalEditing, setInternalEditing }) => {
  const { control, getValues, setValue, formState } = useFormContext<EditAssetFormData>()

  const handleBlur = () => {
    if (isEditing) return

    const newValue = getValues('name')?.trim()
    const oldValue = initialValue?.trim()

    if (!newValue || newValue === oldValue) {
      setInternalEditing(null)
      return
    }

    handleUpdate?.({ name: newValue })
    setInternalEditing(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const handleDoubleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing('name')
    }
  }

  useEscapeKey(
    () => {
      if (internalEditing === 'name' && initialValue) {
        setValue('name', initialValue)
        setInternalEditing(null)
      }
    },
    { enabled: internalEditing === 'name' },
  )

  const isCurrentlyEditing = isEditing || internalEditing === 'name'

  return (
    <SheetTitle onDoubleClick={handleDoubleClick} className={isEditAllowed ? 'cursor-pointer w-fit' : 'cursor-not-allowed'}>
      {isCurrentlyEditing ? (
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-80">
              <div className="flex items-center">
                <FormLabel>Name</FormLabel>
                <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a descriptive name of the asset</p>} />
              </div>
              <FormControl>
                <Input {...field} variant="medium" className="w-full" onBlur={handleBlur} onKeyDown={handleKeyDown} autoFocus />
              </FormControl>
              {formState.errors.name && <p className="text-red-500 text-sm">{formState.errors.name.message}</p>}
            </FormItem>
          )}
        />
      ) : (
        <HoverPencilWrapper className={'pr-5'} showPencil={isEditAllowed} onPencilClick={handleDoubleClick}>
          {initialValue || 'No name'}
        </HoverPencilWrapper>
      )}
    </SheetTitle>
  )
}

export default NameField
