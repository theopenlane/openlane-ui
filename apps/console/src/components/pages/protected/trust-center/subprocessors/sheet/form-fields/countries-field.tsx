'use client'

import { useFormContext } from 'react-hook-form'
import { FormField, FormItem, FormControl, FormLabel } from '@repo/ui/form'
import { CountryDropdown } from '@repo/ui/country-dropdown'
import { CountryFlag } from '@repo/ui/country-flag'

export const CountriesField = ({ isEditing }: { isEditing: boolean }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext()

  return (
    <FormField
      control={control}
      name="countries"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Countries</FormLabel>

          {isEditing ? (
            <>
              <FormControl>
                <CountryDropdown value={field.value ?? []} onChange={field.onChange} disabled={!isEditing} placeholder="Select countries" />
              </FormControl>

              {errors.countries && <p className="text-red-500 text-sm mt-1">{String(errors.countries.message)}</p>}
            </>
          ) : (
            <div className="flex items-center gap-1 flex-wrap mt-2">
              {(field.value ?? []).length > 0 ? field.value.map((iso3: string) => <CountryFlag key={iso3} value={iso3} showLabel />) : <span className="text-muted-foreground">—</span>}
            </div>
          )}
        </FormItem>
      )}
    />
  )
}
