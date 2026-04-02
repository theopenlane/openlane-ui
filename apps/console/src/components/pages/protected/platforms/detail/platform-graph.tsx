'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import ForceGraph, { type ForceGraphMethods, type NodeObject } from 'react-force-graph-2d'
import { useTheme } from 'next-themes'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import ReactDOM from 'react-dom'

import { type Asset, type Entity } from '@repo/codegen/src/schema'

type AssetNode = Pick<Asset, 'id' | 'name' | 'assetType'>
type VendorNode = Pick<Entity, 'id' | 'name' | 'displayName'>

interface PlatformData {
  id: string
  name: string
  scopeName?: string | null
  environmentName?: string | null
}

interface PlatformGraphProps {
  platform: PlatformData
  inScopeAssets: AssetNode[]
  outOfScopeAssets: AssetNode[]
  inScopeVendors: VendorNode[]
  outOfScopeVendors: VendorNode[]
}

type GraphNode = {
  id: string
  label: string
  type: 'platform' | 'asset' | 'vendor'
  outOfScope: boolean
  fx?: number
  fy?: number
}

type GraphLink = {
  source: string
  target: string
}

const COLORS = {
  platform: { fill: '#2563eb', border: '#1d4ed8' },
  asset: { inScope: '#16a34a', outOfScope: '#9ca3af' },
  vendor: { inScope: '#d97706', outOfScope: '#9ca3af' },
}

function buildGraphData(platform: PlatformData, inScopeAssets: AssetNode[], outOfScopeAssets: AssetNode[], inScopeVendors: VendorNode[], outOfScopeVendors: VendorNode[]) {
  const nodes: GraphNode[] = [{ id: platform.id, label: platform.name, type: 'platform', outOfScope: false }]
  const links: GraphLink[] = []

  const allAssets = [...inScopeAssets.map((a) => ({ ...a, outOfScope: false })), ...outOfScopeAssets.map((a) => ({ ...a, outOfScope: true }))]
  const allVendors = [...inScopeVendors.map((v) => ({ ...v, outOfScope: false })), ...outOfScopeVendors.map((v) => ({ ...v, outOfScope: true }))]

  for (const asset of allAssets) {
    const nodeId = `asset-${asset.id}`
    nodes.push({ id: nodeId, label: asset.name ?? asset.id, type: 'asset', outOfScope: asset.outOfScope })
    links.push({ source: platform.id, target: nodeId })
  }

  for (const vendor of allVendors) {
    const nodeId = `vendor-${vendor.id}`
    nodes.push({ id: nodeId, label: vendor.displayName ?? vendor.name ?? vendor.id, type: 'vendor', outOfScope: vendor.outOfScope })
    links.push({ source: platform.id, target: nodeId })
  }

  return { nodes, links }
}

