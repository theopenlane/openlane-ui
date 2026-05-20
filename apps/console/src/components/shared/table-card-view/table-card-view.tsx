import { LayoutGrid, Table as TableIcon } from 'lucide-react'

type TTableCardViewProps = {
  onTabChange: (tab: 'table' | 'card') => void
  activeTab: 'table' | 'card'
}

const TableCardView = ({ onTabChange, activeTab }: TTableCardViewProps) => {
  return (
    <div className="flex items-center p-[3px] gap-1 border rounded-md bg-background">
      <button
        aria-label="Table view"
        className={`flex items-center gap-1.5 cursor-pointer px-1.5 py-1 rounded-md text-sm ${activeTab === 'table' ? 'bg-btn-secondary' : 'text-muted-foreground'}`}
        onClick={() => onTabChange('table')}
      >
        <TableIcon size={16} />
        <span>Table</span>
      </button>
      <button
        aria-label="Card view"
        className={`flex items-center gap-1.5 cursor-pointer px-1.5 py-1 rounded-md text-sm ${activeTab === 'card' ? 'bg-btn-secondary' : 'text-muted-foreground'}`}
        onClick={() => onTabChange('card')}
      >
        <LayoutGrid size={16} />
        <span>Card</span>
      </button>
    </div>
  )
}

export default TableCardView
