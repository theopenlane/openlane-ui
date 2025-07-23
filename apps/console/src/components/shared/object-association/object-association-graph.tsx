'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { ControlDetailsFieldsFragment } from '@repo/codegen/src/schema.ts'
import ForceGraph, { ForceGraphMethods } from 'react-force-graph-2d'

type GraphNode = {
  id: string
  name: string
  type: string
}

type GraphLink = {
  source: string
  target: string
}

type GraphSection = {
  [key: string]:
    | ControlDetailsFieldsFragment['internalPolicies']
    | ControlDetailsFieldsFragment['procedures']
    | ControlDetailsFieldsFragment['tasks']
    | ControlDetailsFieldsFragment['programs']
    | ControlDetailsFieldsFragment['risks']
}

type Props = {
  centerNodeId: string
  centerNodeLabel: string
  sections: GraphSection
}

const getRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`

const ObjectAssociationGraph: React.FC<Props> = ({ centerNodeId, centerNodeLabel, sections }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 })
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)

  useEffect(() => {
    if (fgRef.current) {
      console.log(fgRef)
      fgRef.current.d3Force('link')?.distance(20)
    }
  }, [])

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width, height })
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
    }
  }, [])

  const { graphData, colorMap } = useMemo(() => {
    const nodes: GraphNode[] = [{ id: centerNodeId, name: centerNodeLabel, type: 'center' }]
    const links: GraphLink[] = []
    const colorMap: Record<string, string> = { center: '#ffffff' }

    for (const [sectionType, connection] of Object.entries(sections)) {
      if (!colorMap[sectionType]) {
        colorMap[sectionType] = getRandomColor()
      }

      const entries = (connection?.edges ?? []).map((edge) => edge?.node)

      entries.forEach((node) => {
        if (!node) return
        nodes.push({ id: node.id, name: node.displayID, type: sectionType })
        links.push({ source: centerNodeId, target: node.id })
      })
    }

    return { graphData: { nodes, links }, colorMap }
  }, [centerNodeId, centerNodeLabel, sections])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '300px' }}>
      <ForceGraph
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        linkColor={() => 'white'}
        linkWidth={() => 2}
        enableNodeDrag={false}
        autoPauseRedraw={false}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name
          const fontSize = 12 / globalScale

          ctx.beginPath()
          ctx.fillStyle = colorMap[node.type] || '#ccc'
          ctx.arc(node.x!, node.y!, 5, 0, 2 * Math.PI)
          ctx.fill()

          ctx.font = `${fontSize}px Sans-Serif`
          ctx.fillStyle = 'white'
          ctx.fillText(label, node.x! + 8, node.y! + 3)
        }}
      />
    </div>
  )
}

export default ObjectAssociationGraph
