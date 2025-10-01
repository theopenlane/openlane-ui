import { Presentation, Table } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import React from 'react'

type TTabSwitcherProps = {
  active: 'report' | 'controls'
  setActive: (tab: 'report' | 'controls') => void
}

const TabSwitcher: React.FC<TTabSwitcherProps> = ({ active, setActive }) => (
  <div className="flex items-center p-[3px] gap-1 border rounded-md cursor-pointer overflow-hidden bg-background">
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Presentation className={`cursor-pointer p-1 ${active === 'report' ? 'bg-btn-primary rounded-md' : 'text-muted-foreground'}`} onClick={() => setActive('report')} size={24} />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Dashboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Table className={`cursor-pointer p-1 ${active === 'controls' ? 'bg-btn-primary rounded-md' : 'text-muted-foreground'}`} onClick={() => setActive('controls')} size={24} />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Table View</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
)

export default TabSwitcher
