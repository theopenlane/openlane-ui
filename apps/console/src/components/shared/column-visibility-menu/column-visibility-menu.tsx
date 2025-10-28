import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { Columns3 } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { VisibilityState } from '@tanstack/react-table'

type TColumnVisibilityMenuProps = {
  columnVisibility: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
}

const ColumnVisibilityMenu: React.FC<TColumnVisibilityMenuProps> = ({ mappedColumns, columnVisibility, setColumnVisibility }: TColumnVisibilityMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button icon={<Columns3 size={16} />} iconPosition="left" variant="secondary" size="md" className="size-fit py-1.5 px-2">
          Column
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="border shadow-md p-0" align="start">
        {[...mappedColumns]
          .sort((a, b) => a.header.localeCompare(b.header))
          .map((column, index) => (
            <div key={`${column.accessorKey}-${index}`} className="flex items-center gap-x-3 p-1">
              <Checkbox
                className="capitalize h-4 w-4 text-sm"
                stroke={2}
                checked={columnVisibility[column.accessorKey] !== false}
                onCheckedChange={(value: boolean) => {
                  setColumnVisibility((prev) => ({
                    ...prev,
                    [column.accessorKey]: value,
                  }))
                }}
              />
              <div className="text-sm">{column.header}</div>
            </div>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ColumnVisibilityMenu
