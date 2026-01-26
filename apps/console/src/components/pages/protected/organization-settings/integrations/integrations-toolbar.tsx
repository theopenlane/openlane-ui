import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import React from 'react'
import { IntegrationTab } from './config'

type Props = {
  activeTab: IntegrationTab
  setActiveTab: (tab: IntegrationTab) => void
  installedCount: number | undefined
}

const IntegrationsToolbar = ({ activeTab, setActiveTab, installedCount }: Props) => {
  return (
    <div className="flex justify-between">
      <div>
        <Tabs className="w-[316px]" value={activeTab.toLowerCase()} onValueChange={(val) => setActiveTab(val === 'installed' ? 'Installed' : 'Available')}>
          <TabsList className="!p-1">
            <TabsTrigger value="installed" className="flex justify-center items-center w-1/2 h-6 bg-card data-[state=active]:bg-primary data-[state=active]:text-btn-secondary-text">
              {`Installed (${installedCount || 0})`}
            </TabsTrigger>
            <TabsTrigger value="available" className="flex justify-center items-center w-1/2 h-6 bg-card data-[state=active]:bg-primary data-[state=active]:text-btn-secondary-text">
              Available
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div></div>
    </div>
  )
}

export default IntegrationsToolbar
