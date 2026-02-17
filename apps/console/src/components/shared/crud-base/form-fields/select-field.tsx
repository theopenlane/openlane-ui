'use client'

import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FieldValues, useFormContext } from 'react-hook-form'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { InternalEditingType } from '../generic-sheet'

interface SelectFieldProps {
  name: string
  label: string
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Array<{ value: string; label: string; [key: string]: any }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleUpdate?: (input: any) => Promise<void>
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  onCreateOption?: (value: string) => Promise<void>
  useCustomDisplay?: boolean
}

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  isEditing,
  isEditAllowed,
  isCreate = false,
  data,
  options,
  handleUpdate,
  internalEditing,
  setInternalEditing,
  onCreateOption,
  useCustomDisplay = true,
}) => {
  const { control } = useFormContext()
  const rawValue = data?.[name]
  const [showCreateInput, setShowCreateInput] = useState(false)
  const [newValue, setNewValue] = useState('')

  const isFieldEditing = internalEditing === name
  const shouldShowInput = isCreate || isEditing || isFieldEditing

  // Find the display label for the current value
  const displayValue = options.find((opt) => opt.value === rawValue)?.label || rawValue

  const handleCreate = async () => {
    if (newValue.trim() && onCreateOption) {
      await onCreateOption(newValue.trim())
      setNewValue('')
      setShowCreateInput(false)
    }
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {shouldShowInput ? (
              <Select
                value={field.value}
                onValueChange={async (val) => {
                  field.onChange(val)
                  if (handleUpdate) {
                    await Promise.resolve(handleUpdate({ [name]: val }))
                  }
                  setInternalEditing(null)
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {useCustomDisplay ? (
                        <CustomTypeEnumValue value={field.value} options={options} placeholder="Select" />
                      ) : (
                        <span>{options.find((opt) => opt.value === field.value)?.label || 'Select'}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {useCustomDisplay ? <CustomTypeEnumOptionChip option={o} /> : <span>{o.label}</span>}
                    </SelectItem>
                  ))}

                  {onCreateOption && (
                    <>
                      <div className="border-t my-1" />
                      {showCreateInput ? (
                        <div className="flex gap-2 p-2">
                          <Input
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="Enter new value"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreate()
                              }
                            }}
                          />
                          <Button size="sm" onClick={handleCreate}>
                            Add
                          </Button>
                        </div>
                      ) : (
                        <Button variant="transparent" className="w-full justify-start" onClick={() => setShowCreateInput(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create new
                        </Button>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <div
                className="text-sm py-2 rounded cursor-pointer hover:bg-accent"
                onClick={() => {
                  if (isEditAllowed) {
                    setInternalEditing(name)
                  }
                }}
              >
                {displayValue || <span className="text-muted-foreground italic">Not set</span>}
              </div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}
