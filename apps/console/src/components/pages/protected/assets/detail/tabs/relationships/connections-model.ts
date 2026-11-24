import { type Edge } from '@xyflow/react'
import { type AssetRelationships } from '@/lib/graphql-hooks/asset-detail'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { getAssetKindLabel, getAssetTitle, type AssetDetailNode } from '../../../asset-display'
import { FLOW_COLUMN_WIDTH, FLOW_PADDING, FLOW_ROW_HEIGHT, flowEdge, flowNode, type TFlowNode } from './relationship-flow'

export const CONNECTION_COLUMNS = ['Connects to this', 'This asset', 'This connects to']

export const buildConnections = (asset: AssetDetailNode, relationships: AssetRelationships): { nodes: TFlowNode[]; edges: Edge[]; height: number } => {
  const incoming = getNodes(relationships.connectedFrom)
  const outgoing = getNodes(relationships.connectedAssets)
  const rowCount = Math.max(incoming.length, outgoing.length, 1)
  const columnTop = (count: number) => ((rowCount - count) * FLOW_ROW_HEIGHT) / 2
  const currentId = `current:${asset.id}`

  const columnNodes = (assets: typeof incoming, prefix: string, x: number) =>
    assets.map((node, index) =>
      flowNode({
        id: `${prefix}:${node.id}`,
        x,
        y: columnTop(assets.length) + index * FLOW_ROW_HEIGHT,
        data: { title: getAssetTitle(node), subtitle: getAssetKindLabel(node), assetId: node.id },
      }),
    )

  return {
    nodes: [
      ...columnNodes(incoming, 'from', 0),
      flowNode({ id: currentId, x: FLOW_COLUMN_WIDTH, y: columnTop(1), data: { title: getAssetTitle(asset), subtitle: getAssetKindLabel(asset), isOnPath: true } }),
      ...columnNodes(outgoing, 'to', FLOW_COLUMN_WIDTH * 2),
    ],
    edges: [
      ...incoming.map((node) => flowEdge({ source: `from:${node.id}`, target: currentId, hasArrow: true })),
      ...outgoing.map((node) => flowEdge({ source: currentId, target: `to:${node.id}`, hasArrow: true })),
    ],
    height: rowCount * FLOW_ROW_HEIGHT + FLOW_PADDING * 2,
  }
}
