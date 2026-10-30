'use client'

import React, { useMemo, useSyncExternalStore } from 'react'
import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { cn } from '@repo/ui/lib/utils'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { getVulnerabilityDueDate } from '@/utils/vulnerability-due-date'
import { formatDate } from '@/utils/date'
import { exposureAssetLabel, exposureStatusLabel, type TEnvironmentGroup, type TExposureRow } from './exposure-model'
import { pluralizeWithCount } from '@/utils/strings'
import { EnvironmentChip } from './environment-chip'
import { ExposureReportCard, type TExposureReportCardProps } from './exposure-report-node'

type TExposureNodeData = { kind: 'environment' | 'source' | 'asset' | 'owner'; title: string; subtitle?: string } | ({ kind: 'report' } & TExposureReportCardProps)

type TExposureNode = Node<TExposureNodeData, 'exposure'>

const COLUMN_X = { environment: 0, source: 200, report: 400, asset: 720 } as const
const ROW_HEIGHT = 76
const HEADER_OFFSET = 8

const EXPOSURE_COLUMNS = ['Environment', 'Detected by', 'Report', 'Asset']

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )

const ExposureNode = ({ data }: NodeProps<TExposureNode>) => {
  const handleClass = '!h-1 !w-1 !min-w-0 !border-0 !bg-transparent'
  const body =
    data.kind === 'environment' ? (
      <EnvironmentChip environment={data.title} />
    ) : data.kind === 'report' ? (
      <ExposureReportCard {...data} />
    ) : (
      <div className={cn('rounded-md border bg-card px-3 py-2 text-left', data.kind === 'source' ? 'w-[170px]' : 'w-[200px]', data.kind === 'owner' && 'border-dashed bg-transparent')}>
        <div className={cn('truncate text-sm font-medium', data.kind === 'owner' && 'font-mono')}>{data.title}</div>
        {data.subtitle && <div className="truncate text-xs text-muted-foreground">{data.subtitle}</div>}
      </div>
    )

  return (
    <>
      {data.kind !== 'environment' && <Handle type="target" position={Position.Left} className={handleClass} isConnectable={false} />}
      {body}
      {data.kind !== 'asset' && data.kind !== 'owner' && <Handle type="source" position={Position.Right} className={handleClass} isConnectable={false} />}
    </>
  )
}

const NODE_TYPES = { exposure: ExposureNode }

const INTERACTIVE_NODE_STYLE: React.CSSProperties = { pointerEvents: 'all' }

const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length

type TColumnEntry<TMeta> = TMeta & { ys: number[] }

const collect = <TMeta,>(map: Map<string, TColumnEntry<TMeta>>, id: string, y: number, meta: TMeta) => {
  const existing = map.get(id)
  if (existing) existing.ys.push(y)
  else map.set(id, { ...meta, ys: [y] })
}

const placeColumn = <TMeta,>(entries: Map<string, TColumnEntry<TMeta>>, startY: number) =>
  [...entries.entries()]
    .map(([id, entry]) => ({ ...entry, id, count: entry.ys.length, y: average(entry.ys) }))
    .sort((a, b) => a.y - b.y)
    .reduce<(TColumnEntry<TMeta> & { id: string; count: number; y: number })[]>((placed, entry) => {
      const previous = placed[placed.length - 1]
      return [...placed, { ...entry, y: Math.max(entry.y, previous ? previous.y + ROW_HEIGHT : startY) }]
    }, [])

const assetTarget = (environment: string, row: TExposureRow) => {
  if (row.asset) return { assetId: `asset:${environment}:${row.asset.id}`, assetLabel: exposureAssetLabel(row.asset), isOwner: false }
  const owner = row.report.externalOwnerID?.trim()
  if (owner) return { assetId: `owner:${environment}:${row.report.source ?? ''}:${owner}`, assetLabel: owner, isOwner: true }
  return { assetId: `asset:${environment}:unlinked`, assetLabel: exposureAssetLabel(null), isOwner: false }
}

type TGraphModel = { nodes: TExposureNode[]; edges: Edge[]; height: number }

