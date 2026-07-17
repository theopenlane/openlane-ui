'use client'

import React, { useMemo } from 'react'
import { SearchIcon } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type TPagination, type TPaginationMeta } from '@repo/ui/pagination-types'
import { normalizeEmail } from '@/lib/validators'
import { type CampaignTargetEntry } from './target-entry'

export interface RecipientOption {
  id: string
  email: string
  name: string
  meta?: string
}

interface RecipientPickerProps {
  scopeLabel: string
  scopeValue: string
  scopeOptions: Array<{ label: string; value: string }>
  onScopeChange: (value: string) => void
  searchText: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  options: RecipientOption[]
  isLoading: boolean
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  paginationMeta: TPaginationMeta
  targets: CampaignTargetEntry[]
  onToggle: (option: RecipientOption) => void
  onToggleAll: (options: RecipientOption[], nextChecked: boolean) => void
  emptyLabel: string
}

export const RecipientPicker: React.FC<RecipientPickerProps> = ({
  scopeLabel,
  scopeValue,
  scopeOptions,
  onScopeChange,
  searchText,
  onSearchChange,
  searchPlaceholder,
  options,
  isLoading,
  pagination,
  onPaginationChange,
  paginationMeta,
  targets,
  onToggle,
  onToggleAll,
  emptyLabel,
}) => {
  const selectedEmails = useMemo(() => new Set(targets.map((target) => normalizeEmail(target.email))), [targets])
  const allOnPageSelected = options.length > 0 && options.every((option) => selectedEmails.has(normalizeEmail(option.email)))
  const someOnPageSelected = options.some((option) => selectedEmails.has(normalizeEmail(option.email)))

  const columns = useMemo<ColumnDef<RecipientOption>[]>(
    () => [
      {
        id: 'select',
        header: () => <Checkbox checked={allOnPageSelected ? true : someOnPageSelected ? 'indeterminate' : false} onCheckedChange={() => onToggleAll(options, !allOnPageSelected)} />,
        cell: ({ row }) => <Checkbox checked={selectedEmails.has(normalizeEmail(row.original.email))} onCheckedChange={() => onToggle(row.original)} />,
        size: 40,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm">{row.original.name || row.original.email}</span>
            <span className="truncate text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: 'meta',
        header: 'Meta',
        cell: ({ row }) => (row.original.meta ? <span className="text-xs text-muted-foreground">{row.original.meta}</span> : null),
        size: 140,
      },
    ],
    [options, allOnPageSelected, someOnPageSelected, selectedEmails, onToggle, onToggleAll],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{scopeLabel}</label>
          <Select value={scopeValue} onValueChange={onScopeChange}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input className="w-64" icon={<SearchIcon size={16} />} iconPosition="left" placeholder={searchPlaceholder} value={searchText} onChange={(e) => onSearchChange(e.currentTarget.value)} />
      </div>

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
