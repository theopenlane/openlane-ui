import { LayoutGrid, Table as TableIcon } from 'lucide-react'
import { type TTableViewMode } from '@/hooks/use-org-table-state'

type TTableCardViewProps = {
  onTabChange: (tab: TTableViewMode) => void
  activeTab: TTableViewMode
  cardLabel?: string
}

const TableCardView = ({ onTabChange, activeTab, cardLabel = 'Card' }: TTableCardViewProps) => {
  return (
    <div className="flex items-center p-[3px] gap-1 border rounded-md bg-background">
      <button
        type="button"
        aria-label="Table view"
        className={`flex items-center gap-1.5 cursor-pointer px-1.5 py-1 rounded-md text-sm ${activeTab === 'table' ? 'bg-btn-secondary' : 'text-muted-foreground'}`}
        onClick={() => onTabChange('table')}
      >
        <TableIcon size={16} />
        <span>Table</span>
      </button>
      <button
        type="button"
        aria-label={`${cardLabel} view`}
        className={`flex items-center gap-1.5 cursor-pointer px-1.5 py-1 rounded-md text-sm ${activeTab === 'card' ? 'bg-btn-secondary' : 'text-muted-foreground'}`}
        onClick={() => onTabChange('card')}
      >
        <LayoutGrid size={16} />
        <span>{cardLabel}</span>
      </button>
    </div>
  )
}

export default TableCardView