const buildGraph = (groups: TEnvironmentGroup[], slaDefinitions: SlaDefinitionsNodeNonNull[], animate: boolean): TGraphModel => {
  const nodes: TExposureNode[] = []
  const edges = new Map<string, Edge>()
  let rowIndex = 0

  const addEdge = (source: string, target: string, isOpen: boolean) => {
    const id = `${source}->${target}`
    const existing = edges.get(id)
    if (existing?.data?.isOpen) return
    edges.set(id, {
      id,
      source,
      target,
      animated: isOpen && animate,
      data: { isOpen },
      style: { stroke: 'var(--color-muted-foreground)', strokeWidth: 1.25, strokeDasharray: isOpen ? '5 4' : undefined, opacity: isOpen ? 0.9 : 0.6 },
    })
  }

  groups.forEach((group) => {
    const envId = `env:${group.environment}`
    const groupStartY = rowIndex * ROW_HEIGHT + HEADER_OFFSET
    const sources = new Map<string, TColumnEntry<{ label: string }>>()
    const assets = new Map<string, TColumnEntry<{ label: string; isOwner: boolean }>>()
    const reportYs = new Map<string, number>()

    group.rows.forEach((row) => {
      const reportId = `report:${group.environment}:${row.report.id}`
      const sourceLabel = row.report.source || 'Unknown source'
      const sourceId = `source:${group.environment}:${sourceLabel}`
      const { assetId, assetLabel, isOwner } = assetTarget(group.environment, row)

      const knownY = reportYs.get(reportId)
      const reportY = knownY ?? rowIndex * ROW_HEIGHT + HEADER_OFFSET
      if (knownY === undefined) {
        reportYs.set(reportId, reportY)
        rowIndex += 1
        const { dueDate } = getVulnerabilityDueDate(row.report, slaDefinitions)
        const dueLabel = row.isOpen && dueDate ? `due ${formatDate(dueDate.toISOString())}` : null
        const subtitle = [row.report.manifestPath, dueLabel, row.hiddenAssetCount > 0 ? `+${pluralizeWithCount(row.hiddenAssetCount, 'more asset')}` : null].filter(Boolean).join(' · ')
        nodes.push({
          id: reportId,
          type: 'exposure',
          position: { x: COLUMN_X.report, y: reportY },
          data: {
            kind: 'report',
            report: row.report,
            title: exposureStatusLabel(row),
            subtitle: subtitle || row.report.externalID,
            dueLabel,
            isOpen: row.isOpen,
            isCurrent: row.isCurrent,
          },
          draggable: false,
          selectable: false,
          style: INTERACTIVE_NODE_STYLE,
        })
        collect(sources, sourceId, reportY, { label: sourceLabel })
        addEdge(envId, sourceId, row.isOpen)
        addEdge(sourceId, reportId, row.isOpen)
      }

      collect(assets, assetId, reportY, { label: assetLabel, isOwner })
      addEdge(reportId, assetId, row.isOpen)
    })

    nodes.push({
      id: envId,
      type: 'exposure',
      position: { x: COLUMN_X.environment, y: groupStartY + 18 },
      data: { kind: 'environment', title: group.environment },
      draggable: false,
      selectable: false,
    })
    const placedSources = placeColumn(sources, groupStartY)
    const placedAssets = placeColumn(assets, groupStartY)
    placedSources.forEach(({ id, label, y }) => nodes.push({ id, type: 'exposure', position: { x: COLUMN_X.source, y }, data: { kind: 'source', title: label }, draggable: false, selectable: false }))
    placedAssets.forEach(({ id, label, count, y, isOwner }) =>
      nodes.push({
        id,
        type: 'exposure',
        position: { x: COLUMN_X.asset, y },
        data: isOwner ? { kind: 'owner', title: label, subtitle: 'Not linked to an asset' } : { kind: 'asset', title: label, subtitle: pluralizeWithCount(count, 'report') },
        draggable: false,
        selectable: false,
      }),
    )
    const columnBottom = Math.max(...[...placedSources, ...placedAssets].map((entry) => entry.y + ROW_HEIGHT), rowIndex * ROW_HEIGHT + HEADER_OFFSET)
    rowIndex = Math.ceil((columnBottom - HEADER_OFFSET) / ROW_HEIGHT)
  })

  return { nodes, edges: [...edges.values()], height: Math.max(rowIndex, 1) * ROW_HEIGHT + HEADER_OFFSET * 4 }
}

type TExposureMapGraphProps = {
  groups: TEnvironmentGroup[]
  slaDefinitions: SlaDefinitionsNodeNonNull[]
  footer?: React.ReactNode
}

const ExposureMapGraph: React.FC<TExposureMapGraphProps> = ({ groups, slaDefinitions, footer }) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { nodes, edges, height } = useMemo(() => buildGraph(groups, slaDefinitions, !prefersReducedMotion), [groups, slaDefinitions, prefersReducedMotion])

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[200px_200px_320px_minmax(0,1fr)] border-b px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {EXPOSURE_COLUMNS.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          <div style={{ height }} className="w-full">
            <ReactFlow<TExposureNode, Edge>
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              fitView={false}
              defaultViewport={{ x: 12, y: 8, zoom: 1 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              panOnScroll={false}
              panOnDrag={false}
              nodesFocusable={false}
              edgesFocusable={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={24} size={0} />
            </ReactFlow>
          </div>
        </div>
      </div>
      {footer && <div className="flex flex-wrap items-center justify-center gap-3 px-3 pt-1 pb-3">{footer}</div>}
    </div>
  )
}

export default ExposureMapGraph
