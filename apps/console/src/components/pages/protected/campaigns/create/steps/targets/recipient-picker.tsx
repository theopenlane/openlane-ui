'use client'

import React, { useMemo } from 'react'
import { LoaderCircle, SearchIcon, UserPlus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { normalizeEmail } from '@/lib/validators'
import { BULK_ADD_LIMIT, type CampaignTargetEntry } from './target-entry'

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
  totalCount: number
  targets: CampaignTargetEntry[]
  onToggle: (option: RecipientOption) => void
  onAddAll: () => void
  isAddingAll: boolean
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
  totalCount,
  targets,
  onToggle,
  onAddAll,
  isAddingAll,
  emptyLabel,
}) => {
  const selectedEmails = useMemo(() => new Set(targets.map((target) => normalizeEmail(target.email))), [targets])

  const addAllCount = Math.min(totalCount, BULK_ADD_LIMIT)
  const addAllLabel = totalCount > BULK_ADD_LIMIT ? `Add first ${addAllCount} of ${totalCount}` : `Add all ${totalCount}`

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
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
        <Input
          className="w-64 bg-transparent"
          icon={<SearchIcon size={16} />}
          iconPosition="left"
          variant="searchTable"
          placeholder={searchPlaceholder}
          value={searchText}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
        />
        <Button
          variant="secondary"
          type="button"
          className="ml-auto"
          icon={isAddingAll ? <LoaderCircle size={16} className="animate-spin" /> : <UserPlus size={16} />}
          iconPosition="left"
          onClick={onAddAll}
          disabled={isAddingAll || isLoading || totalCount === 0}
        >
          {isAddingAll ? 'Adding...' : addAllLabel}
        </Button>
      </div>

      <div className="h-80 overflow-y-auto rounded-md border border-border">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoaderCircle className="animate-spin text-muted-foreground" size={20} />
          </div>
        ) : options.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{emptyLabel}</div>
        ) : (
          <ul>
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selectedEmails.has(normalizeEmail(option.email))}
                  onClick={() => onToggle(option)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
                >
                  <Checkbox checked={selectedEmails.has(normalizeEmail(option.email))} className="pointer-events-none shrink-0" tabIndex={-1} aria-hidden />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">{option.name || option.email}</span>
                    <span className="truncate text-xs text-muted-foreground">{option.email}</span>
                  </span>
                  {option.meta && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{option.meta}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
