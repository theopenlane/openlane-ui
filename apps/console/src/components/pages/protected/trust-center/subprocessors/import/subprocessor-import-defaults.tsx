'use client'

import React, { useId } from 'react'
import { CountryDropdown } from '@repo/ui/country-dropdown'
import { Label } from '@repo/ui/label'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { type TSubprocessorImportState } from './use-subprocessor-import'

type TSubprocessorImportDefaultsProps = {
  state: Pick<TSubprocessorImportState, 'defaults' | 'setDefaults' | 'canCreateCategory' | 'unrecognisedCountryValues' | 'countryValueMap' | 'mapCountryValue'>
  categoryOptions: CustomTypeEnumOption[]
}

export const SubprocessorImportDefaults: React.FC<TSubprocessorImportDefaultsProps> = ({ state, categoryOptions }) => {
  const { defaults, setDefaults, canCreateCategory, unrecognisedCountryValues, countryValueMap, mapCountryValue } = state
  const categoryId = useId()

  return (
    <section className="rounded-lg border bg-card p-4" aria-labelledby="subprocessor-import-defaults">
      <h3 id="subprocessor-import-defaults" className="text-sm font-medium">
        Defaults for rows without a value
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">Applied to every row whose file has no countries or no category. You can still change any row below.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-sm font-medium">Countries</span>
          <CountryDropdown ariaLabel="Default countries" value={defaults.countries} onChange={(countries) => setDefaults((current) => ({ ...current, countries }))} placeholder="Select countries" />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor={categoryId}>Category</Label>
          <CreatableCustomTypeEnumSelect
            triggerId={categoryId}
            value={defaults.category}
            options={categoryOptions}
            allowCreate={canCreateCategory}
            clearable
            placeholder="Select category"
            searchPlaceholder="Search category..."
            onValueChange={(category) => setDefaults((current) => ({ ...current, category }))}
          />
        </div>
      </div>

      {unrecognisedCountryValues.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium">Unrecognised countries</h4>
          <p className="mb-3 text-xs text-muted-foreground">These values in your file are not countries. Choose the countries each one stands for, and every row using it is updated.</p>
          <div className="flex flex-col gap-2">
            {unrecognisedCountryValues.map((value) => (
              <div key={value} className="grid items-center gap-2 sm:grid-cols-[minmax(120px,200px)_minmax(0,1fr)]">
                <span className="truncate font-mono text-sm">{value}</span>
                <CountryDropdown
                  ariaLabel={`Countries for "${value}"`}
                  value={[...(countryValueMap[value] ?? [])]}
                  onChange={(countries) => mapCountryValue(value, countries)}
                  placeholder="Select countries"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
