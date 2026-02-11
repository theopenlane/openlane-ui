import { ColumnDef, Row } from '@tanstack/react-table'
import { Asset, User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar.tsx'
import { formatDate } from '@/utils/date'
import { Checkbox } from '@repo/ui/checkbox'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'

type ColumnOptions = {
  userMap: Record<string, User>
  convertToReadOnly?: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  selectedAssets: { id: string }[]
  setSelectedAssets: React.Dispatch<React.SetStateAction<{ id: string }[]>>
}

export const getAssetColumns = ({ userMap, convertToReadOnly, selectedAssets, setSelectedAssets }: ColumnOptions): ColumnDef<Asset>[] => {
  const toggleSelection = (asset: { id: string }) => {
    setSelectedAssets((prev) => {
      const exists = prev.some((c) => c.id === asset.id)
      return exists ? prev.filter((c) => c.id !== asset.id) : [...prev, asset]
    })
  }
  return [
    {
      id: 'select',
      header: ({ table }) => {
        const currentPageAssets = table.getRowModel().rows.map((row) => row.original)
        const allSelected = currentPageAssets.every((asset) => selectedAssets.some((sc) => sc.id === asset.id))

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked: boolean) => {
                const newSelections = checked
                  ? [...selectedAssets.filter((sc) => !currentPageAssets.some((c) => c.id === sc.id)), ...currentPageAssets.map((c) => ({ id: c.id }))]
                  : selectedAssets.filter((sc) => !currentPageAssets.some((c) => c.id === sc.id))

                setSelectedAssets(newSelections)
              }}
            />
          </div>
        )
      },
      cell: ({ row }: { row: Row<Asset> }) => {
        const { id } = row.original
        const isChecked = selectedAssets.some((c) => c.id === id)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isChecked} onCheckedChange={() => toggleSelection({ id })} />
          </div>
        )
      },
      size: 50,
    },
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'name', header: 'Name', size: 100, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'accessModelName', header: 'Access Model', size: 140 },
    { accessorKey: 'assetDataClassificationName', header: 'Data Classification', size: 140 },
    { accessorKey: 'assetSubtypeName', header: 'Subtype', size: 120 },
    { accessorKey: 'assetType', header: 'Type', size: 120 },
    { accessorKey: 'costCenter', header: 'Cost Center', size: 120 },
    { accessorKey: 'cpe', header: 'CPE', size: 120 },
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
    { accessorKey: 'criticalityName', header: 'Criticality', size: 120 },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 200,
      minSize: 150,
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string) || '',
    },
    { accessorKey: 'containsPii', header: 'Contains PII', size: 100, cell: ({ cell }) => (cell.getValue() ? 'Yes' : 'No') },

    { accessorKey: 'encryptionStatusName', header: 'Encryption Status', size: 140 },
    { accessorKey: 'environmentName', header: 'Environment', size: 120 },
    { accessorKey: 'estimatedMonthlyCost', header: 'Est. Monthly Cost', size: 120 },
    { accessorKey: 'identifier', header: 'Identifier', size: 120 },
    { accessorKey: 'physicalLocation', header: 'Physical Location', size: 120 },
    { accessorKey: 'purchaseDate', header: 'Purchase Date', size: 120, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'region', header: 'Region', size: 120 },
    { accessorKey: 'scopeName', header: 'Scope', size: 120 },
    { accessorKey: 'securityTierName', header: 'Security Tier', size: 120 },
    { accessorKey: 'sourceIdentifier', header: 'Source Identifier', size: 120 },
    { accessorKey: 'sourceType', header: 'Source Type', size: 120 },
    {
      accessorKey: 'tags',
      header: 'Tags',
      size: 140,
      cell: ({ row }) => {
        const tags = row?.original?.tags
        if (!tags?.length) {
          return '-'
        }
        return <div className="flex gap-2">{row?.original?.tags?.map((tag, i) => <TagChip key={i} tag={tag} />)}</div>
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
    { accessorKey: 'website', header: 'Website', size: 120 },
  ]
}
