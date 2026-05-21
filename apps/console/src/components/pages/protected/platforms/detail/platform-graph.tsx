'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import ForceGraph, { type ForceGraphMethods, type NodeObject } from 'react-force-graph-2d'
import { useTheme } from 'next-themes'
import { Maximize2, Minimize2, ArrowLeft } from 'lucide-react'
import ReactDOM from 'react-dom'
import { type Asset, type Entity } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

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
  type: 'platform' | 'asset' | 'vendor' | 'asset-group' | 'overflow'
  outOfScope: boolean
  count?: number
  assetType?: string
  fx?: number
  fy?: number
}

type GraphLink = {
  source: string
  target: string
}

type ViewLevel = { kind: 'root' } | { kind: 'assetGroup'; assetType: string }

const SMALL_VIEW_VENDOR_LIMIT = 6
const SMALL_VIEW_ASSET_LIMIT = 8

const BG = 'transparent'

const COLORS = {
  platform: '#6366f1',
  asset: { inScope: '#16a34a', outOfScope: '#374151' },
  vendor: { inScope: '#d97706', outOfScope: '#374151' },
  group: { inScope: '#818cf8', outOfScope: '#374151' },
  badge: '#818cf8',
  overflow: '#9ca3af',
}

const LAPTOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>`
const BUILDING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 0-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
const NETWORK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>`
const LAYERS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>`

const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

const preloadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = src
  })

const spread = (nodes: GraphNode[], y: number, width: number) => {
  const count = nodes.length
  if (count === 0) return
  const spacing = Math.max(70, Math.min(130, (width - 60) / count))
  const totalWidth = spacing * (count - 1)
  nodes.forEach((n, i) => {
    n.fx = -totalWidth / 2 + i * spacing
    n.fy = y
  })
}

type ScopedAsset = AssetNode & { outOfScope: boolean }
type ScopedVendor = VendorNode & { outOfScope: boolean }

type BuildArgs = {
  platform: PlatformData
  inScopeAssets: AssetNode[]
  outOfScopeAssets: AssetNode[]
  inScopeVendors: VendorNode[]
  outOfScopeVendors: VendorNode[]
  viewLevel: ViewLevel
  isFullscreen: boolean
}

const buildGraphData = ({ platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors, viewLevel, isFullscreen }: BuildArgs) => {
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []

  const allAssets: ScopedAsset[] = [...inScopeAssets.map((a) => ({ ...a, outOfScope: false })), ...outOfScopeAssets.map((a) => ({ ...a, outOfScope: true }))]

  if (viewLevel.kind === 'assetGroup') {
    const filtered = allAssets.filter((a) => a.assetType === viewLevel.assetType)
    const groupId = `group-${viewLevel.assetType}`
    nodes.push({
      id: groupId,
      label: getEnumLabel(viewLevel.assetType),
      type: 'asset-group',
      outOfScope: false,
      count: filtered.length,
      assetType: viewLevel.assetType,
    })

    const visible = isFullscreen ? filtered : filtered.slice(0, SMALL_VIEW_ASSET_LIMIT)
    for (const a of visible) {
      const nodeId = `asset-${a.id}`
      nodes.push({ id: nodeId, label: a.name ?? a.id, type: 'asset', outOfScope: a.outOfScope })
      links.push({ source: groupId, target: nodeId })
    }

    if (!isFullscreen && filtered.length > SMALL_VIEW_ASSET_LIMIT) {
      const overflowId = `overflow-asset`
      const remaining = filtered.length - SMALL_VIEW_ASSET_LIMIT
      nodes.push({
        id: overflowId,
        label: `+${remaining} more`,
        type: 'overflow',
        outOfScope: false,
        count: remaining,
      })
      links.push({ source: groupId, target: overflowId })
    }

    return { nodes, links }
  }

  nodes.push({ id: platform.id, label: platform.name, type: 'platform', outOfScope: false })

  const byType = new Map<string, ScopedAsset[]>()
  for (const a of allAssets) {
    const type = a.assetType ?? 'OTHER'
    const arr = byType.get(type) ?? []
    arr.push(a)
    byType.set(type, arr)
  }

  for (const [type, items] of byType) {
    const groupId = `group-${type}`
    const allOut = items.every((i) => i.outOfScope)
    nodes.push({
      id: groupId,
      label: getEnumLabel(type),
      type: 'asset-group',
      outOfScope: allOut,
      count: items.length,
      assetType: type,
    })
    links.push({ source: platform.id, target: groupId })
  }

  const allVendors: ScopedVendor[] = [...inScopeVendors.map((v) => ({ ...v, outOfScope: false })), ...outOfScopeVendors.map((v) => ({ ...v, outOfScope: true }))]

  const showAllVendors = isFullscreen || allVendors.length <= SMALL_VIEW_VENDOR_LIMIT
  const visibleVendors = showAllVendors ? allVendors : allVendors.slice(0, SMALL_VIEW_VENDOR_LIMIT)
  for (const v of visibleVendors) {
    const nodeId = `vendor-${v.id}`
    nodes.push({ id: nodeId, label: v.displayName ?? v.name ?? v.id, type: 'vendor', outOfScope: v.outOfScope })
    links.push({ source: platform.id, target: nodeId })
  }

  if (!showAllVendors) {
    const overflowId = 'overflow-vendor'
    const remaining = allVendors.length - SMALL_VIEW_VENDOR_LIMIT
    nodes.push({
      id: overflowId,
      label: `+${remaining} more`,
      type: 'overflow',
      outOfScope: false,
      count: remaining,
    })
    links.push({ source: platform.id, target: overflowId })
  }

  return { nodes, links }
}

const PlatformGraph: React.FC<PlatformGraphProps> = ({ platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors }) => {
  const normalContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 })
  const [fullscreen, setFullscreen] = useState(false)
  const [viewLevel, setViewLevel] = useState<ViewLevel>({ kind: 'root' })
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const assetIconRef = useRef<HTMLImageElement | null>(null)
  const vendorIconRef = useRef<HTMLImageElement | null>(null)
  const platformIconRef = useRef<HTMLImageElement | null>(null)
  const groupIconRef = useRef<HTMLImageElement | null>(null)

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
      preloadImage(svgToDataUrl(LAYERS_SVG)).then((img) => {
        groupIconRef.current = img
      }),
    ])
  }, [])

  const graphData = useMemo(
    () =>
      buildGraphData({
        platform,
        inScopeAssets,
        outOfScopeAssets,
        inScopeVendors,
        outOfScopeVendors,
        viewLevel,
        isFullscreen: fullscreen,
      }),
    [platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors, viewLevel, fullscreen],
  )

  useEffect(() => {
    if (viewLevel.kind !== 'assetGroup') return
    const stillExists = [...inScopeAssets, ...outOfScopeAssets].some((a) => a.assetType === viewLevel.assetType)
    if (!stillExists) setViewLevel({ kind: 'root' })
  }, [viewLevel, inScopeAssets, outOfScopeAssets])

  const activeContainerRef = fullscreen ? fullscreenContainerRef : normalContainerRef

  useEffect(() => {
    const container = activeContainerRef.current
    if (!container) return
    const update = () => {
      const { width, height } = container.getBoundingClientRect()
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

    if (viewLevel.kind === 'assetGroup') {
      const groupNode = graphData.nodes.find((n) => n.type === 'asset-group')
      const childNodes = graphData.nodes.filter((n) => n.type !== 'asset-group')
      if (groupNode) {
        groupNode.fx = 0
        groupNode.fy = childNodes.length > 0 ? -60 : 0
      }
      spread(childNodes, 40, dimensions.width)
    } else {
      const platformNode = graphData.nodes.find((n) => n.type === 'platform')
      const groupNodes = graphData.nodes.filter((n) => n.type === 'asset-group')
      const vendorRow = graphData.nodes.filter((n) => n.type === 'vendor' || n.type === 'overflow')
      const hasRow1 = groupNodes.length > 0
      const hasRow2 = vendorRow.length > 0

      if (platformNode) {
        platformNode.fx = 0
        platformNode.fy = hasRow1 || hasRow2 ? -90 : 0
      }

      if (hasRow1 && hasRow2) {
        spread(groupNodes, 10, dimensions.width)
        spread(vendorRow, 110, dimensions.width)
      } else if (hasRow1) {
        spread(groupNodes, 10, dimensions.width)
      } else if (hasRow2) {
        spread(vendorRow, 10, dimensions.width)
      }
    }

    fg.d3Force('charge', null)
    fg.d3Force('link', null)

    const timer = setTimeout(() => fg.zoomToFit(400, 40), 200)
    return () => clearTimeout(timer)
  }, [graphData, dimensions, viewLevel])

  const platformBadgeCount = viewLevel.kind === 'root' ? graphData.nodes.filter((n) => n.type !== 'platform').length : 0

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
      onNodeClick={(node) => {
        const gn = node as NodeObject<GraphNode>
        if (gn.type === 'asset-group' && gn.assetType && viewLevel.kind === 'root') {
          setViewLevel({ kind: 'assetGroup', assetType: gn.assetType })
        } else if (gn.type === 'overflow') {
          setFullscreen(true)
        }
      }}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const gn = node as NodeObject<GraphNode>
        const x = node.x ?? 0
        const y = node.y ?? 0
        const isCenter = gn.type === 'platform' || (gn.type === 'asset-group' && viewLevel.kind === 'assetGroup')
        const r = isCenter ? 14 : 10
        const alpha = gn.outOfScope ? 0.35 : 1

        if (gn.type === 'overflow') {
          ctx.save()
          ctx.beginPath()
          ctx.arc(x, y, r, 0, 2 * Math.PI)
          ctx.fillStyle = isDark ? '#1f2937' : '#f3f4f6'
          ctx.fill()
          ctx.lineWidth = 1.5
          ctx.setLineDash([3, 3])
          ctx.strokeStyle = COLORS.overflow
          ctx.stroke()
          ctx.setLineDash([])
          ctx.font = `600 ${Math.max(8, 9 / globalScale)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = isDark ? '#d1d5db' : '#374151'
          ctx.fillText(`+${gn.count ?? 0}`, x, y)
          ctx.restore()

          const fontSize = Math.max(9, 10 / globalScale)
          ctx.font = `${fontSize}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280'
          ctx.fillText('more', x, y + r + 4)
          return
        }

        let fillColor = COLORS.platform
        if (gn.type === 'asset') fillColor = gn.outOfScope ? COLORS.asset.outOfScope : COLORS.asset.inScope
        if (gn.type === 'vendor') fillColor = gn.outOfScope ? COLORS.vendor.outOfScope : COLORS.vendor.inScope
        if (gn.type === 'asset-group') fillColor = gn.outOfScope ? COLORS.group.outOfScope : COLORS.group.inScope

        ctx.save()
        ctx.globalAlpha = alpha

        ctx.beginPath()
        ctx.arc(x, y, r + 2.5, 0, 2 * Math.PI)
        ctx.fillStyle = fillColor + '30'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        ctx.fillStyle = fillColor
        ctx.fill()

        let icon: HTMLImageElement | null = null
        if (gn.type === 'platform') icon = platformIconRef.current
        else if (gn.type === 'asset') icon = assetIconRef.current
        else if (gn.type === 'vendor') icon = vendorIconRef.current
        else if (gn.type === 'asset-group') icon = groupIconRef.current
        if (icon) {
          const iconSize = r * 1.3
          ctx.drawImage(icon, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize)
        }

        ctx.restore()

        const badgeValue = gn.type === 'platform' ? platformBadgeCount : gn.type === 'asset-group' ? (gn.count ?? 0) : 0
        if (badgeValue > 0) {
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
          ctx.fillText(String(badgeValue), bx, by)
        }

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

  if (graphData.nodes.length <= 1 && viewLevel.kind === 'root') {
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

  const backButton = (
    <button
      onClick={() => setViewLevel({ kind: 'root' })}
      className="absolute top-3 left-3 z-10 flex h-7 items-center gap-1 rounded-md px-2 text-xs text-[#6b7280] transition-colors hover:bg-white/10 hover:text-white"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      <ArrowLeft size={12} />
      Back
    </button>
  )

  const drilledTitle = viewLevel.kind === 'assetGroup' ? ` › ${getEnumLabel(viewLevel.assetType)}` : ''

  return (
    <>
      <div ref={normalContainerRef} className="relative overflow-hidden rounded-b-md" style={{ height: 300 }}>
        {renderGraph(dimensions.width, dimensions.height)}
        {viewLevel.kind !== 'root' && backButton}
        {expandButton(() => setFullscreen(true), <Maximize2 size={13} />)}
      </div>

      {fullscreen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-10000 flex flex-col bg-background">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-medium">
                {platform.name} — Graph{drilledTitle}
              </span>
              <button onClick={() => setFullscreen(false)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
                <Minimize2 size={14} />
              </button>
            </div>
            <div ref={fullscreenContainerRef} className="flex-1 relative">
              {renderGraph(dimensions.width, dimensions.height)}
              {viewLevel.kind !== 'root' && backButton}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default PlatformGraph
