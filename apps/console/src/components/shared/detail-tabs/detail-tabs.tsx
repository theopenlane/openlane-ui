'use client'

import React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import ScrollableTabsList from './scrollable-tabs-list'
import CustomizeTabsMenu from './customize-tabs-menu'
import { type TDetailTabsState } from './use-detail-tabs'

type TDetailTabsProps<T extends string> = {
  state: TDetailTabsState<T>
  badges?: Partial<Record<T, number>>
  children: React.ReactNode
}

const DetailTabs = <T extends string>({ state, badges, children }: TDetailTabsProps<T>) => (
  <Tabs value={state.activeTab} onValueChange={state.onTabChange} variant="underline">
    <div className="mb-6">
      <ScrollableTabsList trailing={<CustomizeTabsMenu state={state} />}>
        <TabsList className="w-max gap-2">
          {state.shownTabs.map(({ value, label }, index) => {
            const badgeCount = badges?.[value] ?? 0
            return (
              <TabsTrigger key={value} value={value} className={index === 0 ? 'px-0' : undefined}>
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
      </ScrollableTabsList>
    </div>
    {children}
  </Tabs>
)

export default DetailTabs
