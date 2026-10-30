'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'

type TCollapsiblePanelProps = {
  title: string
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  action?: React.ReactNode
  children: React.ReactNode
}

export const CollapsiblePanel: React.FC<TCollapsiblePanelProps> = ({ title, defaultOpen = true, open, onOpenChange, action, children }) => (
  <Panel className="p-4 flex flex-col gap-0">
    <Collapsible defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange} className="group/collapsible">
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-medium">{title}</p>
        <div className="flex items-center gap-2">
          {action}
          <CollapsibleTrigger asChild>
            <Button type="button" variant="icon" size="icon-sm" aria-label={`Toggle ${title}`}>
              <ChevronDown size={16} className="transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className="mt-3 flex flex-col gap-3">{children}</CollapsibleContent>
    </Collapsible>
  </Panel>
)
