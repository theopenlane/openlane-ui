'use client'

import { useState } from 'react'
import { Check, ChevronDown, ListFilter } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@repo/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { cn } from '@repo/ui/lib/utils'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { toLowerLabel } from '@/utils/strings'
import { type TAssociationFilter, type TFilterOption } from './association-filters'

type TAssociationFilterProps = {
  filter: TAssociationFilter
  selected: TFilterOption[]
  onChange: (selected: TFilterOption[]) => void
}

const AssociationFilterOptions = ({ filter: { label, useOptions }, selected, onChange }: TAssociationFilterProps) => {
  const { searchText, setSearchText, term, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { options, meOption, isFetching, isError, isServerSearch } = useOptions(debouncedTerm)
  const isSearching = isServerSearch ? getIsSearching(isFetching) : isFetching && options.length === 0

  const matchesTerm = (option: TFilterOption) => option.label.toLowerCase().includes(term.toLowerCase())
  const listedOptions = isServerSearch ? (isSearching ? [] : options) : options.filter(matchesTerm)
  const visibleOptions = meOption && matchesTerm(meOption) ? [meOption, ...listedOptions] : listedOptions

  const loadedMessage = isError ? `Failed to load ${toLowerLabel(label)}. Please try again later.` : 'No results found.'
  const emptyMessage = isSearching ? 'Searching…' : loadedMessage

  const toggle = (option: TFilterOption) => {
    const isSelected = selected.some(({ value }) => value === option.value)
    onChange(isSelected ? selected.filter(({ value }) => value !== option.value) : [...selected, option])
  }

  return (
    <Command shouldFilter={false}>
      <CommandInput placeholder={`Search ${toLowerLabel(label)}`} value={searchText} onValueChange={setSearchText} searching={isSearching} />
      <CommandList aria-label={label}>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        <div className="p-1">
          {visibleOptions.map((option) => (
            <CommandItem key={option.value} value={option.value} onSelect={() => toggle(option)}>
              <Check className={cn('text-primary', !selected.some(({ value }) => value === option.value) && 'invisible')} />
              <span className="truncate">{option.label}</span>
            </CommandItem>
          ))}
        </div>
      </CommandList>
      {selected.length > 0 && (
        <div className="border-t p-2">
          <Button type="button" variant="link" onClick={() => onChange([])}>
            Clear
          </Button>
        </div>
      )}
    </Command>
  )
}

const AssociationFilterButton = (props: TAssociationFilterProps) => {
  const { filter, selected } = props
  const [open, setOpen] = useState(false)
  const isActive = selected.length > 0
  const summary = selected.length === 1 ? selected[0].label : `${selected.length} selected`

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn('h-8 max-w-60 px-2 overflow-hidden', isActive ? 'border-primary bg-primary/10' : 'border-dashed text-muted-foreground')}>
          <span className="flex min-w-0 items-center gap-1.5 text-sm">
            {isActive && <ListFilter size={14} className="shrink-0" />}
            <span className="truncate">{isActive ? `${filter.label}: ${summary}` : filter.label}</span>
            <ChevronDown size={14} className="shrink-0" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <AssociationFilterOptions {...props} />
      </PopoverContent>
    </Popover>
  )
}

export default AssociationFilterButton
