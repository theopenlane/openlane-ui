'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import ForceGraph, { ForceGraphMethods, NodeObject } from 'react-force-graph-2d'
import { forceCollide, forceRadial } from 'd3-force'
import usePlateEditor from '../plate/usePlateEditor'
import { Info, PencilLine, SlidersHorizontal, X } from 'lucide-react'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum.tsx'
import { getHrefForObjectType, NormalizedObject } from '@/utils/getHrefForObjectType.ts'
import { Section, TBaseAssociatedNode, TEdgeNode } from '@/components/shared/object-association/types/object-association-types.ts'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

interface IGraphNode {
  id: string
  name: string
  type: string
  isCenter?: boolean
  count?: number
}

type TGraphLink = { source: string; target: string }

type TCenterNode = {
  type: string
  node: TBaseAssociatedNode
}

type TObjectAssociationGraphProps = {
  controlId?: string
  centerNode: TCenterNode
  sections: Section
  isFullscreen: boolean
  closeFullScreen: () => void
  onGroupSelect?: (group: string | null) => void
  clearGroupRef?: React.MutableRefObject<(() => void) | null>
}

type TGroupItem = TBaseAssociatedNode & { link: string }

type TGroupData = {
  label: string
  count: number
  items: TGroupItem[]
}

const NODE_RADIUS = 7
const GROUP_NODE_RADIUS = 12
const FONT_SIZE = 12
const LABEL_PADDING = 4

