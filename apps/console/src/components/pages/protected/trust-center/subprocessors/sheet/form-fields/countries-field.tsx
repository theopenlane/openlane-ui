'use client'

import { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'

const countryOptions = [
  { label: 'United States', value: 'US' },
  { label: 'Germany', value: 'DE' },
  { label: 'United Kingdom', value: 'UK' },
  { label: 'France', value: 'FR' },
  { label: 'Netherlands', value: 'NL' },
]

export const CountriesField = ({ isEditing }: { isEditing: boolean }) => {
  const { control, getValues } = useFormContext()

  // Convert RHF default values (array of "US", "DE") → [{value,label}]
  const initialValues = useMemo(() => {
    const stored = (getValues('countries') as string[] | undefined) ?? []
    return stored.map((val) => ({
      value: val,
      label: countryOptions.find((opt) => opt.value === val)?.label ?? val,
    }))
  }, [getValues])

  const [selectedValues, setSelectedValues] = useState<Option[]>(initialValues)

  return (
    <FormField
      control={control}
      name="countries"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Countries</FormLabel>
          <FormControl>
            <MultipleSelector
              className="w-full"
              placeholder="Select countries"
              value={selectedValues}
              onChange={(selected) => {
                setSelectedValues(selected)
                field.onChange(selected.map((item) => item.value))
              }}
              options={countryOptions}
              disabled={!isEditing}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
