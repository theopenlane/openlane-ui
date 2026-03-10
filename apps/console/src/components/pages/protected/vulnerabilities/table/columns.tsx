import { type ColumnDef } from '@tanstack/react-table'
import { type VulnerabilitiesNodeNonNull } from '@/lib/graphql-hooks/vulnerability'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'

export const getColumns = ({ userMap, convertToReadOnly, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<VulnerabilitiesNodeNonNull>[] => {
  return [
    createSelectColumn<VulnerabilitiesNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'displayID', header: 'Display ID', size: 140, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'displayName', header: 'Display Name', size: 160, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'externalID', header: 'External ID', size: 160 },
    { accessorKey: 'severity', header: 'Severity', size: 100 },
    { accessorKey: 'status', header: 'Status', size: 120 },
    { accessorKey: 'priority', header: 'Priority', size: 100 },
    { accessorKey: 'score', header: 'Score', size: 90 },
    { accessorKey: 'exploitability', header: 'Exploitability', size: 120 },
    { accessorKey: 'impact', header: 'Impact', size: 90 },
    { accessorKey: 'cveID', header: 'CVE ID', size: 140 },
    { accessorKey: 'category', header: 'Category', size: 120 },
    { accessorKey: 'source', header: 'Source', size: 120 },
    { accessorKey: 'vector', header: 'Vector', size: 160 },
    { accessorKey: 'remediationSLA', header: 'Remediation SLA (days)', size: 160 },
    { accessorKey: 'open', header: 'Open', size: 80, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'blocking', header: 'Blocking', size: 90, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'production', header: 'Production', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'validated', header: 'Validated', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'public', header: 'Public', size: 80, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
    { accessorKey: 'environmentName', header: 'Environment', size: 120 },
    { accessorKey: 'scopeName', header: 'Scope', size: 120 },
    { accessorKey: 'externalOwnerID', header: 'External Owner', size: 140 },
    { accessorKey: 'externalURI', header: 'External URI', size: 160 },
    { accessorKey: 'summary', header: 'Summary', size: 200 },
    { accessorKey: 'description', header: 'Description', size: 200, minSize: 150, cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string) || '' },
    { accessorKey: 'discoveredAt', header: 'Discovered At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'publishedAt', header: 'Published At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
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
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 160,
      cell: ({ row }) => <TagsCell tags={row.original.tags} wrap={false} />,
    },
  ]
}
