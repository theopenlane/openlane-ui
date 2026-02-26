import { ColumnDef, Row } from '@tanstack/react-table'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate } from '@/utils/date'
import { Checkbox } from '@repo/ui/checkbox'
import { RemediationsNodeNonNull } from '@/lib/graphql-hooks/remediation'
import { ColumnOptions } from '@/components/shared/crud-base/page'

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions<RemediationsNodeNonNull>): ColumnDef<RemediationsNodeNonNull>[] => {
  const toggleSelection = (remediation: RemediationsNodeNonNull) => {
    setSelectedItems((prev) => {
      const exists = prev.some((c) => c.id === remediation.id)
      return exists ? prev.filter((c) => c.id !== remediation.id) : [...prev, remediation]
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
      cell: ({ row }: { row: Row<RemediationsNodeNonNull> }) => {
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
    { accessorKey: 'displayID', header: 'Display ID', size: 140, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'title', header: 'Title', size: 200, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'summary', header: 'Summary', size: 200 },
    { accessorKey: 'state', header: 'State', size: 110 },
    { accessorKey: 'source', header: 'Source', size: 120 },
    { accessorKey: 'externalID', header: 'External ID', size: 150 },
    { accessorKey: 'externalOwnerID', header: 'External Owner', size: 140 },
    { accessorKey: 'externalURI', header: 'External URI', size: 160 },
    { accessorKey: 'ownerReference', header: 'Owner Reference', size: 140 },
    { accessorKey: 'ticketReference', header: 'Ticket Reference', size: 140 },
    { accessorKey: 'pullRequestURI', header: 'Pull Request URI', size: 160 },
    { accessorKey: 'repositoryURI', header: 'Repository URI', size: 160 },
    { accessorKey: 'environmentName', header: 'Environment', size: 120 },
    { accessorKey: 'scopeName', header: 'Scope', size: 120 },
    { accessorKey: 'dueAt', header: 'Due At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'completedAt', header: 'Completed At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'prGeneratedAt', header: 'PR Generated At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
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
