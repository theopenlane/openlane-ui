'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import ForceGraph, { type ForceGraphMethods, type NodeObject, type LinkObject } from 'react-force-graph-2d'
import { useTheme } from 'next-themes'
import { Maximize2, Minimize2, ArrowLeft } from 'lucide-react'
import ReactDOM from 'react-dom'
import type { AssetAssetType, Asset, Entity } from '@repo/codegen/src/schema'
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
  assetType?: AssetAssetType
  fx?: number
  fy?: number
}

type GraphLink = {
  source: string
  target: string
}

type FGNode = NodeObject<GraphNode>
type FGLink = LinkObject<GraphNode, GraphLink>

type ViewLevel = { kind: 'root' } | { kind: 'assetGroup'; assetType: AssetAssetType }

const SMALL_VIEW_VENDOR_LIMIT = 6
const SMALL_VIEW_ASSET_LIMIT = 8

const BG = 'transparent'

const Y = {
  rootPlatform: -90,
  rootGroups: 10,
  rootVendors: 110,
  drilledGroup: -60,
  drilledChildren: 40,
} as const

const COLORS = {
  platform: '#6366f1',
  asset: { inScope: '#16a34a', outOfScope: '#374151' },
  vendor: { inScope: '#d97706', outOfScope: '#374151' },
  group: { inScope: '#818cf8', outOfScope: '#374151' },
  badge: '#818cf8',
  overflow: {
    bgDark: '#1f2937',
    bgLight: '#f3f4f6',
    stroke: '#9ca3af',
    textDark: '#d1d5db',
    textLight: '#374151',
    labelDark: '#9ca3af',
    labelLight: '#6b7280',
  },
  label: {
    dark: { inScope: '#f9fafb', outOfScope: '#6b7280' },
    light: { inScope: '#111827', outOfScope: '#9ca3af' },
  },
  link: { dark: '#374151', light: '#d1d5db' },
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
      const remaining = filtered.length - SMALL_VIEW_ASSET_LIMIT
      nodes.push({
        id: 'overflow-asset',
        label: `+${remaining} more`,
        type: 'overflow',
        outOfScope: false,
        count: remaining,
      })
      links.push({ source: groupId, target: 'overflow-asset' })
    }

    return { nodes, links }
  }

  nodes.push({ id: platform.id, label: platform.name, type: 'platform', outOfScope: false })

  const byType = new Map<AssetAssetType, ScopedAsset[]>()
  for (const a of allAssets) {
    const arr = byType.get(a.assetType) ?? []
    arr.push(a)
    byType.set(a.assetType, arr)
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
    const remaining = allVendors.length - SMALL_VIEW_VENDOR_LIMIT
    nodes.push({
      id: 'overflow-vendor',
      label: `+${remaining} more`,
      type: 'overflow',
      outOfScope: false,
      count: remaining,
    })
    links.push({ source: platform.id, target: 'overflow-vendor' })
  }

  return { nodes, links }
}

const drawBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, value: number, scale: number) => {
  const br = 7
  ctx.beginPath()
  ctx.arc(x, y, br, 0, 2 * Math.PI)
  ctx.fillStyle = COLORS.badge
  ctx.fill()
  ctx.font = `bold ${Math.max(6, 8 / scale)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(String(value), x, y)
}

const drawLabel = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, isCenter: boolean, outOfScope: boolean, scale: number, isDark: boolean) => {
  const fontSize = Math.max(9, 10 / scale)
  ctx.font = `${isCenter ? '600 ' : ''}${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const palette = isDark ? COLORS.label.dark : COLORS.label.light
  ctx.fillStyle = outOfScope ? palette.outOfScope : palette.inScope
  const maxLen = 18
  const truncated = label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label
  ctx.fillText(truncated, x, y)
}

const drawOverflowNode = (ctx: CanvasRenderingContext2D, node: FGNode, scale: number, isDark: boolean) => {
  const x = node.x ?? 0
  const y = node.y ?? 0
  const r = 10

  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fillStyle = isDark ? COLORS.overflow.bgDark : COLORS.overflow.bgLight
  ctx.fill()
  ctx.lineWidth = 1.5
  ctx.setLineDash([3, 3])
  ctx.strokeStyle = COLORS.overflow.stroke
  ctx.stroke()
  ctx.setLineDash([])
  ctx.font = `600 ${Math.max(8, 9 / scale)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = isDark ? COLORS.overflow.textDark : COLORS.overflow.textLight
  ctx.fillText(`+${node.count ?? 0}`, x, y)
  ctx.restore()

  const fontSize = Math.max(9, 10 / scale)
  ctx.font = `${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = isDark ? COLORS.overflow.labelDark : COLORS.overflow.labelLight
  ctx.fillText('more', x, y + r + 4)
}

type EntityIcons = {
  platform: HTMLImageElement | null
  asset: HTMLImageElement | null
  vendor: HTMLImageElement | null
  group: HTMLImageElement | null
}

const drawEntityNode = (ctx: CanvasRenderingContext2D, node: FGNode, scale: number, isDark: boolean, isCenter: boolean, badgeValue: number, icons: EntityIcons) => {
  const x = node.x ?? 0
  const y = node.y ?? 0
  const r = isCenter ? 14 : 10
  const alpha = node.outOfScope ? 0.35 : 1

  let fillColor = COLORS.platform
  if (node.type === 'asset') fillColor = node.outOfScope ? COLORS.asset.outOfScope : COLORS.asset.inScope
  if (node.type === 'vendor') fillColor = node.outOfScope ? COLORS.vendor.outOfScope : COLORS.vendor.inScope
  if (node.type === 'asset-group') fillColor = node.outOfScope ? COLORS.group.outOfScope : COLORS.group.inScope

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
  if (node.type === 'platform') icon = icons.platform
  else if (node.type === 'asset') icon = icons.asset
  else if (node.type === 'vendor') icon = icons.vendor
  else if (node.type === 'asset-group') icon = icons.group
  if (icon) {
    const iconSize = r * 1.3
    ctx.drawImage(icon, x - iconSize / 2, y - iconSize / 2, iconSize, iconSize)
  }

  ctx.restore()

  if (badgeValue > 0) {
    drawBadge(ctx, x + r - 1, y - r + 1, badgeValue, scale)
  }

  drawLabel(ctx, x, y + r + 4, node.label ?? '', isCenter, node.outOfScope, scale, isDark)
}

const GraphChromeButton: React.FC<{
  position: 'top-left' | 'bottom-left'
  onClick: () => void
  children: React.ReactNode
  width?: 'icon' | 'auto'
}> = ({ position, onClick, children, width = 'icon' }) => {
  const positionClasses = position === 'top-left' ? 'top-3 left-3' : 'bottom-3 left-3'
  const sizeClasses = width === 'icon' ? 'h-7 w-7' : 'h-7 px-2 text-xs'
  return (
    <button
      onClick={onClick}
      className={`absolute ${positionClasses} ${sizeClasses} z-10 flex items-center justify-center gap-1 rounded-md text-[#6b7280] transition-colors hover:bg-white/10 hover:text-white`}
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      {children}
    </button>
  )
}

const PlatformGraph: React.FC<PlatformGraphProps> = ({ platform, inScopeAssets, outOfScopeAssets, inScopeVendors, outOfScopeVendors }) => {
  const normalContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const fgRef = useRef<ForceGraphMethods<FGNode, FGLink> | undefined>(undefined)
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
        groupNode.fy = childNodes.length > 0 ? Y.drilledGroup : 0
      }
      spread(childNodes, Y.drilledChildren, dimensions.width)
    } else {
      const platformNode = graphData.nodes.find((n) => n.type === 'platform')
      const groupNodes = graphData.nodes.filter((n) => n.type === 'asset-group')
      const vendorRow = graphData.nodes.filter((n) => n.type === 'vendor' || n.type === 'overflow')
      const hasRow1 = groupNodes.length > 0
      const hasRow2 = vendorRow.length > 0

      if (platformNode) {
        platformNode.fx = 0
        platformNode.fy = hasRow1 || hasRow2 ? Y.rootPlatform : 0
      }

      if (hasRow1 && hasRow2) {
        spread(groupNodes, Y.rootGroups, dimensions.width)
        spread(vendorRow, Y.rootVendors, dimensions.width)
      } else if (hasRow1) {
        spread(groupNodes, Y.rootGroups, dimensions.width)
      } else if (hasRow2) {
        spread(vendorRow, Y.rootGroups, dimensions.width)
      }
    }

    fg.d3Force('charge', null)
    fg.d3Force('link', null)

    const timer = setTimeout(() => fg.zoomToFit(400, 40), 200)
    return () => clearTimeout(timer)
  }, [graphData, dimensions, viewLevel])

  const platformBadgeCount = viewLevel.kind === 'root' ? graphData.nodes.filter((n) => n.type !== 'platform' && n.type !== 'overflow').length : 0

  const renderGraph = (width: number, height: number) => (
    <ForceGraph<GraphNode, GraphLink>
      ref={fgRef}
      width={width}
      height={height}
      graphData={graphData}
      backgroundColor={BG}
      linkColor={() => (isDark ? COLORS.link.dark : COLORS.link.light)}
      linkWidth={() => 1}
      enableNodeDrag={false}
      autoPauseRedraw={false}
      nodeLabel={() => ''}
      onNodeClick={(node) => {
        if (node.type === 'asset-group' && node.assetType && viewLevel.kind === 'root') {
          setViewLevel({ kind: 'assetGroup', assetType: node.assetType })
        } else if (node.type === 'overflow') {
          setFullscreen(true)
        }
      }}
      nodeCanvasObject={(node, ctx, globalScale) => {
        if (node.type === 'overflow') {
          drawOverflowNode(ctx, node, globalScale, isDark)
          return
        }

        const isCenter = node.type === 'platform' || (node.type === 'asset-group' && viewLevel.kind === 'assetGroup')
        const badgeValue = node.type === 'platform' ? platformBadgeCount : node.type === 'asset-group' ? (node.count ?? 0) : 0

        drawEntityNode(ctx, node, globalScale, isDark, isCenter, badgeValue, {
          platform: platformIconRef.current,
          asset: assetIconRef.current,
          vendor: vendorIconRef.current,
          group: groupIconRef.current,
        })
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

  const backButton = (
    <GraphChromeButton position="top-left" width="auto" onClick={() => setViewLevel({ kind: 'root' })}>
      <ArrowLeft size={12} />
      Back
    </GraphChromeButton>
  )

  const drilledTitle = viewLevel.kind === 'assetGroup' ? ` › ${getEnumLabel(viewLevel.assetType)}` : ''

  return (
    <>
      <div ref={normalContainerRef} className="relative overflow-hidden rounded-b-md" style={{ height: 300 }}>
        {renderGraph(dimensions.width, dimensions.height)}
        {viewLevel.kind !== 'root' && backButton}
        <GraphChromeButton position="bottom-left" onClick={() => setFullscreen(true)}>
          <Maximize2 size={13} />
        </GraphChromeButton>
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
