'use client'

import React, { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { AlertTriangle, Clock, ClipboardCheck, CalendarClock } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@repo/ui/dropdown-menu'
import { EntityFrequency, type EntityQuery, type UpdateEntityInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type ReviewsNodeNonNull, useReviewsWithFilter } from '@/lib/graphql-hooks/review'
import { formatDate } from '@/utils/date'
import CreateReviewSheet from './create-review-sheet'

interface RiskReviewTabProps {
  vendor: EntityQuery['entity']
  handleUpdateField: (input: UpdateEntityInput) => Promise<void>
  canEdit: boolean
}

const reviewHistoryColumns: ColumnDef<ReviewsNodeNonNull>[] = [
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

const TIER_COLORS: Record<string, string> = {
  high: 'bg-red-500/16 text-red-400 border-red-500/24',
  critical: 'bg-red-500/16 text-red-400 border-red-500/24',
  medium: 'bg-orange-500/16 text-orange-400 border-orange-500/24',
  low: 'bg-green-500/16 text-green-400 border-green-500/24',
}

const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const colorClass = TIER_COLORS[tier.toLowerCase()] ?? ''
  return <Badge className={colorClass}>{tier}</Badge>
}

const RiskReviewTab: React.FC<RiskReviewTabProps> = ({ vendor, handleUpdateField, canEdit }) => {
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false)

  const { reviewsNodes, isLoading } = useReviewsWithFilter({
    where: { hasEntitiesWith: [{ id: vendor.id }] },
  })

  const isOverdue = vendor.nextReviewAt && new Date(vendor.nextReviewAt) < new Date()
  const isHighRisk = vendor.tier?.toLowerCase() === 'high' || vendor.tier?.toLowerCase() === 'critical'

  return (
    <div className="space-y-6">
      {isOverdue && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <Clock size={16} />
          <span className="text-sm font-medium">Review overdue - immediate action required</span>
        </div>
      )}

      {isHighRisk && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle size={16} />
          <span className="text-sm font-medium">High risk vendor - immediate action required</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Risk summary</h3>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" icon={<CalendarClock size={16} />} iconPosition="left" disabled={!canEdit}>
                  Edit Frequency
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Review Frequency</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={vendor.reviewFrequency ?? ''} onValueChange={(value) => handleUpdateField({ reviewFrequency: value as EntityFrequency })}>
                  {Object.values(EntityFrequency).map((freq) => (
                    <DropdownMenuRadioItem key={freq} value={freq}>
                      {getEnumLabel(freq)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button icon={<ClipboardCheck size={16} />} iconPosition="left" disabled={!canEdit} onClick={() => setIsCreateReviewOpen(true)}>
              Review
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Risk Tier</p>
              {vendor.tier ? <TierBadge tier={vendor.tier} /> : <span className="text-sm">—</span>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Risk Rating</p>
              {vendor.riskRating ? <Badge variant="outline">{vendor.riskRating}</Badge> : <span className="text-sm">—</span>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Risk Score</p>
              {vendor.riskScore != null ? <Badge variant="outline">{String(vendor.riskScore)}</Badge> : <span className="text-sm">—</span>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Renewal Risk Rating</p>
              {vendor.renewalRisk ? <Badge variant="outline">{vendor.renewalRisk}</Badge> : <span className="text-sm">—</span>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Review History</h3>
        <DataTable columns={reviewHistoryColumns} data={reviewsNodes} loading={isLoading} tableKey={undefined} noResultsText="No review history available." />
      </div>

      {isCreateReviewOpen && <CreateReviewSheet entityId={vendor.id} onClose={() => setIsCreateReviewOpen(false)} />}
    </div>
  )
}

export default RiskReviewTab
