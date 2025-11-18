'use client'

import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { useFormContext } from 'react-hook-form'

type Option = { label: string; value: string }

export const SubprocessorSelectField = ({ options, isEditing }: { options: Option[]; isEditing: boolean }) => {
  const { control, getValues } = useFormContext()

  const currentValue = getValues('subprocessorID')
  const currentLabel = options.find((o) => o.value === currentValue)?.label ?? '—'

  return (
    <FormField
      control={control}
      name="subprocessorID"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Subprocessor</FormLabel>

          <FormControl>
            {isEditing ? (
              <SearchableSingleSelect width={300} options={options} placeholder="Select subprocessor" value={field.value ?? ''} onChange={field.onChange} />
            ) : (
              <div className="text-sm text-foreground py-2">{currentLabel}</div>
            )}
          </FormControl>
        </FormItem>
      )}
    />
  )
}
