'use client'

import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import { CountryDropdown } from '@repo/ui/country-dropdown'
import { CountryFlag } from '@repo/ui/country-flag'

export const CountriesField = ({ isEditing }: { isEditing: boolean }) => {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name="countries"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Countries</FormLabel>
          {isEditing ? (
            <FormControl>
              <CountryDropdown value={field.value ?? []} onChange={field.onChange} disabled={!isEditing} placeholder="Select countries" />
            </FormControl>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {field.value.map((iso3: string) => (
                <CountryFlag key={iso3} value={iso3} showLabel />
              ))}
            </div>
          )}
        </FormItem>
      )}
    />
  )
}
