'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import ForceGraph, { type ForceGraphMethods, type NodeObject } from 'react-force-graph-2d'
import { useTheme } from 'next-themes'
import { Maximize2, Minimize2 } from 'lucide-react'
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

const BG = 'transparent'

const COLORS = {
  platform: '#6366f1',
  asset: { inScope: '#16a34a', outOfScope: '#374151' },
  vendor: { inScope: '#d97706', outOfScope: '#374151' },
  badge: '#818cf8',
}

const LAPTOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>`
const BUILDING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 0-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
const NETWORK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>`

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })
}

function buildGraphData(platform: PlatformData, inScopeAssets: AssetNode[], outOfScopeAssets: AssetNode[], inScopeVendors: VendorNode[], outOfScopeVendors: VendorNode[]) {
  const nodes: GraphNode[] = [{ id: platform.id, label: platform.name, type: 'platform', outOfScope: false }]
  const links: GraphLink[] = []

  for (const a of [...inScopeAssets.map((a) => ({ ...a, outOfScope: false })), ...outOfScopeAssets.map((a) => ({ ...a, outOfScope: true }))]) {
    const nodeId = `asset-${a.id}`
    nodes.push({ id: nodeId, label: a.name ?? a.id, type: 'asset', outOfScope: a.outOfScope })
    links.push({ source: platform.id, target: nodeId })
  }

  for (const v of [...inScopeVendors.map((v) => ({ ...v, outOfScope: false })), ...outOfScopeVendors.map((v) => ({ ...v, outOfScope: true }))]) {
    const nodeId = `vendor-${v.id}`
    nodes.push({ id: nodeId, label: v.displayName ?? v.name ?? v.id, type: 'vendor', outOfScope: v.outOfScope })
    links.push({ source: platform.id, target: nodeId })
  }

  return { nodes, links }
}

