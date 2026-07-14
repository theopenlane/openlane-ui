import React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Play, ArrowRight, Eye, MessageSquare } from 'lucide-react'
import { TruncatedCell } from '@repo/ui/data-table'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { EvidenceBadgeMapper } from '@/components/shared/enum-mapper/evidence-enum'
import { ReviewReviewStatus, type User, type EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { type AuditorDashboardControlNode } from '@/lib/graphql-hooks/control'
import { type ControlReviewSummary } from '../utils/control-status'

export type AuditorDashboardControlRow = NonNullable<AuditorDashboardControlNode> & {
  evidenceStatus: EvidenceEvidenceStatus | null
  review: ControlReviewSummary | null
  lastReviewed: string | null
}

type GetColumnsArgs = {
  canCreateReview: boolean
  onStartReview: (controlId: string) => void
  onOpenReview: (reviewId: string) => void
}

export const getAuditorDashboardColumns = ({ canCreateReview, onStartReview, onOpenReview }: GetColumnsArgs): ColumnDef<AuditorDashboardControlRow>[] => {
  return [
    {
      accessorKey: 'refCode',
      header: 'Control',
      size: 220,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.refCode}</span>
          {row.original.title && <TruncatedCell className="text-muted-foreground text-xs">{row.original.title}</TruncatedCell>}
        </div>
      ),
    },
    {
      id: 'evidenceStatus',
      header: 'Evidence Status',
      size: 150,
      cell: ({ row }) => {
        const status = row.original.evidenceStatus
        if (!status) {
          return <Badge variant="destructive">Missing</Badge>
        }
        return EvidenceBadgeMapper[status]
      },
    },
    {
      id: 'reviewStatus',
      header: 'Review Status',
      size: 140,
      cell: ({ row }) => {
        const status = row.original.review?.status
        if (!status) {
          return <span className="text-muted-foreground">Not Started</span>
        }
        return <span>{getEnumLabel(status)}</span>
      },
    },
    {
      id: 'owner',
      header: 'Owner',
      size: 180,
      cell: ({ row }) => <UserCell user={(row.original.controlOwner as User) ?? undefined} fallback="—" />,
    },
    {
      id: 'lastReviewed',
      header: 'Last Reviewed',
      size: 130,
      cell: ({ row }) => {
        const lastReviewed = row.original.lastReviewed
        return lastReviewed ? <DateCell value={lastReviewed} variant="timesince" /> : <span className="text-muted-foreground">—</span>
      },
    },
    {
      id: 'actions',
      header: '',
      size: 150,
      maxSize: 150,
      enableHiding: false,
      cell: ({ row }) => {
        const { review } = row.original

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(event) => event.stopPropagation()}>
            {!review ? (
              canCreateReview && (
                <Button variant="primary" className="h-8 px-2!" icon={<Play size={14} />} iconPosition="left" onClick={() => onStartReview(row.original.id)}>
                  Start
                </Button>
              )
            ) : review.status === ReviewReviewStatus.COMPLETED ? (
              <Button variant="secondary" className="h-8 px-2!" icon={<Eye size={14} />} iconPosition="left" onClick={() => onOpenReview(review.id)}>
                View
              </Button>
            ) : (
              <Button variant="primary" className="h-8 px-2!" icon={<ArrowRight size={14} />} iconPosition="left" onClick={() => onOpenReview(review.id)}>
                Continue
              </Button>
            )}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="h-8 w-8 p-0!" aria-label="Request info" disabled>
                    <MessageSquare size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Request info (coming soon)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      },
    },
  ]
}

export const getAuditorDashboardMappedColumns = (columns: ColumnDef<AuditorDashboardControlRow>[]): { accessorKey: string; header: string }[] =>
  columns.flatMap((column) => {
    const id = column.id ?? ('accessorKey' in column && typeof column.accessorKey === 'string' ? column.accessorKey : undefined)
    if (!id || column.enableHiding === false || typeof column.header !== 'string' || column.header === '') {
      return []
    }
    return [{ accessorKey: id, header: column.header }]
  })
