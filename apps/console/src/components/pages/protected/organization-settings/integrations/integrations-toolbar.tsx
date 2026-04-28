import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { Check, Search } from 'lucide-react'
import React from 'react'
import { type IntegrationTab } from '@/lib/integrations/types'

type Props = {
  activeTab: IntegrationTab
  setActiveTab: (tab: IntegrationTab) => void
  allCount: number
  comingSoonCount: number
  installedCount: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  allTags: string[]
  selectedTags: string[]
  setSelectedTags: (tags: string[]) => void
}

const IntegrationsToolbar = ({ activeTab, setActiveTab, allCount, comingSoonCount, installedCount, searchQuery, setSearchQuery, allTags, selectedTags, setSelectedTags }: Props) => {
  const value = activeTab === 'Coming Soon' ? 'coming-soon' : activeTab.toLowerCase()

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
        <Tabs
          variant="underline"
          value={value}
          onValueChange={(val) => {
            if (val === 'installed') {
              setActiveTab('Installed')
              return
            }
            if (val === 'coming-soon') {
              setActiveTab('Coming Soon')
              return
            }
            setActiveTab('All')
          }}
        >
          <TabsList className="w-max gap-2">
            <TabsTrigger value="all" className="px-2">
              {`All (${allCount})`}
            </TabsTrigger>
            <TabsTrigger value="coming-soon" className="px-2">
              {`Coming Soon (${comingSoonCount})`}
            </TabsTrigger>
            <TabsTrigger value="installed" className="px-2">
              {`Installed (${installedCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Filter by tag:</span>
          {allTags.map((tag) => {
            const selected = selectedTags.includes(tag)
            return (
              <button key={tag} onClick={() => toggleTag(tag)} type="button">
                <Badge
                  variant="outline"
                  className={`cursor-pointer gap-1 transition-colors ${selected ? 'bg-primary/20 text-primary-foreground border-primary/20 hover:bg-primary/50' : 'hover:bg-primary/20'}`}
                >
                  {selected && <Check size={10} strokeWidth={3} />}
                  {tag}
                </Badge>
              </button>
            )
          })}
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
