import { type Edge } from '@xyflow/react'
import { type AssetTopologyPlatform, type AssetTopologySystem } from '@/lib/graphql-hooks/asset-detail'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { pluralizeWithCount } from '@/utils/strings'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { getAssetKindLabel, getAssetTitle, type AssetDetailNode } from '../../../asset-display'
import { FLOW_CURRENT_ROW_HEIGHT, FLOW_COLUMN_WIDTH, FLOW_PADDING, FLOW_ROW_HEIGHT, flowEdge, flowNode, type TFlowNode } from './relationship-flow'

export const TOPOLOGY_COLUMNS = ['Platform', 'System', 'Asset']
const MAX_SIBLING_SYSTEMS = 4

const COLUMN_X = { platform: 0, system: FLOW_COLUMN_WIDTH, asset: FLOW_COLUMN_WIDTH * 2 }

type TBuildTopologyArgs = {
  asset: AssetDetailNode
  platforms: AssetTopologyPlatform[]
  systems: AssetTopologySystem[]
  connectionCount: number
  onShowConnections?: () => void
}

type TTopologyModel = { nodes: TFlowNode[]; edges: Edge[]; height: number }

const midpoint = (ys: number[]) => (Math.min(...ys) + Math.max(...ys)) / 2

export const buildTopology = ({ asset, platforms, systems, connectionCount, onShowConnections }: TBuildTopologyArgs): TTopologyModel => {
  const nodes: TFlowNode[] = []
  const edges: Edge[] = []
  const ys = new Map<string, number>()
  const assetNodeId = `asset:${asset.id}`
  const assetSystemIds = new Set(systems.map(({ id }) => id))
  const systemsById = new Map(systems.map((system) => [system.id, system]))
  const placedSystemIds = new Set<string>()
  let cursor = 0

  const place = (id: string, x: number, y: number, data: TFlowNode['data']) => {
    ys.set(id, y)
    nodes.push(flowNode({ id, x, y, data }))
  }

  const placeLeaf = (id: string, data: TFlowNode['data']) => {
    const known = ys.get(id)
    if (known !== undefined) return known
    const y = cursor
    cursor += data.isCurrent ? FLOW_CURRENT_ROW_HEIGHT : FLOW_ROW_HEIGHT
    place(id, COLUMN_X.asset, y, data)
    return y
  }

  const placeCurrentAsset = () =>
    placeLeaf(assetNodeId, { title: getAssetTitle(asset), subtitle: getAssetKindLabel(asset), assetType: asset.assetType, isCurrent: true, isOnPath: true, connectionCount, onShowConnections })

  const placeSystem = (system: AssetTopologySystem) => {
    const systemNodeId = `system:${system.id}`
    const known = ys.get(systemNodeId)
    if (known !== undefined) return known
    placedSystemIds.add(system.id)

    const containsAsset = assetSystemIds.has(system.id)
    const listed = getNodes(system.assets).sort((a, b) => Number(b.id === asset.id) - Number(a.id === asset.id))
    const isListed = listed.some(({ id }) => id === asset.id)
    const start = cursor
    const leafYs = listed.map((node) => {
      const leafId = `asset:${node.id}`
      const y =
        node.id === asset.id
          ? placeCurrentAsset()
          : placeLeaf(leafId, { title: getAssetTitle(node), subtitle: getAssetKindLabel(node), assetType: node.assetType, sheet: { id: node.id, kind: ObjectAssociationNodeEnum.ASSET } })
      edges.push(flowEdge({ source: systemNodeId, target: leafId, isOnPath: node.id === asset.id }))
      return y
    })
    if (containsAsset && !isListed) {
      leafYs.push(placeCurrentAsset())
      edges.push(flowEdge({ source: systemNodeId, target: assetNodeId, isOnPath: true }))
    }
    const hidden = system.assets.totalCount - listed.length - (containsAsset && !isListed ? 1 : 0)
    if (hidden > 0) {
      const overflowId = `overflow:${system.id}`
      leafYs.push(placeLeaf(overflowId, { title: `+${pluralizeWithCount(hidden, 'more asset')}`, sheet: { id: system.id, kind: ObjectAssociationNodeEnum.SYSTEM_DETAIL }, isOverflow: true }))
      edges.push(flowEdge({ source: systemNodeId, target: overflowId }))
    }

    const ownYs = leafYs.filter((y) => y >= start)
    if (ownYs.length === 0) cursor += FLOW_ROW_HEIGHT
    const y = ownYs.length > 0 ? midpoint(ownYs) : start
    place(systemNodeId, COLUMN_X.system, y, {
      title: system.systemName,
      subtitle: system.sensitivityLevel ? `${getEnumLabel(system.sensitivityLevel)} sensitivity` : undefined,
      sheet: { id: system.id, kind: ObjectAssociationNodeEnum.SYSTEM_DETAIL },
      isOnPath: containsAsset,
    })
    return y
  }

  platforms.forEach((platform) => {
    const platformNodeId = `platform:${platform.id}`
    const start = cursor
    const listedSystems = getNodes(platform.systemDetails)
    const assetSystems = getNodes(platform.assetSystems).flatMap(({ id }) => systemsById.get(id) ?? [])
    const pathIds = new Set(assetSystems.map(({ id }) => id))
    const shownSystems = [...assetSystems, ...listedSystems.filter(({ id }) => !pathIds.has(id)).slice(0, MAX_SIBLING_SYSTEMS)]
    const childYs: number[] = []

    if (platform.linkedAsset.totalCount > 0 && assetSystems.length === 0) {
      childYs.push(placeCurrentAsset())
      edges.push(flowEdge({ source: platformNodeId, target: assetNodeId, isOnPath: true }))
    }
    shownSystems.forEach((system) => {
      childYs.push(placeSystem(system))
      edges.push(flowEdge({ source: platformNodeId, target: `system:${system.id}`, isOnPath: assetSystemIds.has(system.id) }))
    })
    const hidden = (platform.systemDetails?.totalCount ?? 0) - shownSystems.length
    if (hidden > 0) {
      const overflowId = `overflow:${platform.id}`
      const y = cursor
      cursor += FLOW_ROW_HEIGHT
      place(overflowId, COLUMN_X.system, y, { title: `+${pluralizeWithCount(hidden, 'more system')}`, href: getHrefForObjectType('platforms', { id: platform.id }), isOverflow: true })
      edges.push(flowEdge({ source: platformNodeId, target: overflowId }))
      childYs.push(y)
    }
    const ownYs = childYs.filter((y) => y >= start)
    if (ownYs.length === 0) cursor += FLOW_ROW_HEIGHT
    place(platformNodeId, COLUMN_X.platform, ownYs[0] ?? start, {
      title: platform.name,
      subtitle: getEnumLabel(platform.status),
      href: getHrefForObjectType('platforms', { id: platform.id }),
      isOnPath: true,
    })
  })

  systems.filter(({ id }) => !placedSystemIds.has(id)).forEach(placeSystem)
  placeCurrentAsset()

  return { nodes, edges, height: cursor + FLOW_PADDING * 2 }
}
