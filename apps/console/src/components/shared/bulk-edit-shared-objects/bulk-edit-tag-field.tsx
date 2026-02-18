'use client'

import { useState } from 'react'
import { Control, Controller } from 'react-hook-form'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { BulkEditDialogFormValues } from './bulk-edit-shared-objects'

interface BulkEditTagFieldProps {
  control: Control<BulkEditDialogFormValues>
  index: number
  placeholder?: string
}

export const BulkEditTagField: React.FC<BulkEditTagFieldProps> = ({ control, index, placeholder }) => {
  const [tagValues, setTagValues] = useState<Option[]>([])
  const { tagOptions } = useGetTags()

  return (
    <div className="flex flex-col items-center gap-2">
      <Controller
        control={control}
        name={`fieldsArray.${index}.selectedValue`}
        render={({ field }) => (
          <MultipleSelector
            options={tagOptions}
            placeholder={placeholder ?? 'Add tag...'}
            creatable
            value={tagValues}
            onChange={(selectedOptions) => {
              const values = selectedOptions.map((option) => option.value)
              field.onChange(values)
              setTagValues(
                selectedOptions.map((item) => ({
                  value: item.value,
                  label: item.label,
                })),
              )
            }}
            className="max-w-[300px]"
          />
        )}
      />
    </div>
  )
}
