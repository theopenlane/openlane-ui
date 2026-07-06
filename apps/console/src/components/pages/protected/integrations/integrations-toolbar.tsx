import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Search } from 'lucide-react'
import React from 'react'
import { type IntegrationStatusFilter } from '@/lib/integrations/types'

type Props = {
  statusFilter: IntegrationStatusFilter
  setStatusFilter: (status: IntegrationStatusFilter) => void
  allCount: number
  comingSoonCount: number
  installedCount: number
  notInstalledCount: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  allTags: string[]
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
}

const IntegrationsToolbar = ({
  statusFilter,
  setStatusFilter,
  allCount,
  comingSoonCount,
  installedCount,
  notInstalledCount,
  searchQuery,
  setSearchQuery,
  allTags,
  selectedTags,
  setSelectedTags,
}: Props) => {
  const statusOptions: { value: IntegrationStatusFilter; count: number }[] = [
    { value: 'All', count: allCount },
    { value: 'Installed', count: installedCount },
    { value: 'Not Installed', count: notInstalledCount },
    { value: 'Coming Soon', count: comingSoonCount },
  ]

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  return (
    <div className="my-3 flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {statusOptions.map(({ value, count }) => (
            <Button key={value} type="button" size="sm" variant="tag" className={statusFilter === value ? 'is-active' : ''} onClick={() => setStatusFilter(value)}>
              {value} ({count})
            </Button>
          ))}
        </div>

        <div className="flex flex-1 flex-row items-center gap-2 justify-end">
          <Input
            variant="searchTable"
            icon={<Search size={16} className="text-muted-foreground" />}
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Tags:</span>
          {allTags.map((tag) => (
            <Button key={tag} type="button" size="sm" variant="tag" className={selectedTags.includes(tag) ? 'is-active' : ''} onClick={() => toggleTag(tag)}>
              {tag}
            </Button>
          ))}
          {selectedTags.length > 0 && (
            <button onClick={() => setSelectedTags([])} type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default IntegrationsToolbar
