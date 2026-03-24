'use client'

import React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Share2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { type AttentionItem } from './items-requiring-attention'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { getSeverityStyle } from '@/utils/severity'
import { searchTypeIcons } from '@/components/shared/search/search-config'
import { type SlaDefinitionsNodeNonNull } from '@/lib/graphql-hooks/sla-definition'

export const TYPE_HREFS: Record<AttentionItem['type'], string> = {
  [ObjectTypes.VULNERABILITY]: '/exposure/vulnerabilities',
  [ObjectTypes.FINDING]: '/exposure/findings',
  [ObjectTypes.RISK]: '/exposure/risks',
}

const isPastDue = (item: AttentionItem, slaDefinitions: SlaDefinitionsNodeNonNull[]): { pastDue: boolean; slaDays?: number; dueDate?: Date } => {
  const sla = slaDefinitions.find((def) => def.slaDefinitionSeverityLevelName?.toLowerCase() === item.severity.toLowerCase())
  if (!sla?.slaDays) return { pastDue: false }
  const dueDate = new Date(item.createdAt)
  dueDate.setDate(dueDate.getDate() + sla.slaDays)
  return { pastDue: dueDate < new Date(), slaDays: sla.slaDays, dueDate }
}

export const getAttentionColumns = (onAssociate: (item: AttentionItem) => void, slaDefinitions: SlaDefinitionsNodeNonNull[]): ColumnDef<AttentionItem>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 280,
    cell: ({ row }) => {
      const Icon = searchTypeIcons[row.original.type]
      const { pastDue, slaDays, dueDate } = isPastDue(row.original, slaDefinitions)
      return (
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} className="text-muted-foreground shrink-0" />
          <span className="truncate font-medium" title={row.original.name}>
            {row.original.name}
          </span>
          {pastDue && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium bg-danger/15 text-danger border border-danger/30 cursor-default">Past Due</span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56">
                  <p className="font-medium mb-1">SLA Exceeded</p>
                  <p className="text-xs text-muted-foreground">
                    {slaDays}-day SLA for {row.original.severity.toLowerCase()} severity
                  </p>
                  {dueDate && <p className="text-xs text-muted-foreground">Due: {dueDate.toLocaleDateString()}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    size: 120,
    cell: ({ row }) => {
      const Icon = searchTypeIcons[row.original.type]
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
    cell: ({ row }) => (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={getSeverityStyle(row.original.severity)}>
        {row.original.severity || '—'}
      </span>
    ),
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
              <Share2 size={14} className="text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">View associated objects</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
  },
]
