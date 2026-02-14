import { ColumnDef, Row } from '@tanstack/react-table'
import { Entity, User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate } from '@/utils/date'
import { Checkbox } from '@repo/ui/checkbox'

type ColumnOptions = {
  userMap: Record<string, User>
  convertToReadOnly?: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  selectedVendors: { id: string }[]
  setSelectedVendors: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getVendorColumns = ({ userMap, convertToReadOnly, selectedVendors, setSelectedVendors }: ColumnOptions): ColumnDef<Entity>[] => {
  const toggleSelection = (vendor: { id: string }) => {
    setSelectedVendors((prev) => {
      const exists = prev.some((v) => v.id === vendor.id)
      return exists ? prev.filter((v) => v.id !== vendor.id) : [...prev, vendor]
    })
  }

  return [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageVendors = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageVendors.every((vendor) => selectedVendors.some((sv) => sv.id === vendor.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedVendors.filter((sv) => !currentPageVendors.some((v) => v.id === sv.id)), ...currentPageVendors.map((v) => ({ id: v.id }))]
                  : selectedVendors.filter((sv) => !currentPageVendors.some((v) => v.id === sv.id))

                setSelectedVendors(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<Entity> }) => {
        const { id } = row.original
        const isChecked = selectedVendors.some((v) => v.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id })} />
          </div>
        )
      },
      size: 50,
    },
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'name', header: 'Name', size: 200, cell: ({ cell }) => cell.getValue() || '' },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 200,
      minSize: 150,
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string) || '',
    },
    { accessorKey: 'displayName', header: 'Display Name', size: 200 },
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
