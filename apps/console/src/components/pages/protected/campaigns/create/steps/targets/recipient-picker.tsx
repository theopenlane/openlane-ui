'use client'

import React, { useId, useMemo } from 'react'
import { SearchIcon } from 'lucide-react'
import { type ColumnDef } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type TPagination, type TPaginationMeta } from '@repo/ui/pagination-types'
import { cn } from '@repo/ui/lib/utils'
import { normalizeEmail } from '@/lib/validators'
import { EMPTY_EMAIL_KEYS, getRecipientDisplayName, type CampaignTargetEntry } from './target-entry'
import { type RecipientOption } from './recipient-option'

interface RecipientPickerFilter {
  label: string
  value: string
  options: Array<{ label: string; value: string; icon?: React.ReactNode }>
  onChange: (value: string) => void
}

interface RecipientPickerProps {
  filters: RecipientPickerFilter[]
  searchText: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  options: RecipientOption[]
  isLoading: boolean
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  paginationMeta: TPaginationMeta
  targets: CampaignTargetEntry[]
  lockedEmails?: ReadonlySet<string>
  onToggle: (option: RecipientOption) => void
  onToggleAll: (options: RecipientOption[], nextChecked: boolean) => void
  emptyLabel: string
  note?: string
}

export const RecipientPicker: React.FC<RecipientPickerProps> = ({
  filters,
  searchText,
  onSearchChange,
  searchPlaceholder,
  options,
  isLoading,
  pagination,
  onPaginationChange,
  paginationMeta,
  targets,
  lockedEmails = EMPTY_EMAIL_KEYS,
  onToggle,
  onToggleAll,
  emptyLabel,
  note,
}) => {
  const baseId = useId()
  const selectedEmails = useMemo(() => new Set(targets.map((target) => normalizeEmail(target.email))), [targets])
  const selectableOptions = useMemo(() => options.filter((option) => !lockedEmails.has(normalizeEmail(option.email))), [options, lockedEmails])
  const allOnPageSelected = selectableOptions.length > 0 && selectableOptions.every((option) => selectedEmails.has(normalizeEmail(option.email)))
  const someOnPageSelected = selectableOptions.some((option) => selectedEmails.has(normalizeEmail(option.email)))

  const columns = useMemo<ColumnDef<RecipientOption>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={allOnPageSelected ? true : someOnPageSelected ? 'indeterminate' : false}
            disabled={selectableOptions.length === 0}
            onCheckedChange={() => onToggleAll(selectableOptions, !allOnPageSelected)}
          />
        ),
        cell: ({ row }) => {
          const locked = lockedEmails.has(normalizeEmail(row.original.email))
          return <Checkbox checked={locked || selectedEmails.has(normalizeEmail(row.original.email))} disabled={locked} onCheckedChange={() => onToggle(row.original)} />
        },
        size: 40,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const displayName = getRecipientDisplayName(row.original.name, row.original.email)
          return (
            <div className="flex min-w-0 flex-col">
              {displayName && <span className="truncate text-sm">{displayName}</span>}
              <span className={cn('truncate', displayName ? 'text-xs text-muted-foreground' : 'text-sm')}>{row.original.email}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'meta',
        header: 'Meta',
        cell: ({ row }) =>
          lockedEmails.has(normalizeEmail(row.original.email)) ? (
            <span className="text-xs text-muted-foreground">Already added</span>
          ) : row.original.meta ? (
            <span className="text-xs text-muted-foreground">{row.original.meta}</span>
          ) : null,
        size: 140,
      },
    ],
    [selectableOptions, allOnPageSelected, someOnPageSelected, selectedEmails, lockedEmails, onToggle, onToggleAll],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {filters.map((filter, index) => {
          const filterId = `${baseId}-${index}`
          return (
            <div key={filter.label} className="flex min-w-40 flex-1 flex-col gap-1.5">
              <label htmlFor={filterId} className="text-sm font-medium">
                {filter.label}
              </label>
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger id={filterId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex min-w-0 items-center gap-2">
                        {option.icon}
                        <span className="truncate">{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
        <Input className="w-64" icon={<SearchIcon size={16} />} iconPosition="left" placeholder={searchPlaceholder} value={searchText} onChange={(e) => onSearchChange(e.currentTarget.value)} />
      </div>

      {note && <p className="text-xs text-muted-foreground">{note}</p>}

      <DataTable
        columns={columns}
        data={options}
        tableKey={undefined}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        paginationMeta={paginationMeta}
        noResultsText={emptyLabel}
      />
    </div>
  )
}
