'use client'

import React from 'react'
import { TabsList, TabsTrigger } from '@repo/ui/tabs'

const CONTROL_TABS = [
  { value: 'implementation', label: 'Implementations', className: 'px-0' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'linked-controls', label: 'Linked Controls' },
  { value: 'guidance', label: 'Guidance' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'activity', label: 'Activity' },
]

type ControlTabsListProps = {
  includeGuidance?: boolean
}

const ControlTabsList: React.FC<ControlTabsListProps> = ({ includeGuidance = true }) => (
  <TabsList className="w-max gap-2">
    {CONTROL_TABS.filter((tab) => includeGuidance || tab.value !== 'guidance').map(({ value, label, className }) => (
      <TabsTrigger key={value} value={value} className={className}>
        {label}
      </TabsTrigger>
    ))}
  </TabsList>
)

export default ControlTabsList
