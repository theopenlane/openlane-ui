import { ColumnDef, Row } from '@tanstack/react-table'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate } from '@/utils/date'
import { Checkbox } from '@repo/ui/checkbox'
import { ScansNodeNonNull } from '@/lib/graphql-hooks/scan'
import { ColumnOptions } from '@/components/shared/crud-base/page'

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions<ScansNodeNonNull>): ColumnDef<ScansNodeNonNull>[] => {
  const toggleSelection = (scan: ScansNodeNonNull) => {
    setSelectedItems((prev) => {
      const exists = prev.some((c) => c.id === scan.id)
      return exists ? prev.filter((c) => c.id !== scan.id) : [...prev, scan]
    })
  }

  return [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageItems = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageItems.every((item) => selectedItems.some((sc) => sc.id === item.id))
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedItems.filter((sc) => !currentPageItems.some((c) => c.id === sc.id)), ...currentPageItems]
                  : selectedItems.filter((sc) => !currentPageItems.some((c) => c.id === sc.id))
                setSelectedItems(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<ScansNodeNonNull> }) => {
        const { id } = row.original
        const isChecked = selectedItems.some((c) => c.id === id)
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection(row.original)} />
          </div>
        )
      },
      size: 50,
    },
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'target', header: 'Target', size: 220 },
    { accessorKey: 'scanType', header: 'Scan Type', size: 130 },
    { accessorKey: 'status', header: 'Status', size: 110 },
    { accessorKey: 'scanDate', header: 'Scan Date', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'scanSchedule', header: 'Schedule', size: 160 },
    { accessorKey: 'nextScanRunAt', header: 'Next Run', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'environmentName', header: 'Environment', size: 120 },
    { accessorKey: 'scopeName', header: 'Scope', size: 120 },
    { accessorKey: 'assignedTo', header: 'Assigned To', size: 140 },
    { accessorKey: 'performedBy', header: 'Performed By', size: 140 },
    { accessorKey: 'reviewedBy', header: 'Reviewed By', size: 140 },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => {
        const user = userMap[row.original.createdBy ?? '']
        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user} className="w-[24px] h-[24px]" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => {
        const user = userMap[row.original.updatedBy ?? '']
        return user ? (
          <div className="flex items-center space-x-1">
            <Avatar entity={user} className="w-[24px] h-[24px]" />
            <p>{user.displayName}</p>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Deleted user</span>
        )
      },
    },
  ]
}
