import { Input } from '@repo/ui/input'
import { TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Search } from 'lucide-react'
import React from 'react'
import { INTEGRATIONS_TABS } from '@/lib/integrations/types'

type Props = {
  installedCount: number
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const IntegrationsToolbar = ({ installedCount, searchQuery, setSearchQuery }: Props) => (
  <div className="my-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <TabsList className="w-fit flex-nowrap">
      <TabsTrigger value={INTEGRATIONS_TABS.browse} className="whitespace-nowrap px-3">
        Browse Integrations
      </TabsTrigger>
      <TabsTrigger value={INTEGRATIONS_TABS.installed} className="whitespace-nowrap px-3">
        Installed ({installedCount})
      </TabsTrigger>
    </TabsList>

    <Input
      variant="searchTable"
      className="md:max-w-xs"
      icon={<Search size={16} className="text-muted-foreground" />}
      placeholder="Search integrations..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.currentTarget.value)}
    />
  </div>
)

export default IntegrationsToolbar
