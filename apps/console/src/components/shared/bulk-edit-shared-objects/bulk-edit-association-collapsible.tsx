'use client'

import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'

type Props = {
  isCollapsed: boolean
  selectedCount: number
  displayLabel: string
  onToggle: () => void
  children: React.ReactNode
}

export const BulkEditAssociationCollapsible: React.FC<Props> = ({ isCollapsed, selectedCount, displayLabel, onToggle, children }) => {
  return (
    <Collapsible open={!isCollapsed} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted transition-colors">
        <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
        <span className="text-sm font-medium">{displayLabel}</span>
        {selectedCount > 0 && <span className="ml-auto text-xs text-muted-foreground">{selectedCount} selected</span>}
      </CollapsibleTrigger>
      <CollapsibleContent forceMount hidden={isCollapsed}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
