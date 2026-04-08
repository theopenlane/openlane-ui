import { type ColumnDef } from '@tanstack/react-table'
import { type PlatformsNodeNonNull } from '@/lib/graphql-hooks/platform'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { type Platform, type PlatformPlatformStatus } from '@repo/codegen/src/schema'
import { formatDate } from '@/utils/date'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import { ResponsibilityCell } from '@/components/shared/crud-base/columns/responsibility-cell'
import { Badge } from '@repo/ui/badge'
import { PlatformPlatformStatus as StatusEnum } from '@repo/codegen/src/schema'

const STATUS_VARIANT: Record<PlatformPlatformStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [StatusEnum.ACTIVE]: 'default',
  [StatusEnum.INACTIVE]: 'secondary',
  [StatusEnum.RETIRED]: 'destructive',
}

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<PlatformsNodeNonNull>[] => {
  return [
    createSelectColumn<PlatformsNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 220,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.scopeName && <CustomEnumChipCell value={row.original.scopeName} field="scope" />}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ cell }) => {
        const value = cell.getValue() as PlatformPlatformStatus
        return value ? <Badge variant={STATUS_VARIANT[value] ?? 'outline'}>{value}</Badge> : <div>-</div>
      },
    },
    {
      accessorKey: 'businessPurpose',
      header: 'Business Purpose',
      size: 250,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        if (!value) return ''
        const plain = value
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        return <span className="line-clamp-2 text-sm">{plain}</span>
      },
    },
    {
      accessorKey: 'environmentName',
      header: 'Environment',
      size: 130,
      cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="environment" />,
    },
    {
      accessorKey: 'scopeName',
      header: 'Scope',
      size: 120,
      cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="scope" />,
    },
    {
      accessorKey: 'containsPii',
      header: 'Contains PII',
      size: 110,
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} />,
    },
    {
      accessorKey: 'businessOwner',
      header: 'Business Owner',
      size: 160,
      cell: ({ row }) => (
        <ResponsibilityCell userMap={userMap} user={(row.original as Platform).businessOwnerUser} group={(row.original as Platform).businessOwnerGroup} stringValue={row.original.businessOwner} />
      ),
    },
    {
      accessorKey: 'technicalOwner',
      header: 'Technical Owner',
      size: 160,
      cell: ({ row }) => (
        <ResponsibilityCell userMap={userMap} user={(row.original as Platform).technicalOwnerUser} group={(row.original as Platform).technicalOwnerGroup} stringValue={row.original.technicalOwner} />
      ),
    },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
  ]
}
