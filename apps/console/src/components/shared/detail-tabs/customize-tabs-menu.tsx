'use client'

import React from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { type TDetailTabsState } from './use-detail-tabs'

type TCustomizeTabsMenuProps<T extends string> = {
  state: TDetailTabsState<T>
}

const CustomizeTabsMenu = <T extends string>({ state }: TCustomizeTabsMenuProps<T>) => {
  const { menuTabs, hiddenTabs, canHideTab, setTabHidden, resetHiddenTabs } = state

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon-sm" className="shrink-0" icon={<MoreHorizontal />} descriptiveTooltipText="Customize tabs" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Show tabs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuTabs.map(({ value, label }) => {
          const isShown = !hiddenTabs.has(value)
          return (
            <DropdownMenuCheckboxItem
              key={value}
              checked={isShown}
              disabled={isShown && !canHideTab(value)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => setTabHidden(value, !checked)}
            >
              {label}
            </DropdownMenuCheckboxItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={hiddenTabs.size === 0} onSelect={resetHiddenTabs}>
          Show all tabs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default CustomizeTabsMenu
