import { ColumnDef, Row } from '@tanstack/react-table'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate } from '@/utils/date'
import { Checkbox } from '@repo/ui/checkbox'
import { IdentityHoldersNodeNonNull } from '@/lib/graphql-hooks/identity-holder'
import { ColumnOptions } from '@/components/shared/crud-base/page'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<IdentityHoldersNodeNonNull>[] => {
  const toggleSelection = (item: IdentityHoldersNodeNonNull) => {
    setSelectedItems((prev) => {
      const exists = prev.some((c) => c.id === item.id)
      return exists ? prev.filter((c) => c.id !== item.id) : [...prev, item]
    })
  }

  return [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageItems = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageItems.every((item) => selectedItems?.some((si) => si.id === item.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedItems.filter((si) => !currentPageItems.some((i) => i.id === si.id)), ...currentPageItems]
                  : selectedItems.filter((si) => !currentPageItems.some((i) => i.id === si.id))

                setSelectedItems(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<IdentityHoldersNodeNonNull> }) => {
        const { id } = row.original
        const isChecked = selectedItems?.some((v) => v.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection(row.original)} />
          </div>
        )
      },
      size: 50,
    },
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'displayID', header: 'Display ID', size: 120 },
    { accessorKey: 'fullName', header: 'Full Name', size: 150, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'email', header: 'Email', size: 200 },
    { accessorKey: 'alternateEmail', header: 'Alternate Email', size: 200 },
    { accessorKey: 'title', header: 'Title', size: 150 },
    { accessorKey: 'department', header: 'Department', size: 150 },
    { accessorKey: 'team', header: 'Team', size: 120 },
    { accessorKey: 'location', header: 'Location', size: 150 },
    { accessorKey: 'phoneNumber', header: 'Phone Number', size: 150 },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return <div>{value ? getEnumLabel(value) : '-'}</div>
      },
    },
    {
      accessorKey: 'identityHolderType',
      header: 'Type',
      size: 120,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return <div>{value ? getEnumLabel(value) : '-'}</div>
      },
    },
    { accessorKey: 'isActive', header: 'Active', size: 100, cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No') },
    { accessorKey: 'isOpenlaneUser', header: 'Openlane User', size: 120, cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No') },
    { accessorKey: 'startDate', header: 'Start Date', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'endDate', header: 'End Date', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'externalUserID', header: 'External User ID', size: 150 },
    { accessorKey: 'externalReferenceID', header: 'External Reference ID', size: 170 },
    { accessorKey: 'environmentName', header: 'Environment', size: 120 },
    { accessorKey: 'scopeName', header: 'Scope', size: 120 },
    { accessorKey: 'internalOwner', header: 'Internal Owner', size: 150 },
    { accessorKey: 'tags', header: 'Tags', size: 180, cell: ({ cell }) => (cell.getValue() as string[])?.join(', ') || '' },
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
