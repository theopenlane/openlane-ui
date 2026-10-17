'use client'

import React from 'react'
import { CountryDropdown } from '@repo/ui/country-dropdown'
import { SubprocessorListingDefaults } from '@/components/pages/protected/trust-center/shared/subprocessor-listing-defaults'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { type TSubprocessorImportState } from './use-subprocessor-import'

type TSubprocessorImportDefaultsProps = {
  state: Pick<TSubprocessorImportState, 'defaults' | 'setDefaults' | 'canCreateCategory' | 'unrecognisedCountryValues' | 'countryValueMap' | 'mapCountryValue'>
  categoryOptions: CustomTypeEnumOption[]
}

export const SubprocessorImportDefaults: React.FC<TSubprocessorImportDefaultsProps> = ({ state, categoryOptions }) => {
  const { defaults, setDefaults, canCreateCategory, unrecognisedCountryValues, countryValueMap, mapCountryValue } = state

  return (
    <SubprocessorListingDefaults
      title="Defaults for rows without a value"
      description="Applied to every row whose file has no countries or no category. You can still change any row below."
      defaults={defaults}
      onChange={setDefaults}
      categoryOptions={categoryOptions}
      canCreateCategory={canCreateCategory}
    >
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
    </SubprocessorListingDefaults>
  )
}
