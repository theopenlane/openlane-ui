import React from 'react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { GROUP_BY_OPTIONS, type FilterKey, type GroupBy, type WorkItemFilter } from './types'

type FilterBarProps = {
  filters: WorkItemFilter[]
  activeFilter: FilterKey
  onFilterChange: (filter: FilterKey) => void
  groupBy: GroupBy
  onGroupByChange: (groupBy: GroupBy) => void
}

const FilterBar = ({ filters, activeFilter, onFilterChange, groupBy, onGroupByChange }: FilterBarProps) => (
  <div className="px-6 pb-4 flex items-center justify-between gap-2 flex-wrap">
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button key={filter.key} size="sm" variant="tag" className={cn('font-normal', activeFilter === filter.key && 'is-active')} onClick={() => onFilterChange(filter.key)}>
          {filter.label}
        </Button>
      ))}
    </div>
    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
      Group by
      {GROUP_BY_OPTIONS.map((option) => (
        <Button key={option.value} size="sm" variant="tag" className={cn('font-normal', groupBy === option.value && 'is-active')} onClick={() => onGroupByChange(option.value)}>
          {option.label}
        </Button>
      ))}
    </div>
  </div>
)

export default FilterBar