const PlatformGraph: React.FC<PlatformGraphProps> = ({ platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })
  const [fullscreen, setFullscreen] = useState(false)
  const { resolvedTheme } = useTheme()

  const graphData = useMemo(
    () => buildGraphData(platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors),
    [platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors],
  )

  useEffect(() => {
    if (!containerRef.current) return
    const update = () => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      setDimensions({ width: width || 600, height: height || 400 })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [fullscreen])

  useEffect(() => {
    if (!fgRef.current) return
    const fg = fgRef.current

    const platformNode = graphData.nodes.find((n) => n.type === 'platform')
    const assetNodes = graphData.nodes.filter((n) => n.type === 'asset')
    const vendorNodes = graphData.nodes.filter((n) => n.type === 'vendor')

    if (platformNode) {
      platformNode.fx = 0
      platformNode.fy = -100
    }

    const spread = (nodes: GraphNode[], y: number) => {
      const count = nodes.length
      if (count === 0) return
      const spacing = Math.max(100, (dimensions.width - 80) / count)
      const totalWidth = spacing * (count - 1)
      nodes.forEach((n, i) => {
        n.fx = -totalWidth / 2 + i * spacing
        n.fy = y
      })
    }

    spread(assetNodes, 0)
    spread(vendorNodes, 120)

    fg.d3Force('charge', null)
    fg.d3Force('link', null)

    const timer = setTimeout(() => {
      fg.zoomToFit(400, 40)
    }, 300)

    return () => clearTimeout(timer)
  }, [graphData, dimensions])

  const isDark = resolvedTheme === 'dark'

  const getNodeColor = (node: GraphNode) => {
    if (node.type === 'platform') return COLORS.platform.fill
    if (node.type === 'asset') return node.outOfScope ? COLORS.asset.outOfScope : COLORS.asset.inScope
    return node.outOfScope ? COLORS.vendor.outOfScope : COLORS.vendor.inScope
  }

  const renderGraph = () => (
    <ForceGraph
      ref={fgRef}
      width={dimensions.width}
      height={dimensions.height}
      graphData={graphData}
      linkColor={() => (isDark ? '#374151' : '#d1d5db')}
      linkWidth={() => 1.5}
      enableNodeDrag={false}
      autoPauseRedraw={false}
      nodeLabel={() => ''}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const gn = node as NodeObject<GraphNode>
        const label = gn.label ?? ''
        const fontSize = Math.max(10, 12 / globalScale)
        const isCenter = gn.type === 'platform'
        const r = isCenter ? 10 : 7
        const color = getNodeColor(gn)

        ctx.beginPath()
        ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI)
        ctx.fillStyle = isDark ? '#111827' : '#ffffff'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI)
        ctx.strokeStyle = color
        ctx.lineWidth = isCenter ? 2.5 : 1.5
        ctx.globalAlpha = gn.outOfScope ? 0.4 : 1
        ctx.stroke()
        ctx.globalAlpha = 1

        ctx.fillStyle = isDark ? '#f9fafb' : '#111827'
        if (gn.outOfScope) ctx.fillStyle = isDark ? '#6b7280' : '#9ca3af'
        ctx.font = `${isCenter ? 'bold ' : ''}${fontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        const maxLen = 18
        const truncated = label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label
        ctx.fillText(truncated, node.x ?? 0, (node.y ?? 0) + r + 3)

        if (isCenter) {
          const typeLabel = 'Platform'
          ctx.font = `${Math.max(8, 9 / globalScale)}px sans-serif`
          ctx.fillStyle = color
          ctx.fillText(typeLabel, node.x ?? 0, (node.y ?? 0) - r - 3 - Math.max(8, 9 / globalScale))
        }
      }}
      nodePointerAreaPaint={(node, color, ctx) => {
        ctx.beginPath()
        ctx.arc(node.x ?? 0, node.y ?? 0, 12, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
      }}
    />
  )

  const legend = (
    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: COLORS.platform.fill }} />
        <span>Platform</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: COLORS.asset.inScope }} />
        <span>Asset (in scope)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full border-2 opacity-40" style={{ borderColor: COLORS.asset.outOfScope }} />
        <span>Asset (out of scope)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: COLORS.vendor.inScope }} />
        <span>Vendor (in scope)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full border-2 opacity-40" style={{ borderColor: COLORS.vendor.outOfScope }} />
        <span>Vendor (out of scope)</span>
      </div>
    </div>
  )

  const totalNodes = graphData.nodes.length

  if (totalNodes <= 1) {
    return (
      <div className="p-5 text-left">
        <p className="text-sm text-muted-foreground">No linked assets or vendors to display in the graph.</p>
        <p className="text-xs text-muted-foreground mt-1">Add assets and vendors to this platform to see the hierarchy.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {legend}
        <Button variant="secondary" size="sm" onClick={() => setFullscreen(true)}>
          <Maximize2 size={14} />
        </Button>
      </div>
      <div ref={containerRef} className="rounded-md border overflow-hidden" style={{ height: 360 }}>
        {renderGraph()}
      </div>

      {fullscreen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-[10000] flex flex-col bg-background">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <span className="font-medium">{platform.name} — Graph View</span>
                {legend}
              </div>
              <Button variant="secondary" size="sm" onClick={() => setFullscreen(false)}>
                <Minimize2 size={14} />
              </Button>
            </div>
            <div ref={containerRef} className="flex-1">
              {renderGraph()}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default PlatformGraph
