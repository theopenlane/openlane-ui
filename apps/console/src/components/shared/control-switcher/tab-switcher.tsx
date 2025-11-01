import { Presentation, Table } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import React from 'react'

type TTabSwitcherProps = {
  active: 'dashboard' | 'table'
  setActive: (tab: 'dashboard' | 'table') => void
}

const TabSwitcher: React.FC<TTabSwitcherProps> = ({ active, setActive }) => (
  <div className="flex items-center p-[3px] gap-1 border rounded-md cursor-pointer overflow-hidden bg-background">
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Presentation className={`cursor-pointer p-1 ${active === 'dashboard' ? 'bg-btn-secondary rounded-md' : 'text-muted-foreground'}`} onClick={() => setActive('dashboard')} size={24} />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Dashboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Table className={`cursor-pointer p-1 ${active === 'table' ? 'bg-btn-secondary rounded-md' : 'text-muted-foreground'}`} onClick={() => setActive('table')} size={24} />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Table View</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
)

export default TabSwitcher
