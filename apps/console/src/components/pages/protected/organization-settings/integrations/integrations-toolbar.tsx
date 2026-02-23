import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Input } from '@repo/ui/input'
import { Search } from 'lucide-react'
import React from 'react'
import { IntegrationTab } from './config'

type Props = {
  activeTab: IntegrationTab
  setActiveTab: (tab: IntegrationTab) => void
  allCount: number
  comingSoonCount: number
  installedCount: number
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const IntegrationsToolbar = ({ activeTab, setActiveTab, allCount, comingSoonCount, installedCount, searchQuery, setSearchQuery }: Props) => {
  const value = activeTab === 'Coming Soon' ? 'coming-soon' : activeTab.toLowerCase()

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

      <div className="grow flex flex-row items-center gap-2 md:max-w-[340px]">
        <Input
          variant="searchTable"
          icon={<Search size={16} className="text-muted-foreground" />}
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </div>
    </div>
  )
}

export default IntegrationsToolbar
