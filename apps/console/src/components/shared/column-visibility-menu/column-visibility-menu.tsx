import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { EyeIcon } from 'lucide-react'
import { Checkbox } from '@repo/ui/checkbox'
import { VisibilityState } from '@tanstack/react-table'

interface ColumnVisibilityMenuProps {
  columnVisibility: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  mappedColumns: {
    accessorKey: string
    header: string
  }[]
}

const ColumnVisibilityMenu: React.FC<ColumnVisibilityMenuProps> = ({ mappedColumns, columnVisibility, setColumnVisibility }: ColumnVisibilityMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button icon={<EyeIcon />} iconPosition="left" variant="outline" size="md" className="ml-auto mr-2">
          Select Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {mappedColumns.map((column, index) => {
          return (
            <div key={`${column.accessorKey}-${index}`} className="flex items-center gap-x-3">
              <Checkbox
                className="capitalize"
                checked={columnVisibility[column.accessorKey] !== false}
                onCheckedChange={(value: boolean) => {
                  setColumnVisibility((prev) => ({
                    ...prev,
                    [column.accessorKey]: value,
                  }))
                }}
              ></Checkbox>
              <div>{column.header}</div>
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ColumnVisibilityMenu
