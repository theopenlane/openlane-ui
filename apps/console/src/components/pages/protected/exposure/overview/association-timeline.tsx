'use client'

import React from 'react'
import Link from 'next/link'
import { type TimelineNode } from '@/lib/graphql-hooks/associations-timeline'
import { formatDate } from '@/utils/date'
import { Clock } from 'lucide-react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { pluralizeTypeName } from '@/utils/strings'

const getTimelineColorVar = (type: string) => {
  const normalized = type.toLowerCase().replace(/\s+/g, '-')

  if (normalized === 'personnel') {
    return '--color-personnel-active'
  }

  return `--color-${pluralizeTypeName(normalized)}`
}

const getChipStyle = (type: string): React.CSSProperties => {
  const cssVar = getTimelineColorVar(type)
  return {
    color: `var(${cssVar}, var(--foreground))`,
    backgroundColor: `color-mix(in srgb, var(${cssVar}, var(--foreground)) 15%, transparent)`,
  }
}

type Props = {
  nodes: TimelineNode[]
  isLoading?: boolean
  suppressLinkedDateFallback?: boolean
}

const TimelineRow = ({ node, suppressLinkedDateFallback }: { node: TimelineNode; suppressLinkedDateFallback: boolean }) => {
  const chipStyle = getChipStyle(node.type)
  const date = formatDate(node.createdAt)
  const isSource = node.role === 'source'

  const nameEl = node.href ? (
    <Link href={node.href} className="text-sm font-medium truncate hover:underline">
      {node.name}
    </Link>
  ) : (
    <span className="text-sm font-medium truncate">{node.name}</span>
  )

  const subtextEl = (() => {
    if (node.subtext) {
      return <>{node.subtext}</>
    }
    if (isSource) {
      return (
        <>
          source
          {node.source && (
            <>
              {' '}
              via <span className="font-medium text-foreground/70">{node.source}</span>
            </>
          )}{' '}
          on {date}
        </>
      )
    }
    if (node.source) {
      if (suppressLinkedDateFallback) {
        return (
          <>
            created by <span className="font-medium text-foreground/70">{node.source}</span>
          </>
        )
      }
      return (
        <>
          created by <span className="font-medium text-foreground/70">{node.source}</span> on {date}
        </>
      )
    }
    if (suppressLinkedDateFallback) {
      return <>linked</>
    }
    return <>linked {date}</>
  })()

  return (
    <div className="flex gap-3 relative">
      <div className={`mt-1.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 z-10 ${isSource ? 'border-cyan-500 bg-cyan-500/20' : 'border-border bg-background'}`} />
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
          <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded" style={chipStyle}>
            {node.type}
          </span>
          {nameEl}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtextEl}</p>
      </div>
    </div>
  )
}

const AssociationTimeline = ({ nodes, isLoading, suppressLinkedDateFallback = false }: Props) => {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton width={14} height={14} className="rounded-full mt-1 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton height={12} className="w-3/4" />
              <Skeleton height={10} className="w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <Clock size={28} className="mb-2 opacity-40" />
        <p className="text-sm">No associated objects found</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-y-auto py-2 pr-1">
      <div className="absolute left-1.75 top-3 bottom-3 w-px bg-border" />

      <div className="space-y-4">
        {nodes.map((node) => (
          <TimelineRow key={`${node.type}-${node.id}`} node={node} suppressLinkedDateFallback={suppressLinkedDateFallback} />
        ))}
      </div>
    </div>
  )
}

export default AssociationTimeline
