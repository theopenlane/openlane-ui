import { AssetHistoryOpType, type GetAssetHistoriesQuery } from '@repo/codegen/src/historyschema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { type TimelineNode } from '@/lib/graphql-hooks/associations-timeline'
import { type AssetVendorNode } from '@/lib/graphql-hooks/asset-detail'
import { vendorDisplayName } from '@/lib/graphql-hooks/entity'
import { formatCurrency, formatDate } from '@/utils/date'
import { toHumanLabel } from '@/utils/strings'
import { type TOwnershipChange } from '@/components/pages/protected/exposure/detail/history/history-events'
import { byLine, type TResolveAuthor } from '@/components/pages/protected/exposure/detail/history/timeline-model'
import { exposureKindLabel } from '../exposure/exposure-columns'
import { type TExposureItem } from '../exposure/exposure-items'

type AssetHistoryNode = NonNullable<NonNullable<NonNullable<GetAssetHistoriesQuery['assetHistories']['edges']>[number]>['node']>

type TAssetHistoryCategory = 'fields' | 'exposure' | 'vendor'

type TAssetHistoryEvent = TimelineNode & { category: TAssetHistoryCategory }

type TTrackedField = {
  key: keyof AssetHistoryNode
  label: string
  format?: (node: AssetHistoryNode) => string | null
  hideValues?: boolean
}

const listLabel = (values: string[] | null | undefined) => (values?.length ? values.join(', ') : null)

const TRACKED_FIELDS: TTrackedField[] = [
  { key: 'name', label: 'Name' },
  { key: 'displayName', label: 'Display name' },
  { key: 'description', label: 'Description', hideValues: true },
  { key: 'identifier', label: 'Identifier' },
  { key: 'website', label: 'Website' },
  { key: 'assetType', label: 'Type', format: (node) => getEnumLabel(node.assetType) },
  { key: 'assetSubtypeName', label: 'Subtype' },
  { key: 'environmentName', label: 'Environment' },
  { key: 'scopeName', label: 'Scope' },
  { key: 'criticalityName', label: 'Criticality' },
  { key: 'assetDataClassificationName', label: 'Data classification' },
  { key: 'securityTierName', label: 'Security tier' },
  { key: 'encryptionStatusName', label: 'Encryption status' },
  { key: 'accessModelName', label: 'Access model' },
  { key: 'containsPii', label: 'Contains PII', format: (node) => (node.containsPii ? 'Yes' : 'No') },
  { key: 'physicalLocation', label: 'Physical location' },
  { key: 'region', label: 'Region' },
  { key: 'estimatedMonthlyCost', label: 'Estimated monthly cost', format: (node) => (node.estimatedMonthlyCost ? (formatCurrency(node.estimatedMonthlyCost) ?? null) : null) },
  { key: 'costCenter', label: 'Cost center' },
  { key: 'purchaseDate', label: 'Purchase date', format: (node) => (node.purchaseDate ? formatDate(node.purchaseDate) : null) },
  { key: 'cpe', label: 'CPE' },
  { key: 'sourceType', label: 'Source type', format: (node) => getEnumLabel(node.sourceType) },
  { key: 'sourceIdentifier', label: 'Source identifier' },
  { key: 'categories', label: 'Categories', format: (node) => listLabel(node.categories) },
  { key: 'tags', label: 'Tags', format: (node) => listLabel(node.tags) },
]

const fieldValue = ({ key, format }: TTrackedField, node: AssetHistoryNode): string | null => {
  if (format) return format(node)
  const value = node[key]
  return typeof value === 'string' ? value.trim() || null : null
}

const ASSET_LABEL = toHumanLabel(ObjectTypes.ASSET)

const fieldChangeEvents = (nodesNewestFirst: AssetHistoryNode[], resolveAuthor: TResolveAuthor): TAssetHistoryEvent[] =>
  nodesNewestFirst.flatMap((node, index) => {
    const previous = nodesNewestFirst[index + 1]
    if (node.operation !== AssetHistoryOpType.UPDATE || !previous) return []
    return TRACKED_FIELDS.flatMap((field) => {
      const from = fieldValue(field, previous)
      const to = fieldValue(field, node)
      if (from === to) return []
      const phrase = field.hideValues ? 'Updated' : `${from ?? 'Not set'} → ${to ?? 'Not set'}`
      return [
        {
          id: `${node.id}:${field.key}`,
          category: 'fields' as const,
          type: ASSET_LABEL,
          name: `${field.label} ${to === null ? 'cleared' : from === null ? 'set' : 'changed'}`,
          createdAt: node.historyTime,
          subtext: byLine(phrase, node.updatedBy ?? node.createdBy, node.historyTime, resolveAuthor),
        },
      ]
    })
  })

type TBuildAssetHistoryArgs = {
  asset: { id: string; createdAt?: string | null; createdBy?: string | null }
  title: string
  sourceLabel: string | null
  histories: AssetHistoryNode[]
  ownershipChanges: TOwnershipChange[]
  exposure: TExposureItem[]
  vendors: AssetVendorNode[]
  resolveAuthor: TResolveAuthor
  resolveSource: (definitionID: string | null | undefined, fallback?: string | null) => string | null
}

export const buildAssetHistory = ({ asset, title, sourceLabel, histories, ownershipChanges, exposure, vendors, resolveAuthor, resolveSource }: TBuildAssetHistoryArgs): TAssetHistoryEvent[] => {
  const linkedEvent = (record: { createdAt?: string | null; createdBy?: string | null }, source: string | null) => {
    if (!record.createdAt) return null
    const created = byLine(source ? `Created from ${source}` : 'Created', record.createdBy, record.createdAt, resolveAuthor)
    const predatesAsset = !!asset.createdAt && new Date(record.createdAt) < new Date(asset.createdAt)
    return predatesAsset && asset.createdAt ? { createdAt: asset.createdAt, subtext: `Associated with this asset · ${created}` } : { createdAt: record.createdAt, subtext: created }
  }

  const events: TAssetHistoryEvent[] = [
    ...fieldChangeEvents(histories, resolveAuthor),
    ...ownershipChanges.map((change) => ({
      id: change.id,
      category: 'fields' as const,
      type: ASSET_LABEL,
      name: `${change.field} ${change.to === null ? 'cleared' : change.from === null ? 'set' : 'changed'}`,
      createdAt: change.at,
      subtext: byLine(`${change.from ?? 'Not set'} → ${change.to ?? 'Not set'}`, change.actorId, change.at, resolveAuthor),
    })),
    ...exposure.flatMap((item) => {
      const event = linkedEvent(item, resolveSource(item.sourceDefinitionID, item.source))
      return event ? [{ ...event, id: item.id, category: 'exposure' as const, type: exposureKindLabel(item.kind), name: item.title, sheetKind: item.kind }] : []
    }),
    ...vendors.flatMap((vendor) => {
      const event = linkedEvent(vendor, resolveSource(vendor.sourceDefinitionID))
      return event ? [{ ...event, id: vendor.id, category: 'vendor' as const, type: 'Vendor', name: vendorDisplayName(vendor), sheetKind: ObjectAssociationNodeEnum.ENTITY }] : []
    }),
    ...(asset.createdAt
      ? [
          {
            id: asset.id,
            category: 'fields' as const,
            type: ASSET_LABEL,
            role: 'source' as const,
            name: `${title} created`,
            createdAt: asset.createdAt,
            subtext: byLine(sourceLabel ? `Created from ${sourceLabel}` : 'Created', asset.createdBy, asset.createdAt, resolveAuthor),
          },
        ]
      : []),
  ]

  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
