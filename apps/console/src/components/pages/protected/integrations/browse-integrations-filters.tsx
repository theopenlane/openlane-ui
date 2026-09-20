import React from 'react'
import { type IntegrationStatusFilter } from '@/lib/integrations/types'
import IntegrationFilterChips, { type TIntegrationFilterChip } from './integration-filter-chips'

const STATUS_ORDER: IntegrationStatusFilter[] = ['All', 'Not Installed', 'Coming Soon']

type BrowseIntegrationsFiltersProps = {
  statusFilter: IntegrationStatusFilter
  setStatusFilter: (status: IntegrationStatusFilter) => void
  statusCounts: Record<IntegrationStatusFilter, number>
  allTags: string[]
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
}

const BrowseIntegrationsFilters = ({ statusFilter, setStatusFilter, statusCounts, allTags, selectedTags, setSelectedTags }: BrowseIntegrationsFiltersProps) => {
  const statusChips: TIntegrationFilterChip<IntegrationStatusFilter>[] = STATUS_ORDER.map((status) => ({ value: status, label: status, count: statusCounts[status] }))

  const toggleTag = (tag: string) => {
    setSelectedTags(selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag])
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Browse by category. Integrations may appear in more than one section.</p>
      <IntegrationFilterChips label="Status" chips={statusChips} isSelected={(value) => statusFilter === value} onSelect={setStatusFilter} />
      {allTags.length > 0 && (
        <IntegrationFilterChips
          label="Tags"
          chips={allTags.map((tag) => ({ value: tag, label: tag }))}
          isSelected={(tag) => selectedTags.includes(tag)}
          onSelect={toggleTag}
          onClear={selectedTags.length > 0 ? () => setSelectedTags([]) : undefined}
        />
      )}
    </div>
  )
}

export default BrowseIntegrationsFilters
