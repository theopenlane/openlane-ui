import React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@repo/ui/badge'
import { type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { formatDate } from '@/utils/date'

const TIER_COLORS: Record<string, string> = {
  high: 'bg-red-500/16 text-red-400 border-red-500/24',
  critical: 'bg-red-500/16 text-red-400 border-red-500/24',
  medium: 'bg-orange-500/16 text-orange-400 border-orange-500/24',
  low: 'bg-green-500/16 text-green-400 border-green-500/24',
}

export const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const colorClass = TIER_COLORS[tier.toLowerCase()] ?? ''
  return <Badge className={colorClass}>{tier}</Badge>
}

export const isHighRiskTier = (tier?: string | null) => {
  const t = tier?.toLowerCase()
  return t === 'high' || t === 'critical'
}

export const reviewHistoryColumns: ColumnDef<ReviewsNodeNonNull>[] = [
  {
    accessorKey: 'reporter',
    header: 'Reviewer',
    size: 200,
    cell: ({ row }) =>
      row.original.reporter ? (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{row.original.reporter.charAt(0)}</div>
          <span>{row.original.reporter}</span>
        </div>
      ) : (
        <span className="text-sm">—</span>
      ),
  },
  {
    accessorKey: 'reviewedAt',
    header: 'Date',
    size: 150,
    cell: ({ row }) => (row.original.reviewedAt ? formatDate(row.original.reviewedAt) : <span className="text-sm">—</span>),
  },
  {
    accessorKey: 'classification',
    header: 'Risk Tier',
    size: 150,
    cell: ({ row }) => (row.original.classification ? <TierBadge tier={row.original.classification} /> : <span className="text-sm">—</span>),
  },
  {
    accessorKey: 'summary',
    header: 'Notes',
    size: 300,
    cell: ({ row }) => <span className="truncate">{row.original.summary ?? '—'}</span>,
  },
]
