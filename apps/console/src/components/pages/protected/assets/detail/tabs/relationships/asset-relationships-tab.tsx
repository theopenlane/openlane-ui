'use client'

import React, { useMemo, useState } from 'react'
import { ArrowLeft, Link2, Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useAssetRelationships, useAssetTopology } from '@/lib/graphql-hooks/asset-detail'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { pluralizeWithCount } from '@/utils/strings'
import { getAssetTitle, type AssetDetailNode } from '../../../asset-display'
import { buildConnections, CONNECTION_COLUMNS } from './connections-model'
import LinkRecordsDialog, { type TLinkField } from './link-records-dialog'
import RelationshipFlow from './relationship-flow'
import { AssetPicker, PlatformPicker, SystemPicker } from './relationship-pickers'
import { useSaveAssetConnections } from './use-save-asset-connections'
import SystemDetailsCard from './system-details-card'
import { buildTopology, TOPOLOGY_COLUMNS } from './topology-model'

type TConnectedAsset = Pick<AssetDetailNode, 'id' | 'name' | 'displayName' | 'assetType' | 'assetSubtypeName'>

type TAssetRelationshipsTabProps = {
  asset: AssetDetailNode
  canEdit: boolean
  handleUpdate: (input: UpdateAssetInput, options?: TPersistOptions) => Promise<void>
}

const toAssetItem = ({ assetType, assetSubtypeName, ...asset }: TConnectedAsset) => ({ id: asset.id, name: getAssetTitle(asset), assetType, assetSubtypeName })

const AssetRelationshipsTab: React.FC<TAssetRelationshipsTabProps> = ({ asset, canEdit, handleUpdate }) => {
  const [isConnectionsView, setIsConnectionsView] = useState(false)
  const [dialog, setDialog] = useState<'connections' | 'placement' | null>(null)
  const relationshipsQuery = useAssetRelationships(asset.id)
  const topology = useAssetTopology(asset.id)
  const saveConnections = useSaveAssetConnections(asset.id)
  const relationships = relationshipsQuery.data?.asset
  useQueryErrorNotification({ error: relationshipsQuery.error ?? topology.error, description: 'Failed to load relationships' })

  const connectionCount = (relationships?.connectedAssets.totalCount ?? 0) + (relationships?.connectedFrom.totalCount ?? 0)
  const hasConnections = connectionCount > 0
  const platforms = getNodes(relationships?.platforms)
  const systems = getNodes(relationships?.systemDetails)

  const topologyModel = useMemo(
    () =>
      buildTopology({
        asset,
        platforms: topology.platforms,
        systems: topology.systems,
        connectionCount,
        onShowConnections: hasConnections || canEdit ? () => setIsConnectionsView(true) : undefined,
      }),
    [asset, topology.platforms, topology.systems, connectionCount, hasConnections, canEdit],
  )
  const connectionsModel = useMemo(() => (relationships ? buildConnections(asset, relationships) : null), [asset, relationships])

  if (relationshipsQuery.isPending || topology.isPending) {
    return <Skeleton height={320} className="w-full rounded-lg" role="status" aria-label="Loading relationships" />
  }

  if (!relationships || !connectionsModel || topology.isError) {
    return <EmptyTabState title="Relationships unavailable" description="The relationships of this asset could not be loaded." />
  }

  const placementFields: TLinkField<'platformIDs' | 'systemDetailIDs'>[] = []
  if (relationships.platforms) {
    placementFields.push({ key: 'platformIDs', label: 'Platforms', linked: platforms, renderPicker: (props) => <PlatformPicker {...props} /> })
  }
  if (relationships.systemDetails) {
    placementFields.push({
      key: 'systemDetailIDs',
      label: 'Systems',
      linked: systems.map(({ id, systemName }) => ({ id, name: systemName })),
      renderPicker: (props) => <SystemPicker {...props} />,
    })
  }
  const hiddenConnections = connectionCount - getNodes(relationships.connectedAssets).length - getNodes(relationships.connectedFrom).length
  const saveLinks = (input: UpdateAssetInput) => handleUpdate(input, { throwOnError: true })

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-xl p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {isConnectionsView && (
              <Button type="button" variant="secondary" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => setIsConnectionsView(false)}>
                Back
              </Button>
            )}
            <h2 className="text-lg font-medium break-words">{isConnectionsView ? `Connections · ${getAssetTitle(asset)}` : 'Platform and Systems'}</h2>
          </div>
          {canEdit &&
            (isConnectionsView ? (
              <Button type="button" variant="secondary" icon={<Plus size={16} />} iconPosition="left" onClick={() => setDialog('connections')}>
                Connect asset
              </Button>
            ) : (
              placementFields.length > 0 && (
                <Button type="button" variant="secondary" icon={<Link2 size={16} />} iconPosition="left" onClick={() => setDialog('placement')}>
                  Edit links
                </Button>
              )
            ))}
        </div>
        {isConnectionsView ? (
          hasConnections ? (
            <RelationshipFlow label="Asset connections" columns={CONNECTION_COLUMNS} {...connectionsModel} />
          ) : (
            <EmptyTabState title="No connections" description="Connect this asset to the assets it depends on or that depend on it." />
          )
        ) : (
          <RelationshipFlow label="Platforms, systems and assets" columns={TOPOLOGY_COLUMNS} {...topologyModel} />
        )}
        {isConnectionsView && hiddenConnections > 0 && <p className="px-4 pb-3 text-xs text-muted-foreground">{pluralizeWithCount(hiddenConnections, 'more connection')} not shown</p>}
        {!isConnectionsView && topology.hiddenPlatforms > 0 && <p className="px-4 pb-3 text-xs text-muted-foreground">{pluralizeWithCount(topology.hiddenPlatforms, 'more platform')} not shown</p>}
        {!isConnectionsView && topology.hiddenSystems > 0 && <p className="px-4 pb-3 text-xs text-muted-foreground">{pluralizeWithCount(topology.hiddenSystems, 'more system')} not shown</p>}
      </Card>

      {!isConnectionsView && (
        <ul className="flex flex-wrap gap-5 text-xs text-muted-foreground" aria-label="Legend">
          <li className="inline-flex items-center gap-2">
            <span className="w-5 border-t-2 border-info" aria-hidden /> This asset&apos;s path
          </li>
          <li className="inline-flex items-center gap-2">
            <span className="w-5 border-t border-dashed border-muted-foreground" aria-hidden /> Other parts of the platform
          </li>
        </ul>
      )}

      {systems.map((system) => (
        <SystemDetailsCard key={system.id} system={system} />
      ))}

      {dialog === 'connections' && (
        <LinkRecordsDialog
          title="Connect asset"
          onOpenChange={(open) => !open && setDialog(null)}
          onSave={saveConnections}
          fields={[
            {
              key: 'connectedFromIDs',
              label: 'Connects to this',
              linked: getNodes(relationships.connectedFrom).map(toAssetItem),
              renderPicker: (props) => <AssetPicker {...props} excludeId={asset.id} />,
            },
            {
              key: 'connectedAssetIDs',
              label: 'This connects to',
              linked: getNodes(relationships.connectedAssets).map(toAssetItem),
              renderPicker: (props) => <AssetPicker {...props} excludeId={asset.id} />,
            },
          ]}
        />
      )}
      {dialog === 'placement' && <LinkRecordsDialog title="Edit links" onOpenChange={(open) => !open && setDialog(null)} onSave={saveLinks} fields={placementFields} />}
    </div>
  )
}

export default AssetRelationshipsTab
