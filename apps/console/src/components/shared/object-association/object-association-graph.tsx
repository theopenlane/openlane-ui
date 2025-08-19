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
  const { resolvedTheme } = useTheme()
  const [showFullscreen, setShowFullscreen] = useState(false)

  useEffect(() => {
    if (isFullscreen) {
      setShowFullscreen(true)
    } else {
      const timeout = setTimeout(() => setShowFullscreen(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [isFullscreen])

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
      __typename: getType(centerNode.type),
    }

    if (!colorMap[centerNode.type]) colorMap[centerNode.type] = ObjectAssociationMap[centerNode.type as keyof typeof ObjectAssociationMap]?.color || '#ccc'

    Object.entries(sections).forEach(([sectionType, connection]) => {
      if (!connection?.edges) return
      if (!colorMap[sectionType]) colorMap[sectionType] = ObjectAssociationMap[sectionType as keyof typeof ObjectAssociationMap]?.color || '#ccc'
      extractNodes(connection.edges).forEach((node) => {
        const label = node.refCode || node.name || node.title || ''
        nodeMeta[node.id] = {
          ...node,
          refCode: label,
          description: node.summary || node.description || node.details || '',
          displayID: node.displayID || node.id,
          link: getHrefForObjectType(sectionType, node as NormalizedObject),
          __typename: getType(sectionType),
        }
        nodes.push({ id: node.id, name: label, type: sectionType })
        links.push({ source: centerNode.node.id, target: node.id })
      })
    })

    return { graphData: { nodes, links }, colorMap, nodeMeta }
  }, [centerNode, sections])

  useEffect(() => {
    if (!fgRef.current) return
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

  const renderGraph = () => (
    <>
      <ForceGraph
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        linkColor={() => (resolvedTheme === 'dark' ? '#bdd9e1' : '#505f6f')}
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
          if (meta?.link) window.open(meta.link, '_blank')
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
          ctx.font = `${fontSize}px sans-serif`
          ctx.fillStyle = resolvedTheme === 'dark' ? '#bdd9e1' : '#505f6f'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillText(label, node!.x!, node!.y! + NODE_RADIUS + 4)
        }}
      />
      {hoverNode?.id && nodeMeta[hoverNode.id] && (
        <div
          style={{
            position: 'absolute',
            left: getTooltipPosition(hoverNode.x!, hoverNode.y!).x + 10,
            top: getTooltipPosition(hoverNode.x!, hoverNode.y!).y + 10,
            pointerEvents: 'none',
            background: resolvedTheme === 'dark' ? '#1f2937' : 'white',
            color: resolvedTheme === 'dark' ? 'white' : 'black',
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: '4px',
            zIndex: 9999,
            maxWidth: 300,
          }}
          className="bg-background-secondary p-3 rounded-md shadow-lg text-xs min-w-[240px]"
        >
          <CustomTooltipContent node={nodeMeta[hoverNode.id]} />
        </div>
      )}
    </>
  )

  return showFullscreen ? (
    ReactDOM.createPortal(
      <div
        className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${isFullscreen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeFullScreen}
      >
        <div className="relative w-[90vw] h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
          <button onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <X size={20} />
          </button>
          <div ref={containerRef} className={`w-full ${isFullscreen ? 'h-full' : 'h-[400px]'} transition-all duration-300`}>
            {renderGraph()}
          </div>
        </div>
      </div>,
      document.body,
    )
  ) : (
    <div ref={containerRef} className={`w-full ${isFullscreen ? 'h-full' : 'h-[400px]'} transition-all duration-300`}>
      {renderGraph()}
    </div>
  )
}

export default ObjectAssociationGraph
