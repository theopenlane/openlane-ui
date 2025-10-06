import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui/tooltip'
import { LayoutGrid, Table as TableIcon } from 'lucide-react'

type TTableCardViewProps = {
  onTabChange: (tab: 'table' | 'card') => void
  activeTab: 'table' | 'card'
}

const TableCardView = ({ onTabChange, activeTab }: TTableCardViewProps) => {
  return (
    <div className="flex gap-1 size-fit bg-transparent py-0.5 px-1 border rounded-md">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div aria-label="Table view" className={`py-1.5 px-2.5 rounded-md cursor-pointer ${activeTab === 'table' ? 'bg-card' : 'bg-transparent'}`} onClick={() => onTabChange('table')}>
              <TableIcon size={16} />
            </div>
          </TooltipTrigger>
          <TooltipContent>Table view</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div aria-label="Card view" className={`py-1.5 px-2.5 rounded-md cursor-pointer ${activeTab === 'card' ? 'bg-card' : 'bg-transparent'}`} onClick={() => onTabChange('card')}>
              <LayoutGrid size={16} />
            </div>
          </TooltipTrigger>
          <TooltipContent>Card view</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export default TableCardView
