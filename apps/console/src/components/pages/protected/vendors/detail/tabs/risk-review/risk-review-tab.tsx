'use client'

import React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { AlertTriangle, Clock, ClipboardCheck, CalendarClock } from 'lucide-react'
import type { EntityQuery } from '@repo/codegen/src/schema'

interface RiskReviewTabProps {
  vendor: EntityQuery['entity']
}

type ReviewHistoryRow = {
  id: string
  reviewer: string
  date: string
  riskTier: string
  notes: string
}

const reviewHistoryColumns: ColumnDef<ReviewHistoryRow>[] = [
  {
    accessorKey: 'reviewer',
    header: 'Reviewer',
    size: 200,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{row.original.reviewer.charAt(0)}</div>
        <span>{row.original.reviewer}</span>
      </div>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    size: 150,
  },
  {
    accessorKey: 'riskTier',
    header: 'Risk Tier',
    size: 150,
    cell: ({ row }) => <TierBadge tier={row.original.riskTier} />,
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    size: 300,
    cell: ({ row }) => <span className="truncate">{row.original.notes}</span>,
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

const RiskReviewTab: React.FC<RiskReviewTabProps> = ({ vendor }) => {
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
            <Button variant="outline" icon={<CalendarClock size={16} />} iconPosition="left">
              Edit Frequency
            </Button>
            <Button icon={<ClipboardCheck size={16} />} iconPosition="left">
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
        <DataTable columns={reviewHistoryColumns} data={[]} loading={false} tableKey={undefined} noResultsText="No review history available." />
      </div>
    </div>
  )
}

export default RiskReviewTab