const PlatformGraph: React.FC<PlatformGraphProps> = ({ platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors }) => {
  const normalContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 })
  const [fullscreen, setFullscreen] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const assetIconRef = useRef<HTMLImageElement | null>(null)
  const vendorIconRef = useRef<HTMLImageElement | null>(null)
  const platformIconRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    void Promise.all([
      preloadImage(svgToDataUrl(LAPTOP_SVG)).then((img) => {
        assetIconRef.current = img
      }),
      preloadImage(svgToDataUrl(BUILDING_SVG)).then((img) => {
        vendorIconRef.current = img
      }),
      preloadImage(svgToDataUrl(NETWORK_SVG)).then((img) => {
        platformIconRef.current = img
      }),
    ])
  }, [])

  const graphData = useMemo(
    () => buildGraphData(platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors),
    [platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors],
  )

  const activeContainerRef = fullscreen ? fullscreenContainerRef : normalContainerRef

  useEffect(() => {
    const container = activeContainerRef.current
    if (!container) return
    const update = () => {
      const { width, height } = container.getBoundingClientRect()
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      if (width > 0 && height > 0) setDimensions({ width, height })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(container)
    return () => ro.disconnect()
  }, [fullscreen, activeContainerRef])

  useEffect(() => {
    if (!fgRef.current) return
    const fg = fgRef.current

    const platformNode = graphData.nodes.find((n) => n.type === 'platform')
    const assetNodes = graphData.nodes.filter((n) => n.type === 'asset')
    const vendorNodes = graphData.nodes.filter((n) => n.type === 'vendor')
    const hasAssets = assetNodes.length > 0
    const hasVendors = vendorNodes.length > 0

    if (platformNode) {
      platformNode.fx = 0
      platformNode.fy = hasAssets || hasVendors ? -90 : 0
    }

    const spread = (nodes: GraphNode[], y: number) => {
      const count = nodes.length
      if (count === 0) return
      const spacing = Math.max(70, Math.min(130, (dimensions.width - 60) / count))
      const totalWidth = spacing * (count - 1)
      nodes.forEach((n, i) => {
        n.fx = -totalWidth / 2 + i * spacing
        n.fy = y
      })
    }

    if (hasAssets && hasVendors) {
      spread(assetNodes, 10)
      spread(vendorNodes, 110)
    } else if (hasAssets) {
      spread(assetNodes, 10)
    } else if (hasVendors) {
      spread(vendorNodes, 10)
    }

    fg.d3Force('charge', null)
    fg.d3Force('link', null)

    const timer = setTimeout(() => fg.zoomToFit(400, 40), 200)
    return () => clearTimeout(timer)
  }, [graphData, dimensions])

  const childCount = graphData.nodes.length - 1

  const renderGraph = (width: number, height: number) => (
    <ForceGraph
      ref={fgRef}
      width={width}
      height={height}
      graphData={graphData}
      backgroundColor={BG}
      linkColor={() => (isDark ? '#374151' : '#d1d5db')}
      linkWidth={() => 1}
      enableNodeDrag={false}
      autoPauseRedraw={false}
      nodeLabel={() => ''}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const gn = node as NodeObject<GraphNode>
        const x = node.x ?? 0
        const y = node.y ?? 0
        const isCenter = gn.type === 'platform'
        const r = isCenter ? 14 : 10
        const alpha = gn.outOfScope ? 0.35 : 1

        // Node fill color
        let fillColor = COLORS.platform
        if (gn.type === 'asset') fillColor = gn.outOfScope ? COLORS.asset.outOfScope : COLORS.asset.inScope
        if (gn.type === 'vendor') fillColor = gn.outOfScope ? COLORS.vendor.outOfScope : COLORS.vendor.inScope

        ctx.save()
        ctx.globalAlpha = alpha

        // Subtle glow ring
        ctx.beginPath()
        ctx.arc(x, y, r + 2.5, 0, 2 * Math.PI)
        ctx.fillStyle = fillColor + '30'
        ctx.fill()

        // Main filled circle
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        ctx.fillStyle = fillColor
        ctx.fill()

        // Icon
        const icon = isCenter ? platformIconRef.current : gn.type === 'asset' ? assetIconRef.current : vendorIconRef.current
        if (icon) {
          const iconSize = r * 1.3
          ctx.drawImage(icon, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize)
        }

        ctx.restore()

        // Count badge on platform node (top-right)
        if (isCenter && childCount > 0) {
          const br = 7
          const bx = x + r - 1
          const by = y - r + 1
          ctx.beginPath()
          ctx.arc(bx, by, br, 0, 2 * Math.PI)
          ctx.fillStyle = COLORS.badge
          ctx.fill()
          ctx.font = `bold ${Math.max(6, 8 / globalScale)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(String(childCount), bx, by)
        }

        // Label below
        const fontSize = Math.max(9, 10 / globalScale)
        ctx.font = `${isCenter ? '600 ' : ''}${fontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = isDark ? (gn.outOfScope ? '#6b7280' : '#f9fafb') : gn.outOfScope ? '#9ca3af' : '#111827'
        const maxLen = 18
        const label = gn.label ?? ''
        const truncated = label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label
        ctx.fillText(truncated, x, y + r + 4)
      }}
      nodePointerAreaPaint={(node, color, ctx) => {
        ctx.beginPath()
        ctx.arc(node.x ?? 0, node.y ?? 0, 16, 0, 2 * Math.PI)
        ctx.fillStyle = color
        ctx.fill()
      }}
    />
  )

  if (graphData.nodes.length <= 1) {
    return (
      <div className="px-5 py-4">
        <p className="text-sm text-muted-foreground">No linked assets or vendors to display.</p>
        <p className="text-xs text-muted-foreground mt-1">Add assets and vendors to see the graph.</p>
      </div>
    )
  }

  const expandButton = (onClick: () => void, icon: React.ReactNode) => (
    <button
      onClick={onClick}
      className="absolute bottom-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-[#6b7280] transition-colors hover:bg-white/10 hover:text-white"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      {icon}
    </button>
  )

  return (
    <>
      <div ref={normalContainerRef} className="relative overflow-hidden rounded-b-md" style={{ height: 300 }}>
        {renderGraph(dimensions.width, dimensions.height)}
        {expandButton(() => setFullscreen(true), <Maximize2 size={13} />)}
      </div>

      {fullscreen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-10000 flex flex-col bg-background">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-medium">{platform.name} — Graph</span>
              <button onClick={() => setFullscreen(false)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                <Minimize2 size={14} />
              </button>
            </div>
            <div ref={fullscreenContainerRef} className="flex-1 relative">
              {renderGraph(dimensions.width, dimensions.height)}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default PlatformGraph
