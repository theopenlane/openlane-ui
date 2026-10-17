'use client'

import React, { useId } from 'react'
import { CountryDropdown } from '@repo/ui/country-dropdown'
import { Label } from '@repo/ui/label'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'

export type TSubprocessorListingDefaults = { countries: string[]; category: string }

type TSubprocessorListingDefaultsProps = {
  title: string
  description: string
  defaults: TSubprocessorListingDefaults
  onChange: React.Dispatch<React.SetStateAction<TSubprocessorListingDefaults>>
  categoryOptions: CustomTypeEnumOption[]
  canCreateCategory: boolean
  children?: React.ReactNode
}

export const SubprocessorListingDefaults: React.FC<TSubprocessorListingDefaultsProps> = ({ title, description, defaults, onChange, categoryOptions, canCreateCategory, children }) => {
  const headingId = useId()
  const categoryId = useId()

  return (
    <section className="rounded-lg border bg-card p-4" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-sm font-medium">
        {title}
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-sm font-medium">Countries</span>
          <CountryDropdown ariaLabel="Default countries" value={defaults.countries} onChange={(countries) => onChange((current) => ({ ...current, countries }))} placeholder="Select countries" />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor={categoryId} className="text-sm font-medium">
            Category
          </Label>
          <CreatableCustomTypeEnumSelect
            triggerId={categoryId}
            value={defaults.category}
            options={categoryOptions}
            allowCreate={canCreateCategory}
            clearable
            placeholder="Select category"
            searchPlaceholder="Search category..."
            onValueChange={(category) => onChange((current) => ({ ...current, category }))}
          />
        </div>
      </div>
      {children}
    </section>
  )
}
