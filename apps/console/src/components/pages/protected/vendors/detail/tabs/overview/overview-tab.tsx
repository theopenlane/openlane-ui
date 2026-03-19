'use client'

import React, { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Check, X, Plus, Trash2 } from 'lucide-react'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import type { EntityQuery, GetEntityAssociationsQuery } from '@repo/codegen/src/schema'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useNotification } from '@/hooks/useNotification'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import AddDomainDialog from './add-domain-dialog'
import AddAssetDialog from './add-asset-dialog'

interface OverviewTabProps {
  vendor: EntityQuery['entity']
  associations?: GetEntityAssociationsQuery
  isEditing: boolean
  canEdit: boolean
}

type SubTab = 'domains' | 'security' | 'dependencies'

const OverviewTab: React.FC<OverviewTabProps> = ({ vendor, associations, canEdit }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('domains')

  return (
    <div className="space-y-6">
      {vendor.description && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Description</p>
          <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: vendor.description }} />
        </div>
      )}

      {vendor.tags && vendor.tags.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Provided Services</p>
          <div className="flex flex-wrap gap-2">
            {vendor.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as SubTab)} variant="solid">
        <TabsList className="w-fit">
          <TabsTrigger value="domains" className="whitespace-nowrap">
            Domains
          </TabsTrigger>
          <TabsTrigger value="security" className="whitespace-nowrap">
            Security Settings
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="whitespace-nowrap">
            Dependencies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="domains">
          <DomainsSection domains={vendor.domains ?? []} vendorId={vendor.id} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySection vendor={vendor} />
        </TabsContent>

        <TabsContent value="dependencies">
          <DependenciesSection vendor={vendor} associations={associations} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface DomainsSectionProps {
  domains: string[]
  vendorId: string
  canEdit: boolean
}

const DomainsSection: React.FC<DomainsSectionProps> = ({ domains, vendorId, canEdit }) => {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const updateEntityMutation = useUpdateEntity()
  const { successNotification, errorNotification } = useNotification()

  const handleRemoveDomain = async (domainToRemove: string) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendorId,
        input: {
          domains: domains.filter((d) => d !== domainToRemove),
        },
      })
      successNotification({
        title: 'Domain removed',
        description: `${domainToRemove} has been removed.`,
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
        <h3 className="text-lg font-semibold">Domains</h3>
        {canEdit && (
          <Button type="button" variant="secondary" icon={<Plus size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setShowAddDialog(true)}>
            Add Domain
          </Button>
        )}
      </div>
      {domains.length > 0 ? (
        <div className="space-y-3">
          {domains.map((domain) => (
            <div key={domain} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
              {domain}
              {canEdit && (
                <button type="button" onClick={() => handleRemoveDomain(domain)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No domains configured</p>
      )}
      {showAddDialog && <AddDomainDialog vendorId={vendorId} existingDomains={domains} onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

const SecuritySection: React.FC<{ vendor: EntityQuery['entity'] }> = ({ vendor }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
      <div className="space-y-3">
        <SecurityCard label="Single Sign-On (SSO)">
          <StatusBadge label="Enforced" enabled={vendor.ssoEnforced ?? false} />
        </SecurityCard>
        <SecurityCard label="Multi-Factor Authentication (MFA)">
          <StatusBadge label="Supported" enabled={vendor.mfaSupported ?? false} />
          <StatusBadge label="Enforced" enabled={vendor.mfaEnforced ?? false} />
        </SecurityCard>
        <SecurityCard label="SOC 2 Compliance">
          <StatusBadge label="Compliant" enabled={vendor.hasSoc2 ?? false} />
          {vendor.soc2PeriodEnd && <span className="text-xs text-muted-foreground">Period ends: {vendor.soc2PeriodEnd}</span>}
        </SecurityCard>
      </div>
    </div>
  )
}

const SecurityCard: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
    <span className="text-sm font-medium">{label}</span>
    <div className="flex items-center gap-3">{children}</div>
  </div>
)

const StatusBadge: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => (
  <div className="flex items-center gap-1">
    {enabled ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-destructive" />}
    <span className="text-sm">{label}</span>
  </div>
)

interface DependenciesSectionProps {
  vendor: EntityQuery['entity']
  associations?: GetEntityAssociationsQuery
  canEdit: boolean
}

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

export default OverviewTab
