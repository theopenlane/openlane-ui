'use client'

import React from 'react'
import Link from 'next/link'
import { type TimelineNode } from '@/lib/graphql-hooks/associations-timeline'
import { format } from 'date-fns'
import { Clock } from 'lucide-react'
import Skeleton from '@/components/shared/skeleton/skeleton'

const TYPE_COLORS: Record<string, string> = {
  Control: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  Subcontrol: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  Risk: 'bg-red-500/15 text-red-700 dark:text-red-400',
  Finding: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  Vulnerability: 'bg-destructive/15 text-destructive',
  Program: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  Task: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  Asset: 'bg-green-500/15 text-green-700 dark:text-green-400',
  Scan: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  Remediation: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  Review: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
  Procedure: 'bg-pink-500/15 text-pink-700 dark:text-pink-400',
}

const formatDate = (iso: string): string => {
  try {
    return format(new Date(iso), 'MMMM d, yyyy')
  } catch {
    return iso
  }
}

type Props = {
  nodes: TimelineNode[]
  isLoading?: boolean
}

const AssociationTimeline = ({ nodes, isLoading }: Props) => {
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
    <div className="relative max-h-80 overflow-y-auto py-2 pr-1">
      <div className="absolute left-1.75 top-3 bottom-3 w-px bg-border" />

      <div className="space-y-4">
        {nodes.map((node) => {
          const chipClass = TYPE_COLORS[node.type] ?? 'bg-muted text-muted-foreground'
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
              return (
                <>
                  created by <span className="font-medium text-foreground/70">{node.source}</span> on {date}
                </>
              )
            }
            return <>linked {date}</>
          })()

          return (
            <div key={`${node.type}-${node.id}`} className="flex gap-3 relative">
              <div className={`mt-1.5 w-3.5 h-3.5 rounded-full border-2 shrink-0 z-10 ${isSource ? 'border-cyan-500 bg-cyan-500/20' : 'border-border bg-background'}`} />
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                  <span className={`inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded ${chipClass}`}>{node.type}</span>
                  {nameEl}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{subtextEl}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AssociationTimeline
