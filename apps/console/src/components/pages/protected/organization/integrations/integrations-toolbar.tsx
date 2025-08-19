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
            <TabsTrigger value="installed" className="flex justify-center items-center w-1/2 h-6">
              <p>{`Installed (${installedCount || 0})`}</p>
            </TabsTrigger>
            <TabsTrigger value="available" className="flex justify-center items-center w-1/2 h-6">
              <p>Available</p>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div></div>
    </div>
  )
}

export default IntegrationsToolbar
