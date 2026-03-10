'use client'

import { type Control, Controller, type FieldPathByValue } from 'react-hook-form'
import MultipleSelector from '@repo/ui/multiple-selector'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

interface BulkEditTagFieldFormValues {
  fieldsArray: Array<{
    selectedValue?: string | string[]
  }>
}

interface BulkEditTagFieldProps<T extends BulkEditTagFieldFormValues, TName extends FieldPathByValue<T, string | string[] | undefined>> {
  control: Control<T>
  name: TName
  placeholder?: string
}

export const BulkEditTagField = <T extends BulkEditTagFieldFormValues, TName extends FieldPathByValue<T, string | string[] | undefined>>({
  control,
  name,
  placeholder,
}: BulkEditTagFieldProps<T, TName>) => {
  const { tagOptions } = useGetTags()

  return (
    <div className="flex flex-col items-center gap-2">
      <Controller<T, TName>
        control={control}
        name={name}
        render={({ field }) => {
          const selectedOptions = Array.isArray(field.value)
            ? (field.value as unknown[])
                .filter((value): value is string => typeof value === 'string')
                .map((value) => tagOptions.find((tagOption) => tagOption.value === value) ?? { label: value, value })
            : []

          return (
            <MultipleSelector
              options={tagOptions}
              placeholder={placeholder ?? 'Add tag...'}
              creatable
              value={selectedOptions}
              onChange={(selectedOptions) => {
                field.onChange(selectedOptions.map((option) => option.value))
              }}
              className="max-w-[300px]"
            />
          )
        }}
      />
    </div>
  )
}
