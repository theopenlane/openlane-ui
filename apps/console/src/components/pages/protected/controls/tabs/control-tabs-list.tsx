'use client'

import React from 'react'
import { TabsList, TabsTrigger } from '@repo/ui/tabs'

const CONTROL_TABS = [
  { value: 'implementation', label: 'Implementations', className: 'px-0' },
  { value: 'linked-controls', label: 'Linked Controls' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'guidance', label: 'Guidance' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'assets-scans', label: 'Assets + Scans' },
  { value: 'findings-risks', label: 'Findings + Risks' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'activity', label: 'Activity' },
]

type ControlTabsListProps = {
  // tabs to render; omitted ones have nothing to show for this control
  visibleTabs?: string[]
  // per-tab alert counts, rendered as a small badge on the trigger
  badges?: Partial<Record<string, number>>
}

const ControlTabsList: React.FC<ControlTabsListProps> = ({ visibleTabs, badges }) => (
  <TabsList className="w-max gap-2">
    {CONTROL_TABS.filter((tab) => !visibleTabs || visibleTabs.includes(tab.value)).map(({ value, label, className }) => {
      const badgeCount = badges?.[value] ?? 0
      return (
        <TabsTrigger key={value} value={value} className={className}>
          <span className="inline-flex items-center gap-1.5">
            {label}
            {badgeCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-warning)]/20 px-1 text-[10px] font-semibold text-[var(--color-warning)]">
                {badgeCount}
              </span>
            )}
          </span>
        </TabsTrigger>
      )
    })}
  </TabsList>
)

export default ControlTabsList
