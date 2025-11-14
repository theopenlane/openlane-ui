import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { Columns3 } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { VisibilityState } from '@tanstack/react-table'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'

const STORAGE_FILTER_PREFIX = 'column-visibility'

export const getInitialVisibility = (storageKey: string, defaults: VisibilityState): VisibilityState => {
  if (typeof window === 'undefined') {
    return defaults
  }
  try {
    const stored = localStorage.getItem(`${STORAGE_FILTER_PREFIX}:${storageKey}`)
    const parsed = stored ? JSON.parse(stored) : {}
    return { ...defaults, ...parsed }
  } catch {
    return defaults
  }
}

const saveVisibility = (storageKey: string, state: VisibilityState) => {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem(`${STORAGE_FILTER_PREFIX}:${storageKey}`, JSON.stringify(state))
}

type TColumnVisibilityMenuProps = {
  columnVisibility: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
  storageKey: TableColumnVisibilityKeysEnum
}

const ColumnVisibilityMenu: React.FC<TColumnVisibilityMenuProps> = ({ mappedColumns, columnVisibility, setColumnVisibility, storageKey }: TColumnVisibilityMenuProps) => {
  const handleVisibilityChange = (accessorKey: string, value: boolean) => {
    const newState = {
      ...columnVisibility,
      [accessorKey]: value,
    }
    saveVisibility(storageKey, newState)
    setColumnVisibility(newState)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button icon={<Columns3 size={16} />} iconPosition="left" variant="secondary" size="md" className="size-fit py-1.5 px-2">
          Columns
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="border shadow-md p-0" align="start">
        {[...mappedColumns]
          .sort((a, b) => a.header.localeCompare(b.header))
          .map((column) => (
            <div key={column.accessorKey} className="flex items-center gap-x-3 p-1">
              <Checkbox
                className="capitalize h-4 w-4 text-sm"
                stroke={2}
                checked={columnVisibility[column.accessorKey] !== false}
                onCheckedChange={(value: boolean) => handleVisibilityChange(column.accessorKey, value)}
              />
              <div className="text-sm">{column.header}</div>
            </div>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ColumnVisibilityMenu
