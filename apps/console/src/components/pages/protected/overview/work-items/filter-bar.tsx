import React from 'react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import type { FilterKey, GroupBy, WorkItemFilter } from './types'

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
      <Button size="sm" variant="tag" className={cn('font-normal', groupBy === 'type' && 'is-active')} onClick={() => onGroupByChange('type')}>
        Type
      </Button>
      <Button size="sm" variant="tag" className={cn('font-normal', groupBy === 'kind' && 'is-active')} onClick={() => onGroupByChange('kind')}>
        Kind
      </Button>
    </div>
  </div>
)

export default FilterBar
