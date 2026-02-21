import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Input } from '@repo/ui/input'
import { Search } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { IntegrationTab } from './config'

type Props = {
  activeTab: IntegrationTab
  setActiveTab: (tab: IntegrationTab) => void
  allCount: number
  comingSoonCount: number
  installedCount: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  typeaheadOptions: string[]
}

const IntegrationsToolbar = ({ activeTab, setActiveTab, allCount, comingSoonCount, installedCount, searchQuery, setSearchQuery, typeaheadOptions }: Props) => {
  const value = activeTab === 'Coming Soon' ? 'coming-soon' : activeTab.toLowerCase()
  const [suggestionOpen, setSuggestionOpen] = useState(false)
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredSuggestions = useMemo(() => {
    if (normalizedQuery.length < 2) {
      return []
    }

    const unique = new Map<string, string>()

    for (const option of typeaheadOptions) {
      const normalizedOption = option.trim()
      if (!normalizedOption) {
        continue
      }
      if (!normalizedOption.toLowerCase().includes(normalizedQuery)) {
        continue
      }

      const key = normalizedOption.toLowerCase()
      if (!unique.has(key)) {
        unique.set(key, normalizedOption)
      }
    }

    return [...unique.values()].sort((a, b) => a.localeCompare(b)).slice(0, 8)
  }, [normalizedQuery, typeaheadOptions])

  return (
    <div className="my-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

      <div className="relative w-full md:w-[340px]">
        <Input
          variant="searchTable"
          icon={<Search size={16} className="text-muted-foreground" />}
          placeholder="Search integrations..."
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          onFocus={() => setSuggestionOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setSuggestionOpen(false), 150)
          }}
        />
        {suggestionOpen && filteredSuggestions.length > 0 ? (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
            {filteredSuggestions.map((option) => (
              <button
                key={option}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearchQuery(option)
                  setSuggestionOpen(false)
                }}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default IntegrationsToolbar
