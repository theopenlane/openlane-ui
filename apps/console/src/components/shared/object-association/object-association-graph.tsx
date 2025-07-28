'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import ForceGraph, { ForceGraphMethods, NodeObject } from 'react-force-graph-2d'
import { forceCollide, forceRadial } from 'd3-force'
import usePlateEditor from '../plate/usePlateEditor'
import { PencilLine, SlidersHorizontal, X } from 'lucide-react'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum.tsx'
import { getHrefForObjectType, NormalizedObject } from '@/utils/getHrefForObjectType.ts'
import { Section, TBaseAssociatedNode, TEdgeNode } from '@/components/shared/object-association/types/object-association-types.ts'

interface IGraphNode {
  id: string
  name: string
  type: string
}

type TGraphLink = { source: string; target: string }

type TCenterNode = {
  type: string
  node: TBaseAssociatedNode
}

type TObjectAssociationGraphProps = {
  centerNode: TCenterNode
  sections: Section
  isFullscreen: boolean
  closeFullScreen: () => void
}

const NODE_RADIUS = 7
const FONT_SIZE = 12
const LABEL_PADDING = 4

const ObjectAssociationGraph: React.FC<TObjectAssociationGraphProps> = ({ centerNode, sections, isFullscreen, closeFullScreen }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 })
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [hoverNode, setHoverNode] = useState<NodeObject<IGraphNode> | null>(null)

  useEffect(() => {
    if (!isFullscreen && containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          setDimensions({ width, height })
        }
      })
      resizeObserver.observe(containerRef.current)
      return () => resizeObserver.disconnect()
    } else {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
      const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isFullscreen])

  const extractNodes = (edges: TEdgeNode[] | null | undefined): TBaseAssociatedNode[] => (edges ?? []).map((edge) => edge?.node).filter((node): node is TBaseAssociatedNode => !!node)

  const { graphData, colorMap, nodeMeta } = useMemo(() => {
    const displayText = centerNode.node.refCode || centerNode.node.name || centerNode.node.title || ''
    const nodes: IGraphNode[] = [{ id: centerNode.node.id, name: displayText, type: centerNode.type }]
    const links: TGraphLink[] = []
    const colorMap: Record<string, string> = {}
    const nodeMeta: Record<string, TBaseAssociatedNode & { link: string }> = {}

    nodeMeta[centerNode.node.id] = {
      ...centerNode.node,
      refCode: displayText,
      description: centerNode.node.summary || centerNode.node.description || centerNode.node.details || '',
      displayID: centerNode.node.displayID || centerNode.node.id,
      link: getHrefForObjectType(centerNode.type, centerNode.node as NormalizedObject),
    }

    if (!colorMap[centerNode.type]) {
      colorMap[centerNode.type] = ObjectAssociationMap[centerNode.type as keyof typeof ObjectAssociationMap]?.color || '#ccc'
    }

    Object.entries(sections).forEach(([sectionType, connection]) => {
      if (!connection?.edges) return
      if (!colorMap[sectionType]) {
        colorMap[sectionType] = ObjectAssociationMap[sectionType as keyof typeof ObjectAssociationMap]?.color || '#ccc'
      }
      extractNodes(connection.edges).forEach((node) => {
        const label = node.refCode || node.name || node.title || ''
        nodeMeta[node.id] = {
          ...node,
          refCode: label,
          description: node.summary || node.description || node.details || '',
          displayID: node.displayID || node.id,
          link: getHrefForObjectType(sectionType, node as NormalizedObject),
        }
        nodes.push({ id: node.id, name: label, type: sectionType })
        links.push({ source: centerNode.node.id, target: node.id })
      })
    })

    return { graphData: { nodes, links }, colorMap, nodeMeta }
  }, [centerNode, sections])

  useEffect(() => {
    if (!fgRef.current) {
      return
    }
    const fg = fgRef.current
    fg.d3Force('link')?.distance(50)
    fg.d3Force('collide', forceCollide(() => NODE_RADIUS + FONT_SIZE + LABEL_PADDING).iterations(4))
    const edgeCount = graphData.links.length
    const maxPeripherals = 10
    const baseR = Math.min(dimensions.width, dimensions.height) / 3
    const scale = Math.min(edgeCount / maxPeripherals, 1)
    const minR = NODE_RADIUS * 4
    const R = Math.max(minR, baseR * scale)

    fg.d3Force('radial', forceRadial((d) => ((d as IGraphNode).type === centerNode.type ? 0 : R), 0, 0).strength(0.8))
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

  const getTooltipPosition = (x: number, y: number) => (fgRef.current ? fgRef.current.graph2ScreenCoords(x, y) : { x: 0, y: 0 })

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

  const graphContent = (
    <div
      ref={containerRef}
      className={isFullscreen ? 'bg-card' : 'transparent'}
      style={{
        width: '100%',
        height: isFullscreen ? '100vh' : '300px',
        position: isFullscreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        zIndex: isFullscreen ? 1000 : 'auto',
      }}
    >
      {isFullscreen && (
        <button onClick={() => closeFullScreen()} className="absolute top-4 right-4 z-50 p-2 rounded hover:bg-opacity-80">
          <X size={20} />
        </button>
      )}

      <ForceGraph
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        linkColor={() => 'white'}
        linkWidth={() => 2}
        enableNodeDrag={false}
        autoPauseRedraw={false}
        nodeLabel={() => ''}
        onNodeHover={(node) => {
          setHoverNode(node as NodeObject<IGraphNode> | null)
          if (containerRef.current) containerRef.current.style.cursor = node ? 'pointer' : 'default'
        }}
        onNodeClick={(node) => {
          const meta = nodeMeta[node!.id as string]
          if (meta?.link) {
            window.open(meta.link, '_blank')
          }
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node!.name
          const fontSize = FONT_SIZE / globalScale

          ctx.beginPath()
          ctx.fillStyle = colorMap[node!.type] || '#ccc'
          ctx.arc(node!.x!, node!.y!, NODE_RADIUS, 0, 2 * Math.PI)
          ctx.fill()

          const iconImg = iconImages[node!.type]
          if (iconImg?.complete) {
            const size = NODE_RADIUS
            ctx.drawImage(iconImg, node!.x! - size / 2, node!.y! - size / 2, size, size)
          }

          if (hoverNode?.id === node!.id) {
            ctx.lineWidth = 1
            ctx.stroke()
          }

          ctx.font = `${fontSize}px Sans-Serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillStyle = 'white'
          ctx.fillText(label, node!.x!, node!.y! + NODE_RADIUS + LABEL_PADDING)
        }}
      />

      {hoverNode?.id &&
        nodeMeta[hoverNode.id] &&
        (() => {
          const { x, y } = getTooltipPosition(hoverNode.x!, hoverNode.y!)
          return (
            <div
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: 'translate(-50%, -100%)',
                zIndex: 99999,
                pointerEvents: 'none',
              }}
              className="bg-background-secondary p-3 rounded-md shadow-lg text-xs min-w-[240px]"
            >
              <CustomTooltipContent node={nodeMeta[hoverNode.id]} />
            </div>
          )
        })()}
    </div>
  )

  return <>{isFullscreen ? ReactDOM.createPortal(graphContent, document.body) : graphContent}</>
}

export default ObjectAssociationGraph
