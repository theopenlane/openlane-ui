'use client'

import React, { useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { cn } from '@repo/ui/lib/utils'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'
import { getVulnerabilityDueDate } from '@/utils/vulnerability-due-date'
import { formatDate } from '@/utils/date'
import { exposureAssetLabel, exposureStatusLabel, type TEnvironmentGroup } from './exposure-model'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { pluralizeWithCount } from '@/utils/strings'
import { EnvironmentChip } from './environment-chip'

type TExposureNodeData = {
  kind: 'environment' | 'source' | 'report' | 'asset'
  title: string
  subtitle?: string
  isOpen?: boolean
  isCurrent?: boolean
  href?: string
}

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
    ) : (
      <div
        className={cn(
          'w-[260px] rounded-md border px-3 py-2 text-left',
          data.kind === 'report' && data.isOpen && 'border-destructive/60 bg-destructive/10',
          data.kind === 'report' && !data.isOpen && 'bg-muted/40 text-muted-foreground',
          data.kind !== 'report' && 'w-[170px] bg-card',
          data.kind === 'asset' && 'w-[200px]',
          data.isCurrent && 'ring-1 ring-destructive',
        )}
      >
        <div className="flex items-center gap-1.5 text-sm">
          {data.kind === 'report' && <span className={cn('size-1.5 shrink-0 rounded-full', data.isOpen ? 'bg-destructive' : 'bg-muted-foreground')} />}
          <span className={cn('truncate', data.isCurrent ? 'font-bold' : 'font-medium')}>{data.title}</span>
          {data.isCurrent && <span className="shrink-0 rounded border px-1 text-[10px] font-medium">This record</span>}
        </div>
        {data.subtitle && <div className={cn('truncate text-xs text-muted-foreground', data.kind === 'report' && 'font-mono')}>{data.subtitle}</div>}
      </div>
    )

  const content = data.href ? (
    <Link href={data.href} className="block hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  )

  return (
    <>
      {data.kind !== 'environment' && <Handle type="target" position={Position.Left} className={handleClass} isConnectable={false} />}
      {content}
      {data.kind !== 'asset' && <Handle type="source" position={Position.Right} className={handleClass} isConnectable={false} />}
    </>
  )
}

const NODE_TYPES = { exposure: ExposureNode }

const average = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length

const placeColumn = (entries: Map<string, { label: string; ys: number[] }>, startY: number) =>
  [...entries.entries()]
    .map(([id, { label, ys }]) => ({ id, label, count: ys.length, y: average(ys) }))
    .sort((a, b) => a.y - b.y)
    .reduce<{ id: string; label: string; count: number; y: number }[]>((placed, entry) => {
      const previous = placed[placed.length - 1]
      return [...placed, { ...entry, y: Math.max(entry.y, previous ? previous.y + ROW_HEIGHT : startY) }]
    }, [])

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
    const sources = new Map<string, { label: string; ys: number[] }>()
    const assets = new Map<string, { label: string; ys: number[] }>()
    const reportYs = new Map<string, number>()

    const collect = (map: Map<string, { label: string; ys: number[] }>, id: string, label: string, y: number) => {
      const entry = map.get(id)
      if (entry) entry.ys.push(y)
      else map.set(id, { label, ys: [y] })
    }

    group.rows.forEach((row) => {
      const reportId = `report:${group.environment}:${row.report.id}`
      const sourceLabel = row.report.source || 'Unknown source'
      const sourceId = `source:${group.environment}:${sourceLabel}`
      const assetId = `asset:${group.environment}:${row.asset?.id ?? 'unlinked'}`

      let reportY = reportYs.get(reportId)
      if (reportY === undefined) {
        reportY = rowIndex * ROW_HEIGHT + HEADER_OFFSET
        reportYs.set(reportId, reportY)
        rowIndex += 1
        const { dueDate } = getVulnerabilityDueDate(row.report, slaDefinitions)
        const subtitle = [
          row.report.manifestPath,
          row.isOpen && dueDate ? `due ${formatDate(dueDate.toISOString())}` : null,
          row.hiddenAssetCount > 0 ? `+${pluralizeWithCount(row.hiddenAssetCount, 'more asset')}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
        nodes.push({
          id: reportId,
          type: 'exposure',
          position: { x: COLUMN_X.report, y: reportY },
          data: {
            kind: 'report',
            title: exposureStatusLabel(row),
            subtitle: subtitle || row.report.externalID,
            isOpen: row.isOpen,
            isCurrent: row.isCurrent,
            href: row.isCurrent ? undefined : getHrefForObjectType('vulnerabilities', { id: row.report.id }),
          },
          draggable: false,
          selectable: false,
        })
        collect(sources, sourceId, sourceLabel, reportY)
        addEdge(envId, sourceId, row.isOpen)
        addEdge(sourceId, reportId, row.isOpen)
      }

      collect(assets, assetId, exposureAssetLabel(row.asset), reportY)
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
    placedAssets.forEach(({ id, label, count, y }) =>
      nodes.push({
        id,
        type: 'exposure',
        position: { x: COLUMN_X.asset, y },
        data: { kind: 'asset', title: label, subtitle: pluralizeWithCount(count, 'report') },
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
}

const ExposureMapGraph: React.FC<TExposureMapGraphProps> = ({ groups, slaDefinitions }) => {
  const prefersReducedMotion = usePrefersReducedMotion()
  const { nodes, edges, height } = useMemo(() => buildGraph(groups, slaDefinitions, !prefersReducedMotion), [groups, slaDefinitions, prefersReducedMotion])

  return (
    <div className="overflow-x-auto rounded-lg border">
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
  )
}

export default ExposureMapGraph
