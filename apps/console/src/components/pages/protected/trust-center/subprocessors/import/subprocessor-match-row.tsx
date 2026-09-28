'use client'

import React, { useId } from 'react'
import { Check, Pencil } from 'lucide-react'
import { Badge, type BadgeProps } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { CountryDropdown } from '@repo/ui/country-dropdown'
import { TableCell, TableRow } from '@repo/ui/table'
import { type Option } from '@repo/ui/multiple-selector'
import { cn } from '@repo/ui/lib/utils'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { VendorLogo } from '@/components/shared/vendor-logo/vendor-logo'
import { toFileRowNumber } from '@/components/shared/record-import/lib/validate-mapping'
import { CREATE_TARGET, isActiveRow, logoPreviewUrl, SKIP_TARGET, type TResolvedRow, type TRowEdit, type TRowStatus } from './subprocessor-import-rows'

const STATUS_BADGES: Record<TRowStatus, { label: string; variant: BadgeProps['variant'] }> = {
  matched: { label: 'Matched', variant: 'green' },
  suggested: { label: 'Suggested', variant: 'blue' },
  new: { label: 'New', variant: 'purple' },
  linked: { label: 'Already added', variant: 'outline' },
  duplicate: { label: 'Duplicate', variant: 'outline' },
  skipped: { label: 'Skipped', variant: 'outline' },
}

const STATUS_HINTS: Partial<Record<TRowStatus, string>> = {
  linked: 'Already in your Trust Center',
  duplicate: 'Another row already adds this subprocessor',
  skipped: 'This row will not be imported',
}

const targetValue = (row: TResolvedRow): string => {
  if (row.status === 'skipped') return SKIP_TARGET
  return row.subprocessor?.id ?? CREATE_TARGET
}

type TSubprocessorMatchRowProps = {
  row: TResolvedRow
  targetOptions: Option[]
  categoryOptions: CustomTypeEnumOption[]
  canCreateCategory: boolean
  onChange: (rowIndex: number, patch: TRowEdit) => void
  onEditDetails: (row: TResolvedRow) => void
}

const MatchRow: React.FC<TSubprocessorMatchRowProps> = ({ row, targetOptions, categoryOptions, canCreateCategory, onChange, onEditDetails }) => {
  const { rowIndex, name } = row.source
  const isActive = isActiveRow(row)
  const badge = STATUS_BADGES[row.status]
  const hint = STATUS_HINTS[row.status]
  const update = (patch: TRowEdit) => onChange(rowIndex, patch)
  const fileRow = toFileRowNumber(rowIndex)
  const categoryId = useId()

  return (
    <TableRow className={cn(!isActive && 'opacity-60')}>
      <TableCell className="text-muted-foreground tabular-nums">{fileRow}</TableCell>
      <TableCell>
        <p className="break-words">{name || <span className="text-muted-foreground">No name</span>}</p>
        {row.details.website && <p className="truncate text-xs text-muted-foreground">{row.details.website}</p>}
      </TableCell>
      <TableCell>
        <div className="flex min-w-[240px] flex-col gap-2">
          <SearchableSingleSelect
            ariaLabel={`Subprocessor for row ${fileRow}`}
            value={targetValue(row)}
            options={targetOptions}
            disabled={!name}
            onChange={(target) => update({ target, confirmed: true })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            {row.status === 'suggested' && (
              <Button variant="link" className="text-blue-500" icon={<Check size={14} />} iconPosition="left" onClick={() => update({ confirmed: true })}>
                Confirm
              </Button>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex min-w-[200px] flex-col gap-1">
          <CountryDropdown
            ariaLabel={`Countries for row ${fileRow}`}
            value={row.countries}
            onChange={(countries) => update({ countries: countries.length > 0 ? countries : undefined })}
            disabled={!isActive}
            placeholder="Select countries"
          />
          {row.unresolvedCountries.length > 0 && <p className="text-xs text-destructive">Not recognised: {row.unresolvedCountries.join(', ')}</p>}
          {isActive && row.countriesFromDefault && row.countries.length > 0 && <p className="text-xs text-muted-foreground">From defaults</p>}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex min-w-[180px] flex-col gap-1">
          <label htmlFor={categoryId} className="sr-only">
            Category for row {fileRow}
          </label>
          <CreatableCustomTypeEnumSelect
            triggerId={categoryId}
            value={row.category}
            options={categoryOptions}
            allowCreate={canCreateCategory}
            disabled={!isActive}
            placeholder="Select category"
            searchPlaceholder="Search category..."
            onValueChange={(category) => update({ category })}
          />
          {isActive && row.categoryFromDefault && row.category && <p className="text-xs text-muted-foreground">From defaults</p>}
        </div>
      </TableCell>
      <TableCell>
        {row.status === 'new' ? (
          <div className="flex items-center gap-2">
            <VendorLogo name={name} logoUrl={logoPreviewUrl(row.logo)} />
            <Button variant="icon" size="icon-sm" descriptiveTooltipText={`Edit details for ${name}`} onClick={() => onEditDetails(row)}>
              <Pencil size={16} />
            </Button>
            {row.logo.state === 'invalid' && <span className="text-xs text-destructive">Invalid logo URL</span>}
            {row.logo.state === 'none' && <span className="text-xs text-muted-foreground">Add a website for a logo</span>}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  )
}

const rowSignature = ({ source: _source, subprocessor, ...rest }: TResolvedRow): string => JSON.stringify({ subprocessorId: subprocessor?.id, ...rest })

const arePropsEqual = (previous: TSubprocessorMatchRowProps, next: TSubprocessorMatchRowProps): boolean =>
  previous.row.source === next.row.source &&
  previous.targetOptions === next.targetOptions &&
  previous.categoryOptions === next.categoryOptions &&
  previous.canCreateCategory === next.canCreateCategory &&
  previous.onChange === next.onChange &&
  previous.onEditDetails === next.onEditDetails &&
  rowSignature(previous.row) === rowSignature(next.row)

export const SubprocessorMatchRow = React.memo(MatchRow, arePropsEqual)
