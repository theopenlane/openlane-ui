'use client'

import React from 'react'
import { type ColumnDef } from '@repo/ui/table-types'
import { Checkbox } from '@repo/ui/checkbox'
import { SELECT_COLUMN_ID } from '@repo/ui/pinned-columns'
import { CountryDropdown } from '@repo/ui/country-dropdown'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { VendorLogo } from '@/components/shared/vendor-logo/vendor-logo'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { type TVendorSubprocessorCandidate } from '@/lib/graphql-hooks/subprocessor'
import { getVendorLogoUrl } from '@/lib/vendor-logo'
import { type TVendorSubprocessorTarget, vendorSubprocessorName } from '@/components/pages/protected/trust-center/shared/vendor-subprocessor'
import { type TListingEdit, type TVendorRow } from './vendor-subprocessor-rows'

const LISTED_REASON = 'Already listed on your Trust Center.'

const LINK_SKIPPED_HINT = 'Not linked to the vendor: you do not have edit access to it.'

const TARGET_LABELS: Record<TVendorSubprocessorTarget['kind'], string> = {
  listed: 'Already listed',
  linked: 'Linked to this vendor',
  own: 'Existing subprocessor',
  catalog: 'Openlane catalog',
  new: 'New subprocessor',
}

const FieldProblem = ({ message }: { message?: string }) => (message ? <p className="text-xs text-destructive">{message}</p> : null)

type TColumnParams = {
  categoryOptions: CustomTypeEnumOption[]
  canCreateCategory: boolean
  disabled: boolean
  onSelect: (vendors: TVendorSubprocessorCandidate[], selected: boolean) => void
  onEdit: (vendorId: string, patch: TListingEdit) => void
}

export const getVendorSubprocessorColumns = ({ categoryOptions, canCreateCategory, disabled, onSelect, onEdit }: TColumnParams): ColumnDef<TVendorRow>[] => [
  {
    id: SELECT_COLUMN_ID,
    size: 48,
    minSize: 48,
    header: ({ table }) => {
      const shown = table
        .getRowModel()
        .rows.map((row) => row.original)
        .filter((row) => row.target.kind !== 'listed')
      const allSelected = shown.length > 0 && shown.every((row) => row.selected)

      return (
        <Checkbox
          aria-label="Select all vendors shown"
          checked={allSelected}
          disabled={disabled || shown.length === 0}
          onCheckedChange={(checked) =>
            onSelect(
              shown.map((row) => row.vendor),
              checked === true,
            )
          }
        />
      )
    },
    cell: ({ row }) => {
      const { vendor, target, selected } = row.original
      const isListed = target.kind === 'listed'

      return (
        <DisabledReasonTooltip reason={isListed ? LISTED_REASON : undefined}>
          <Checkbox aria-label={`Select ${vendorSubprocessorName(vendor)}`} checked={selected} disabled={disabled || isListed} onCheckedChange={(checked) => onSelect([vendor], checked === true)} />
        </DisabledReasonTooltip>
      )
    },
  },
  {
    id: 'vendor',
    header: 'Vendor',
    size: 260,
    minSize: 200,
    cell: ({ row }) => {
      const { vendor } = row.original
      const name = vendorSubprocessorName(vendor)

      return (
        <div className="flex min-w-0 items-center gap-3">
          <VendorLogo name={name} logoUrl={getVendorLogoUrl(vendor.logoFile)} />
          <span className="truncate">{name}</span>
        </div>
      )
    },
  },
  {
    id: 'target',
    header: 'Subprocessor',
    size: 240,
    minSize: 180,
    cell: ({ row }) => {
      const { target, linkSkipped, problems } = row.original

      return (
        <div className="flex min-w-0 flex-col gap-1">
          {target.kind === 'listed' || target.kind === 'new' ? (
            <span className="text-muted-foreground">{TARGET_LABELS[target.kind]}</span>
          ) : (
            <span className="truncate">
              {target.subprocessor.name} <span className="text-muted-foreground">({TARGET_LABELS[target.kind]})</span>
            </span>
          )}
          {linkSkipped && <p className="text-xs text-muted-foreground">{LINK_SKIPPED_HINT}</p>}
          <FieldProblem message={problems.subprocessor} />
        </div>
      )
    },
  },
  {
    id: 'countries',
    header: 'Countries',
    size: 260,
    minSize: 220,
    cell: ({ row }) => {
      const { vendor, selected, countries, problems } = row.original

      return (
        <div className="flex min-w-0 flex-col gap-1">
          <CountryDropdown
            ariaLabel={`Countries for ${vendorSubprocessorName(vendor)}`}
            value={countries}
            disabled={disabled || !selected}
            onChange={(next) => onEdit(vendor.id, { countries: next })}
            placeholder="Select countries"
          />
          <FieldProblem message={problems.countries} />
        </div>
      )
    },
  },
  {
    id: 'category',
    header: 'Category',
    size: 240,
    minSize: 200,
    cell: ({ row }) => {
      const { vendor, selected, category, categoryFromVendor, problems } = row.original
      const triggerId = `vendor-subprocessor-category-${vendor.id}`

      return (
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={triggerId} className="sr-only">
            Category for {vendorSubprocessorName(vendor)}
          </label>
          <CreatableCustomTypeEnumSelect
            triggerId={triggerId}
            value={category}
            options={categoryOptions}
            allowCreate={canCreateCategory}
            disabled={disabled || !selected}
            placeholder="Select category"
            searchPlaceholder="Search category..."
            onValueChange={(next) => onEdit(vendor.id, { category: next })}
          />
          {selected && categoryFromVendor && <p className="text-xs text-muted-foreground">From the vendor&apos;s services</p>}
          <FieldProblem message={problems.category} />
        </div>
      )
    },
  },
]