const ObjectAssociationGraph: React.FC<TObjectAssociationGraphProps> = ({ centerNode, sections, isFullscreen, closeFullScreen, controlId, onGroupSelect, clearGroupRef }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 })
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [hoverNode, setHoverNode] = useState<NodeObject<IGraphNode> | null>(null)
  const { resolvedTheme } = useTheme()
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isFullscreen) {
      setShowFullscreen(true)
    } else {
      setSelectedGroup(null)
      const timeout = setTimeout(() => setShowFullscreen(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [isFullscreen])

  useEffect(() => {
    onGroupSelect?.(selectedGroup)
  }, [selectedGroup])

  useEffect(() => {
    if (clearGroupRef) {
      clearGroupRef.current = () => setSelectedGroup(null)
    }
  }, [clearGroupRef])

  useEffect(() => {
    if (!containerRef.current) return
    const updateSize = () => {
      const { width, height } = containerRef.current!.getBoundingClientRect()
      setDimensions({ width, height })
    }
    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(containerRef.current)
    window.addEventListener('resize', updateSize)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [isFullscreen])

  const getType = (type: string): string => {
    switch (type) {
      case 'controls':
        return 'Control'
      case 'subcontrols':
        return 'Subcontrol'
      case 'risks':
        return 'Risk'
      case 'policies':
        return 'Internal Policy'
      case 'procedures':
        return 'Procedure'
      case 'tasks':
        return 'Task'
      case 'programs':
        return 'Program'
      case 'controlObjectives':
        return 'Control Objective'
      default:
        return 'Unknown'
    }
  }
  const resolveCssVar = (varName: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  }
  const extractNodes = (edges: TEdgeNode[] | null | undefined): TBaseAssociatedNode[] => (edges ?? []).map((edge) => edge?.node).filter((node): node is TBaseAssociatedNode => !!node)

  const groupedSections = useMemo(() => {
    const groups: Record<string, TGroupData> = {}

    Object.entries(sections).forEach(([sectionType, connection]) => {
      if (!connection) return
      const mapEntry = ObjectAssociationMap[sectionType as keyof typeof ObjectAssociationMap]

      if ('edges' in connection && Array.isArray(connection.edges)) {
        const nodes = extractNodes(connection.edges)
        if (nodes.length === 0) return
        groups[sectionType] = {
          label: mapEntry?.label || sectionType,
          count: nodes.length,
          items: nodes.map((node) => ({
            ...node,
            refCode: node.refCode || node.name || node.title || '',
            description: node.summary || node.description || node.details || '',
            displayID: node.displayID || node.id,
            link:
              sectionType === 'subcontrols' && controlId ? getHrefForObjectType(sectionType, { ...node, controlId } as NormalizedObject) : getHrefForObjectType(sectionType, node as NormalizedObject),
            __typename: getType(sectionType),
          })),
        }
      } else {
        const singleNode = connection as unknown as { id: string; name?: string; refCode?: string }
        if (!singleNode.id) return
        groups[sectionType] = {
          label: mapEntry?.label || sectionType,
          count: 1,
          items: [
            {
              id: singleNode.id,
              displayID: singleNode.id,
              name: singleNode.name || singleNode.refCode || '',
              refCode: singleNode.refCode || singleNode.name || '',
              link: getHrefForObjectType(sectionType, singleNode as NormalizedObject),
              __typename: getType(sectionType),
            },
          ],
        }
      }
    })

    return groups
  }, [sections, controlId])

  const { graphData, colorMap, centerNodeMeta } = useMemo(() => {
    const displayText = centerNode.node.refCode || centerNode.node.name || centerNode.node.title || ''
    const nodes: IGraphNode[] = [{ id: centerNode.node.id, name: displayText, type: centerNode.type, isCenter: true }]
    const links: TGraphLink[] = []
    const colorMap: Record<string, string> = {}

    const centerMeta: TBaseAssociatedNode & { link: string } = {
      ...centerNode.node,
      refCode: displayText,
      description: centerNode.node.summary || centerNode.node.description || centerNode.node.details || '',
      displayID: centerNode.node.displayID || centerNode.node.id,
      link: getHrefForObjectType(centerNode.type, centerNode.node as NormalizedObject),
      __typename: getType(centerNode.type),
    }

    if (!colorMap[centerNode.type])
      colorMap[centerNode.type] = ObjectAssociationMap[centerNode.type as keyof typeof ObjectAssociationMap]
        ? resolveCssVar(ObjectAssociationMap[centerNode.type as keyof typeof ObjectAssociationMap]!.color)
        : '#ccc'

    Object.entries(groupedSections).forEach(([sectionType, group]) => {
      if (!colorMap[sectionType]) {
        colorMap[sectionType] = ObjectAssociationMap[sectionType as keyof typeof ObjectAssociationMap]
          ? resolveCssVar(ObjectAssociationMap[sectionType as keyof typeof ObjectAssociationMap]!.color)
          : '#ccc'
      }
      nodes.push({
        id: sectionType,
        name: group.label,
        type: sectionType,
        count: group.count,
      })
      links.push({ source: centerNode.node.id, target: sectionType })
    })

    return { graphData: { nodes, links }, colorMap, centerNodeMeta: centerMeta }
  }, [centerNode, groupedSections])

  useEffect(() => {
    if (!fgRef.current) return
    const fg = fgRef.current
    fg.d3Force('link')?.distance(60)
    fg.d3Force('collide', forceCollide(() => GROUP_NODE_RADIUS + FONT_SIZE + LABEL_PADDING).iterations(4))
    const edgeCount = graphData.links.length
    const maxPeripherals = 10
    const baseR = Math.min(dimensions.width, dimensions.height) / 3
    const scale = Math.min(edgeCount / maxPeripherals, 1)
    const minR = GROUP_NODE_RADIUS * 4
    const R = Math.max(minR, baseR * scale)
    fg.d3Force('radial', forceRadial((d) => ((d as IGraphNode).isCenter ? 0 : R), 0, 0).strength(0.8))
  }, [centerNode.type, dimensions, graphData])

  const CustomTooltipContent = ({ node }: { node: TBaseAssociatedNode & { link: string } }) => {
    const { convertToReadOnly } = usePlateEditor()
    const displayText = node.refCode || node.name || node.title || ''
    const displayDescription = node.summary || node.description || node.details || ''
    return (
      <div>
        <div className="grid grid-cols-[max-content_1fr] gap-x-4 items-center border-b pb-2">
          <div className="flex items-center gap-1">
            <SlidersHorizontal size={12} />
            <span className="font-medium">Name</span>
          </div>
          <span className="cursor-pointer break-words">{displayText}</span>
        </div>
        <div className="grid grid-cols-[max-content_1fr] gap-x-4 items-center border-b pb-2 pt-2">
          <div className="flex items-center gap-1">
            <Info size={12} />
            <span className="font-medium">Type</span>
          </div>
          <span className="cursor-pointer break-words">{node.__typename}</span>
        </div>
        <div className="flex flex-col pt-2">
          <div className="flex items-center gap-1">
            <PencilLine size={12} />
            <span className="font-medium">Description</span>
          </div>
          <div className="line-clamp-4 text-justify">{displayDescription ? convertToReadOnly(displayDescription) : 'No description available'}</div>
        </div>
      </div>
    )
  }

  const getTooltipPosition = (x: number, y: number, tooltipEl: HTMLDivElement, isCenter: boolean) => {
    if (!fgRef.current || !tooltipEl || !containerRef.current) return { x: 0, y: 0 }

    const pos = fgRef.current.graph2ScreenCoords(x, y)
    const containerRect = containerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipEl.getBoundingClientRect()
    const tooltipWidth = tooltipRect.width
    const tooltipHeight = tooltipRect.height
    const padding = 8
    const gap = 6

    const globalScale = fgRef.current.zoom?.() ?? 1
    const nodeScreenRadius = (isCenter ? NODE_RADIUS : GROUP_NODE_RADIUS) * globalScale + gap

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const screenX = containerRect.left + pos.x
    const screenY = containerRect.top + pos.y

    let left: number
    const spaceRight = viewportWidth - (screenX + nodeScreenRadius)
    if (spaceRight >= tooltipWidth + padding) {
      left = screenX + nodeScreenRadius
    } else {
      left = screenX - nodeScreenRadius - tooltipWidth
    }

    let top = screenY - tooltipHeight / 2

    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding))

    return { x: left, y: top }
  }

  const iconImages = useMemo(() => {
    const icons: Record<string, HTMLImageElement> = {}
    Object.entries(ObjectAssociationMap).forEach(([key, { svg }]) => {
      if (svg) {
        const img = new Image()
        img.src = `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`
        icons[key] = img
      }
    })
    return icons
  }, [])

  const coloredIconImages = useMemo(() => {
    const icons: Record<string, HTMLImageElement> = {}
    Object.entries(ObjectAssociationMap).forEach(([key, { svg }]) => {
      if (svg && colorMap[key]) {
        const coloredSvg = svg.replaceAll('currentColor', colorMap[key])
        const img = new Image()
        img.src = `data:image/svg+xml;charset=utf8,${encodeURIComponent(coloredSvg)}`
        icons[key] = img
      }
    })
    return icons
  }, [colorMap])

  const renderDetailList = () => {
    if (!selectedGroup || !groupedSections[selectedGroup]) return null
    const group = groupedSections[selectedGroup]
    const mapEntry = ObjectAssociationMap[selectedGroup as keyof typeof ObjectAssociationMap]
    const typeColor = colorMap[selectedGroup] || '#ccc'
    const coloredIconSrc = mapEntry?.svg ? `data:image/svg+xml;charset=utf8,${encodeURIComponent(mapEntry.svg.replaceAll('currentColor', typeColor))}` : undefined

    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="flex items-center gap-2 mb-4">
          {coloredIconSrc && <img src={coloredIconSrc} alt="" className="w-5 h-5" />}
          <span className="text-sm font-normal">{group.label}</span>
          <span
            className="text-xs font-normal px-1.5 py-0.5"
            style={{
              borderRadius: '4px',
              border: `1px solid ${resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#CED6DA'}`,
              background: resolvedTheme === 'dark' ? '#394B58' : '#EFF4F5',
              color: resolvedTheme === 'dark' ? '#ffffff' : '#6B7682',
            }}
          >
            {group.count}
          </span>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button onClick={() => router.push(item.link)} style={{ border: `1px solid ${typeColor}` }} className="text-left px-2 py-1 rounded-full text-sm mb-3 w-fit">
                    {item.refCode || item.name || item.title || item.displayID}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="max-w-[300px] p-2 text-xs border"
                  style={{
                    background: resolvedTheme === 'dark' ? '#09151D' : '#FFFFFF',
                    color: resolvedTheme === 'dark' ? '#FFFFFF' : '#09151D',
                    borderColor: resolvedTheme === 'dark' ? '#233440' : '#09151D1F',
                  }}
                >
                  <CustomTooltipContent node={item} />
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
    )
  }

  const renderGraph = () => (
    <>
      <ForceGraph
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        linkColor={() => (resolvedTheme === 'dark' ? '#394B58' : '#E1E7EA')}
        linkWidth={() => 2}
        enableNodeDrag={false}
        autoPauseRedraw={false}
        nodeLabel={() => ''}
        onNodeHover={(node) => {
          const graphNode = node as NodeObject<IGraphNode> | null
          setHoverNode(graphNode)
          if (containerRef.current) containerRef.current.style.cursor = node ? 'pointer' : 'default'
        }}
        onNodeClick={(node) => {
          const graphNode = node as NodeObject<IGraphNode>
          setHoverNode(null)
          if (graphNode.isCenter) {
            if (centerNodeMeta.link) window.open(centerNodeMeta.link, '_blank')
          } else {
            setSelectedGroup(graphNode.type)
          }
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const graphNode = node as NodeObject<IGraphNode>
          const label = graphNode.name
          const fontSize = FONT_SIZE / globalScale
          const isCenter = graphNode.isCenter

          if (isCenter) {
            ctx.beginPath()
            ctx.fillStyle = resolvedTheme === 'dark' ? '#1f2937' : '#ffffff'
            ctx.arc(node.x!, node.y!, NODE_RADIUS + 1, 0, 2 * Math.PI)
            ctx.fill()

            ctx.beginPath()
            ctx.fillStyle = colorMap[graphNode.type] || '#ccc'
            ctx.arc(node.x!, node.y!, NODE_RADIUS, 0, 2 * Math.PI)
            ctx.fill()

            const iconImg = iconImages[graphNode.type]
            if (iconImg?.complete) {
              ctx.drawImage(iconImg, node.x! - NODE_RADIUS / 2, node.y! - NODE_RADIUS / 2, NODE_RADIUS, NODE_RADIUS)
            }
          } else {
            const typeColor = colorMap[graphNode.type] || '#ccc'
            const iconSize = 8
            const countStr = String(graphNode.count || 0)
            const countFontSize = 7
            const pad = 4
            const gap = 3
            const nodeH = 14
            const cornerR = 22

            ctx.font = `${countFontSize}px sans-serif`
            const countTextWidth = ctx.measureText(countStr).width
            const contentW = iconSize + gap + countTextWidth
            const nodeW = contentW + pad * 2
            const nx = node.x! - nodeW / 2
            const ny = node.y! - nodeH / 2

            ctx.beginPath()
            ctx.roundRect(nx, ny, nodeW, nodeH, cornerR)
            ctx.fillStyle = resolvedTheme === 'dark' ? '#1f2937' : '#ffffff'
            ctx.fill()

            ctx.save()

            ctx.beginPath()
            ctx.roundRect(nx, ny, nodeW, nodeH, cornerR)
            ctx.globalAlpha = 0.16
            ctx.fillStyle = typeColor
            ctx.fill()

            ctx.beginPath()
            ctx.roundRect(nx, ny, nodeW, nodeH, cornerR)
            ctx.globalAlpha = 0.24
            ctx.strokeStyle = typeColor
            ctx.lineWidth = 0.8
            ctx.stroke()

            ctx.restore()

            const contentX = node.x! - contentW / 2
            const coloredIcon = coloredIconImages[graphNode.type]
            if (coloredIcon?.complete) {
              ctx.drawImage(coloredIcon, contentX, node.y! - iconSize / 2, iconSize, iconSize)
            }

            ctx.fillStyle = resolvedTheme === 'dark' ? '#FFFFFF' : '#09151D'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(countStr, contentX + iconSize + gap, node.y! + 0.4)

            ctx.font = `${fontSize}px sans-serif`
            ctx.fillStyle = resolvedTheme === 'dark' ? '#FFFFFF' : '#09151D'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText(label, node.x!, ny + nodeH + 4)
          }
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const graphNode = node as NodeObject<IGraphNode>
          if (graphNode.isCenter) {
            ctx.beginPath()
            ctx.arc(node.x!, node.y!, NODE_RADIUS, 0, 2 * Math.PI)
            ctx.fillStyle = color
            ctx.fill()
          } else {
            const iconSize = 8
            const countStr = String(graphNode.count || 0)
            ctx.font = '7px sans-serif'
            const countTextWidth = ctx.measureText(countStr).width
            const pad = 4
            const gap = 3
            const nodeW = iconSize + gap + countTextWidth + pad * 2
            const nodeH = 14
            const nx = node.x! - nodeW / 2
            const ny = node.y! - nodeH / 2
            ctx.beginPath()
            ctx.roundRect(nx, ny, nodeW, nodeH, 22)
            ctx.fillStyle = color
            ctx.fill()
          }
        }}
      />

      {hoverNode?.id &&
        hoverNode.isCenter &&
        centerNodeMeta &&
        ReactDOM.createPortal(
          <div
            ref={(el) => {
              if (!el) return
              const { x, y } = getTooltipPosition(hoverNode.x!, hoverNode.y!, el, true)
              el.style.left = `${x}px`
              el.style.top = `${y}px`
            }}
            style={{
              position: 'fixed',
              pointerEvents: 'none',
              background: resolvedTheme === 'dark' ? '#09151D' : '#FFFFFF',
              color: resolvedTheme === 'dark' ? '#FFFFFF' : '#09151D',
              border: `1px solid ${resolvedTheme === 'dark' ? '#233440' : '#09151D1F'}`,
              padding: '8px',
              borderRadius: '4px',
              zIndex: 11000,
              maxWidth: 300,
              fontSize: '0.75rem',
              lineHeight: '1rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            <CustomTooltipContent node={centerNodeMeta} />
          </div>,
          document.body,
        )}

      {hoverNode?.id &&
        !hoverNode.isCenter &&
        groupedSections[hoverNode.type] &&
        ReactDOM.createPortal(
          <div
            ref={(el) => {
              if (!el) return
              const { x, y } = getTooltipPosition(hoverNode.x!, hoverNode.y!, el, false)
              el.style.left = `${x}px`
              el.style.top = `${y}px`
            }}
            style={{
              position: 'fixed',
              pointerEvents: 'none',
              background: resolvedTheme === 'dark' ? '#09151D' : '#FFFFFF',
              color: resolvedTheme === 'dark' ? '#FFFFFF' : '#09151D',
              border: `1px solid ${resolvedTheme === 'dark' ? '#233440' : '#09151D1F'}`,
              padding: '8px',
              borderRadius: '6px',
              zIndex: 11000,
              maxWidth: 300,
              fontSize: '0.75rem',
              lineHeight: '1.25rem',
            }}
          >
            {groupedSections[hoverNode.type].items.map((item) => (
              <div key={item.id}>{item.refCode || item.name || item.title || item.displayID}</div>
            ))}
          </div>,
          document.body,
        )}
    </>
  )

  const renderContent = () => (
    <>
      <div style={{ display: selectedGroup ? 'none' : 'block', width: '100%', height: '100%' }}>{renderGraph()}</div>
      {selectedGroup && renderDetailList()}
    </>
  )

  return showFullscreen ? (
    ReactDOM.createPortal(
      <div
        onClick={closeFullScreen}
        className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${isFullscreen ? 'opacity-100' : 'opacity-0'}`}
      >
        <div onClick={(e) => e.stopPropagation()} className="relative w-[90vw] h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
          <button onClick={closeFullScreen} className="absolute top-4 right-4 z-50 p-2 rounded hover:bg-opacity-80">
            <X size={20} />
          </button>

          <div ref={containerRef} className={`w-full ${isFullscreen ? 'h-full' : 'h-[400px]'} transition-all duration-300`}>
            {renderContent()}
          </div>
        </div>
      </div>,
      document.body,
    )
  ) : (
    <div ref={containerRef} className={`w-full ${isFullscreen ? 'h-full' : 'h-[300px]'} transition-all duration-300`}>
      {renderContent()}
    </div>
  )
}

export default ObjectAssociationGraph
