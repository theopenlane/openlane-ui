import React from 'react'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { Badge } from '@repo/ui/badge'
import { type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { formatDate } from '@/utils/date'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import type { FilterField } from '@/types'
import { TruncatedCell } from '@repo/ui/data-table'

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

export const DEFAULT_VISIBILITY: VisibilityState = {
  category: false,
  source: false,
  state: false,
  tags: false,
  createdAt: false,
  updatedAt: false,
}

export const REVIEW_FILTER_FIELDS: FilterField[] = [
  { key: 'classificationContainsFold', label: 'Risk Tier', type: 'text', icon: FilterIcons.Tier },
  { key: 'categoryContainsFold', label: 'Category', type: 'text', icon: FilterIcons.Category },
  { key: 'sourceContainsFold', label: 'Source', type: 'text', icon: FilterIcons.Source },
]

export const reviewHistoryColumns: ColumnDef<ReviewsNodeNonNull>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    size: 200,
    cell: ({ row }) => <span className="block truncate">{row.original.title ?? '—'}</span>,
  },
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
    cell: ({ row }) => <TruncatedCell>{row.original.summary ?? '—'}</TruncatedCell>,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    size: 150,
    cell: ({ row }) => <span className="block truncate">{row.original.category ?? '—'}</span>,
  },
  {
    accessorKey: 'source',
    header: 'Source',
    size: 150,
    cell: ({ row }) => <span className="block truncate">{row.original.source ?? '—'}</span>,
  },
  {
    accessorKey: 'state',
    header: 'State',
    size: 130,
    cell: ({ row }) => <span className="block truncate">{row.original.state ?? '—'}</span>,
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    size: 180,
    cell: ({ row }) => <TagsCell tags={row.original.tags} />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    size: 130,
    cell: ({ cell }) => <DateCell value={cell.getValue() as string} />,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    size: 130,
    cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" />,
  },
]

export const mappedReviewColumns = getMappedColumns(reviewHistoryColumns)
