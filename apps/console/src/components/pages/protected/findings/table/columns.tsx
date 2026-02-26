import { ColumnDef, Row } from '@tanstack/react-table'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate } from '@/utils/date'
import { Checkbox } from '@repo/ui/checkbox'
import { FindingsNodeNonNull } from '@/lib/graphql-hooks/finding'
import { ColumnOptions } from '@/components/shared/crud-base/page'

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions<FindingsNodeNonNull>): ColumnDef<FindingsNodeNonNull>[] => {
  const toggleSelection = (finding: FindingsNodeNonNull) => {
    setSelectedItems((prev) => {
      const exists = prev.some((c) => c.id === finding.id)
      return exists ? prev.filter((c) => c.id !== finding.id) : [...prev, finding]
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
      cell: ({ row }: { row: Row<FindingsNodeNonNull> }) => {
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
    { accessorKey: 'displayName', header: 'Display Name', size: 180, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'category', header: 'Category', size: 130 },
    { accessorKey: 'severity', header: 'Severity', size: 100 },
    { accessorKey: 'numericSeverity', header: 'Numeric Severity', size: 130 },
    { accessorKey: 'status', header: 'Status', size: 110 },
    { accessorKey: 'priority', header: 'Priority', size: 100 },
    { accessorKey: 'score', header: 'Score', size: 90 },
    { accessorKey: 'exploitability', header: 'Exploitability', size: 120 },
    { accessorKey: 'impact', header: 'Impact', size: 90 },
    { accessorKey: 'vector', header: 'Vector', size: 160 },
    { accessorKey: 'open', header: 'Open', size: 80, cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No') },
    { accessorKey: 'production', header: 'Production', size: 100, cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No') },
    { accessorKey: 'validated', header: 'Validated', size: 100, cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No') },
    { accessorKey: 'public', header: 'Public', size: 80, cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No') },
    { accessorKey: 'blocksProduction', header: 'Blocks Production', size: 130, cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No') },
    { accessorKey: 'externalID', header: 'External ID', size: 150 },
    { accessorKey: 'externalOwnerID', header: 'External Owner', size: 140 },
    { accessorKey: 'externalURI', header: 'External URI', size: 160 },
    { accessorKey: 'source', header: 'Source', size: 120 },
    { accessorKey: 'findingClass', header: 'Finding Class', size: 130 },
    { accessorKey: 'remediationSLA', header: 'Remediation SLA (days)', size: 160 },
    { accessorKey: 'environmentName', header: 'Environment', size: 120 },
    { accessorKey: 'scopeName', header: 'Scope', size: 120 },
    { accessorKey: 'reportedAt', header: 'Reported At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'eventTime', header: 'Event Time', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'sourceUpdatedAt', header: 'Source Updated At', size: 140, cell: ({ cell }) => formatDate(cell.getValue() as string) },
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
