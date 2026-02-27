import { ColumnDef } from '@tanstack/react-table'
import { AssetsNodeNonNull } from '@/lib/graphql-hooks/asset'
import { ColumnOptions } from '@/components/shared/crud-base/page'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'

export const getColumns = ({ userMap, convertToReadOnly, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<AssetsNodeNonNull>[] => {
  return [
    createSelectColumn<AssetsNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'name', header: 'Name', size: 100, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'displayName', header: 'Display Name', size: 120, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'accessModelName', header: 'Access Model', size: 140 },
    { accessorKey: 'assetDataClassificationName', header: 'Data Classification', size: 140 },
    { accessorKey: 'assetSubtypeName', header: 'Subtype', size: 120 },
    {
      accessorKey: 'assetType',
      header: 'Type',
      size: 120,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return <div>{value ? getEnumLabel(value) : '-'}</div>
      },
    },
    { accessorKey: 'costCenter', header: 'Cost Center', size: 120 },
    { accessorKey: 'cpe', header: 'CPE', size: 120 },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} />,
    },
    { accessorKey: 'criticalityName', header: 'Criticality', size: 120 },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 200,
      minSize: 150,
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string) || '',
    },
    {
      accessorKey: 'containsPii',
      header: 'Contains PII',
      size: 100,
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} />,
    },
    { accessorKey: 'encryptionStatusName', header: 'Encryption Status', size: 140 },
    { accessorKey: 'environmentName', header: 'Environment', size: 120 },
    { accessorKey: 'estimatedMonthlyCost', header: 'Est. Monthly Cost', size: 120 },
    { accessorKey: 'identifier', header: 'Identifier', size: 120 },
    { accessorKey: 'physicalLocation', header: 'Physical Location', size: 120 },
    { accessorKey: 'purchaseDate', header: 'Purchase Date', size: 120, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'region', header: 'Region', size: 120 },
    { accessorKey: 'scopeName', header: 'Scope', size: 120 },
    { accessorKey: 'securityTierName', header: 'Security Tier', size: 120 },
    { accessorKey: 'sourceIdentifier', header: 'Source Identifier', size: 120 },
    {
      accessorKey: 'sourceType',
      header: 'Source Type',
      size: 120,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return <div>{value ? getEnumLabel(value) : '-'}</div>
      },
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 140,
      cell: ({ row }) => <TagsCell tags={row.original.tags} wrap={false} />,
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" /> },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} />,
    },
    { accessorKey: 'website', header: 'Website', size: 120 },
  ]
}
