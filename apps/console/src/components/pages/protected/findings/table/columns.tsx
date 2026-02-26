import { ColumnDef } from '@tanstack/react-table'
import { FindingsNodeNonNull } from '@/lib/graphql-hooks/finding'
import { ColumnOptions } from '@/components/shared/crud-base/page'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<FindingsNodeNonNull>[] => {
  return [
    createSelectColumn<FindingsNodeNonNull>(selectedItems, setSelectedItems),
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
    { accessorKey: 'open', header: 'Open', size: 80, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'production', header: 'Production', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'validated', header: 'Validated', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'public', header: 'Public', size: 80, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'blocksProduction', header: 'Blocks Production', size: 130, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'externalID', header: 'External ID', size: 150 },
    { accessorKey: 'externalOwnerID', header: 'External Owner', size: 140 },
    { accessorKey: 'externalURI', header: 'External URI', size: 160 },
    { accessorKey: 'source', header: 'Source', size: 120 },
    { accessorKey: 'findingClass', header: 'Finding Class', size: 130 },
    { accessorKey: 'remediationSLA', header: 'Remediation SLA (days)', size: 160 },
    { accessorKey: 'environmentName', header: 'Environment', size: 120 },
    { accessorKey: 'scopeName', header: 'Scope', size: 120 },
    { accessorKey: 'reportedAt', header: 'Reported At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'eventTime', header: 'Event Time', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'sourceUpdatedAt', header: 'Source Updated At', size: 140, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} />,
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" /> },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} />,
    },
  ]
}
