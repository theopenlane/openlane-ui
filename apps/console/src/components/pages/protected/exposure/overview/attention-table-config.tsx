'use client'

import React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Bug, FileSearch, AlertTriangle, GitMerge } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { type AttentionItem } from './items-requiring-attention'

export const TYPE_ICONS = {
  Vulnerability: Bug,
  Finding: FileSearch,
  Risk: AlertTriangle,
}

export const TYPE_HREFS: Record<AttentionItem['type'], string> = {
  Vulnerability: '/exposure/vulnerabilities',
  Finding: '/exposure/findings',
  Risk: '/exposure/risks',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-destructive bg-destructive/10',
  high: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20',
  low: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20',
}

export const getSeverityClass = (severity: string) => {
  const s = severity.toLowerCase()
  if (s.includes('critical')) return SEVERITY_COLORS.critical
  if (s.includes('high')) return SEVERITY_COLORS.high
  if (s.includes('medium') || s.includes('med')) return SEVERITY_COLORS.medium
  if (s.includes('low')) return SEVERITY_COLORS.low
  return 'text-muted-foreground bg-muted'
}

export const getAttentionColumns = (onAssociate: (item: AttentionItem) => void): ColumnDef<AttentionItem>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 240,
    cell: ({ row }) => {
      const Icon = TYPE_ICONS[row.original.type]
      return (
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-muted-foreground shrink-0" />
          <span className="truncate font-medium" title={row.original.name}>
            {row.original.name}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    size: 120,
    cell: ({ row }) => {
      const Icon = TYPE_ICONS[row.original.type]
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon size={12} />
          {row.original.type}
        </div>
      )
    },
  },
  {
    accessorKey: 'severity',
    header: 'Severity',
    size: 110,
    cell: ({ row }) => <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getSeverityClass(row.original.severity)}`}>{row.original.severity || '—'}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: ({ row }) => <span className="text-xs text-muted-foreground capitalize">{(row.original.status ?? '').toLowerCase().replace(/_/g, ' ') || '—'}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    size: 130,
    cell: ({ row }) => <DateCell value={row.original.createdAt} />,
  },
  {
    id: 'associations',
    header: '',
    size: 48,
    enableResizing: false,
    meta: { className: 'w-12' },
    cell: ({ row }) => (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-1 rounded hover:bg-secondary transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onAssociate(row.original)
              }}
            >
              <GitMerge size={14} className="text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">View associated objects</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
]
