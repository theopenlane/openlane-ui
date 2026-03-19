'use client'

import React, { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import type { EntityQuery, GetEntityAssociationsQuery } from '@repo/codegen/src/schema'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useNotification } from '@/hooks/useNotification'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import AddAssetDialog from './add-asset-dialog'

type AssetEdges = NonNullable<NonNullable<NonNullable<GetEntityAssociationsQuery['entity']>['assets']>['edges']>
type AssetNode = NonNullable<NonNullable<AssetEdges[number]>['node']>

const getAssetColumns = (canEdit: boolean, onRemove: (asset: AssetNode) => void): ColumnDef<AssetNode>[] => {
  const cols: ColumnDef<AssetNode>[] = [
    { accessorKey: 'name', header: 'Name', size: 200, cell: ({ row }) => <span>{row.original.displayName || row.original.name}</span> },
    { accessorKey: 'environmentName', header: 'Environment', size: 150, cell: ({ row }) => <span className="text-muted-foreground">{row.original.environmentName ?? '—'}</span> },
    { accessorKey: 'scopeName', header: 'Scope', size: 150, cell: ({ row }) => <span className="text-muted-foreground">{row.original.scopeName ?? '—'}</span> },
    { accessorKey: 'assetType', header: 'Type', size: 150, cell: ({ row }) => <span className="text-muted-foreground">{row.original.assetType ? getEnumLabel(row.original.assetType) : '—'}</span> },
  ]

  if (canEdit) {
    cols.push({
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onRemove(row.original)} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    })
  }

  return cols
}

interface DependenciesSectionProps {
  vendor: EntityQuery['entity']
  associations?: GetEntityAssociationsQuery
  canEdit: boolean
}

const DependenciesSection: React.FC<DependenciesSectionProps> = ({ vendor, associations, canEdit }) => {
  const [showAddAssetDialog, setShowAddAssetDialog] = useState(false)
  const [assetToRemove, setAssetToRemove] = useState<{ id: string; name: string } | null>(null)
  const updateEntityMutation = useUpdateEntity()
  const { successNotification, errorNotification } = useNotification()
  const smartRouter = useSmartRouter()

  const assets = associations?.entity?.assets?.edges?.map((e) => e?.node).filter((node): node is AssetNode => Boolean(node)) ?? []
  const linkedAssetIds = assets.map((a) => a.id)

  const columns = getAssetColumns(canEdit, (asset) => setAssetToRemove({ id: asset.id, name: asset.displayName || asset.name }))

  const handleRemoveAsset = async (assetId: string, assetName: string) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendor.id,
        input: {
          removeAssetIDs: [assetId],
        },
      })
      successNotification({
        title: 'Asset removed',
        description: `${assetName} has been removed.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Assets</h3>
        {canEdit && (
          <Button type="button" variant="secondary" icon={<Plus size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setShowAddAssetDialog(true)}>
            Add Asset
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={assets} noResultsText="No assets configured" onRowClick={(row) => smartRouter.replace({ assetId: row.id })} tableKey="vendor-assets" />
      {showAddAssetDialog && <AddAssetDialog vendorId={vendor.id} linkedAssetIds={linkedAssetIds} onClose={() => setShowAddAssetDialog(false)} />}
      <ConfirmationDialog
        open={!!assetToRemove}
        onOpenChange={(open) => !open && setAssetToRemove(null)}
        onConfirm={async () => {
          if (assetToRemove) {
            await handleRemoveAsset(assetToRemove.id, assetToRemove.name)
            setAssetToRemove(null)
          }
        }}
        title={`Remove ${assetToRemove?.name ?? 'asset'}?`}
        description={<>This will unlink the asset from this vendor. The asset will not be deleted.</>}
        confirmationText="Remove"
        confirmationTextVariant="destructive"
        showInput={false}
      />
    </div>
  )
}

export default DependenciesSection
