'use client'

import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import { CountryDropdown } from '@repo/ui/country-dropdown'

export const CountriesField = ({ isEditing }: { isEditing: boolean }) => {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name="countries"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Countries</FormLabel>
          <FormControl>
            <CountryDropdown value={field.value ?? []} onChange={field.onChange} disabled={!isEditing} placeholder="Select countries" />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
