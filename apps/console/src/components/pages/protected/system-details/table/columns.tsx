import { type ColumnDef } from '@tanstack/react-table'
import { type SystemDetail } from '@repo/codegen/src/schema'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type SystemDetailsNodeNonNull } from '@/lib/graphql-hooks/system-detail'

const formatJsonValue = (value?: string | Record<string, unknown> | Array<unknown> | null) => {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  return JSON.stringify(value, null, 2)
}

const JsonCell = ({ value }: { value?: string | Record<string, unknown> | Array<unknown> | null }) => {
  const text = formatJsonValue(value)

  if (!text) {
    return <div>-</div>
  }

  return <div className="line-clamp-2 whitespace-pre-wrap font-mono text-xs">{text}</div>
}

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<SystemDetailsNodeNonNull>[] => {
  return [
    createSelectColumn<SystemDetailsNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'displayID', header: 'Display ID', size: 120 },
    { accessorKey: 'systemName', header: 'System Name', size: 180, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'description', header: 'Description', size: 220, cell: ({ cell }) => <div className="line-clamp-2 text-sm">{(cell.getValue() as string) || '-'}</div> },
    { accessorKey: 'version', header: 'Version', size: 120 },
    {
      accessorKey: 'sensitivityLevel',
      header: 'Sensitivity Level',
      size: 150,
      cell: ({ cell }) => {
        const value = cell.getValue() as string | undefined
        return <div>{value ? getEnumLabel(value) : '-'}</div>
      },
    },
    { accessorKey: 'platform', header: 'Platform', size: 160, cell: ({ row }) => row.original.platform?.name ?? '-' },
    { accessorKey: 'program', header: 'Program', size: 160, cell: ({ row }) => row.original.program?.name ?? '-' },
    { accessorKey: 'authorizationBoundary', header: 'Authorization Boundary', size: 220, cell: ({ cell }) => <div className="line-clamp-2 text-sm">{(cell.getValue() as string) || '-'}</div> },
    { accessorKey: 'lastReviewed', header: 'Last Reviewed', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'tags', header: 'Tags', size: 180, cell: ({ row }) => <TagsCell tags={row.original.tags} /> },
    { accessorKey: 'oscalMetadataJSON', header: 'OSCAL Metadata JSON', size: 220, cell: ({ row }) => <JsonCell value={row.original.oscalMetadataJSON as SystemDetail['oscalMetadataJSON']} /> },
    { accessorKey: 'revisionHistory', header: 'Revision History', size: 220, cell: ({ row }) => <JsonCell value={row.original.revisionHistory as SystemDetail['revisionHistory']} /> },
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
