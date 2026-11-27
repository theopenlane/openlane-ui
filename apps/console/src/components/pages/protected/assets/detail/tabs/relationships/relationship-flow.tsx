'use client'

import React from 'react'
import { Background, Handle, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { INTERACTIVE_NODE_STYLE, STATIC_FLOW_HANDLE_CLASS, STATIC_FLOW_PROPS } from '@/components/shared/static-flow/static-flow'
import { Link } from '@/components/shared/link/link'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { type ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { AssetTypeIcon } from '@/components/shared/enum-mapper/asset-enum'
import { type AssetAssetType } from '@repo/codegen/src/schema'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { pluralizeWithCount } from '@/utils/strings'

const FLOW_NODE_WIDTH = 220
export const FLOW_COLUMN_WIDTH = FLOW_NODE_WIDTH + 80
export const FLOW_ROW_HEIGHT = 72
export const FLOW_CURRENT_ROW_HEIGHT = 116
export const FLOW_PADDING = 24

type TFlowNodeData = {
  title: string
  subtitle?: string
  href?: string
  sheet?: { id: string; kind: ObjectAssociationNodeEnum }
  assetType?: AssetAssetType
  isCurrent?: boolean
  isOnPath?: boolean
  isOverflow?: boolean
  connectionCount?: number
  onShowConnections?: () => void
}

export type TFlowNode = Node<TFlowNodeData, 'relationship'>

const RelationshipNode = ({ data }: NodeProps<TFlowNode>) => {
  const openObjectSheet = useOpenObjectSheet()
  const { title, subtitle, href, sheet, assetType, isCurrent, isOnPath, isOverflow, connectionCount, onShowConnections } = data

  const label = sheet ? (
    <ObjectSheetLink id={sheet.id} kind={sheet.kind} label={title} onOpenSheet={openObjectSheet} />
  ) : href ? (
    <Link href={href} prefetch={false}>
      {title}
    </Link>
  ) : (
    title
  )

  return (
    <>
      <Handle type="target" position={Position.Left} className={STATIC_FLOW_HANDLE_CLASS} isConnectable={false} />
      <div
        style={{ width: FLOW_NODE_WIDTH }}
        className={cn(
          'nodrag nopan rounded-md border bg-card px-3 py-2 text-left',
          isOnPath && 'border-info',
          isCurrent && 'border-2 border-info bg-[color-mix(in_srgb,var(--color-info)_12%,var(--color-card))]',
          isOverflow && 'border-dashed bg-transparent',
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium" title={title}>
          {assetType && <AssetTypeIcon assetType={assetType} size={14} className="shrink-0 text-muted-foreground" />}
          <span className="truncate">{label}</span>
        </div>
        {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
        {isCurrent && (
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="outline">This asset</Badge>
            {onShowConnections && (
              <Button type="button" variant="link" className="text-xs" icon={<ChevronRight />} onClick={onShowConnections}>
                {pluralizeWithCount(connectionCount ?? 0, 'connection')}
              </Button>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className={STATIC_FLOW_HANDLE_CLASS} isConnectable={false} />
    </>
  )
}

const NODE_TYPES = { relationship: RelationshipNode }

type TFlowNodeArgs = { id: string; x: number; y: number; data: TFlowNodeData }

export const flowNode = ({ id, x, y, data }: TFlowNodeArgs): TFlowNode => ({
  id,
  type: 'relationship',
  position: { x, y },
  data,
  draggable: false,
  selectable: false,
  style: INTERACTIVE_NODE_STYLE,
})

type TFlowEdgeArgs = { source: string; target: string; isOnPath?: boolean; hasArrow?: boolean }

export const flowEdge = ({ source, target, isOnPath = false, hasArrow = false }: TFlowEdgeArgs): Edge => {
  const color = isOnPath ? 'var(--color-info)' : 'var(--color-muted-foreground)'
  return {
    id: `${source}->${target}`,
    source,
    target,
    markerEnd: hasArrow ? { type: MarkerType.ArrowClosed, color } : undefined,
    style: { stroke: color, strokeWidth: isOnPath ? 2 : 1.25, strokeDasharray: isOnPath || hasArrow ? undefined : '5 4', opacity: isOnPath || hasArrow ? 1 : 0.6 },
  }
}

type TRelationshipFlowProps = {
  label: string
  columns: string[]
  nodes: TFlowNode[]
  edges: Edge[]
  height: number
}

const RelationshipFlow: React.FC<TRelationshipFlowProps> = ({ label, columns, nodes, edges, height }) => {
  const width = columns.length * FLOW_COLUMN_WIDTH + FLOW_PADDING

  return (
    <div className="overflow-x-auto" role="region" aria-label={label}>
      <div style={{ minWidth: width }}>
        <div className="flex border-b py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase" style={{ paddingLeft: FLOW_PADDING }}>
          {columns.map((column) => (
            <span key={column} style={{ width: FLOW_COLUMN_WIDTH }}>
              {column}
            </span>
          ))}
        </div>
        <div style={{ height }} className="w-full">
          <ReactFlow<TFlowNode, Edge> {...STATIC_FLOW_PROPS} nodes={nodes} edges={edges} nodeTypes={NODE_TYPES} defaultViewport={{ x: FLOW_PADDING, y: FLOW_PADDING, zoom: 1 }}>
            <Background gap={24} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

export default RelationshipFlow
