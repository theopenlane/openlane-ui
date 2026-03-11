import { type ColumnDef } from '@tanstack/react-table'
import { type RemediationsNodeNonNull } from '@/lib/graphql-hooks/remediation'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<RemediationsNodeNonNull>[] => {
  return [
    createSelectColumn<RemediationsNodeNonNull>(selectedItems, setSelectedItems),
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
    { accessorKey: 'environmentName', header: 'Environment', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="environment" /> },
    { accessorKey: 'scopeName', header: 'Scope', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="scope" /> },
    { accessorKey: 'dueAt', header: 'Due At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'completedAt', header: 'Completed At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'prGeneratedAt', header: 'PR Generated At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
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
