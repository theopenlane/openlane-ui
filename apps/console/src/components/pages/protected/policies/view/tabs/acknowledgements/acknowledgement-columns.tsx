'use client'

import Link from 'next/link'
import { type ColumnDef } from '@repo/ui/table-types'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { ExpandRowButton } from '@/components/shared/crud-base/columns/expand-row-button'
import { CampaignStatusLabel } from '@/components/shared/enum-mapper/campaign-enum'
import ProgressBar from '@/components/shared/progress-bar/progress-bar'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { AcknowledgementStatusLabel } from './acknowledgement-status'
import { type TAcknowledgementRow } from './acknowledgement-row'

const EMPTY = <span className="text-muted-foreground">—</span>

export const ACKNOWLEDGEMENT_COLUMNS: ColumnDef<TAcknowledgementRow>[] = [
  {
    id: 'expand',
    header: '',
    size: 40,
    maxSize: 40,
    cell: ({ row }) => <ExpandRowButton row={row} label={`recipients of ${row.original.name}`} />,
  },
  {
    accessorKey: 'name',
    header: 'Assessment',
    size: 170,
    minSize: 140,
    cell: ({ row }) => (
      <Link href={getHrefForObjectType('assessments', { id: row.original.id })} className="text-blue-500 hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'revision',
    header: 'Revision',
    size: 95,
    minSize: 95,
    cell: ({ row }) => row.original.revision ?? EMPTY,
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    size: 130,
    minSize: 115,
    cell: ({ row }) => <DateCell value={row.original.dueDate} empty="—" />,
  },
  {
    accessorKey: 'campaignStatus',
    header: 'Campaign Status',
    size: 150,
    minSize: 150,
    cell: ({ row }) => (row.original.campaignStatus ? <CampaignStatusLabel status={row.original.campaignStatus} /> : EMPTY),
  },
  {
    accessorKey: 'status',
    header: 'Progress',
    size: 170,
    minSize: 160,
    cell: ({ row }) => {
      const { sent, completed, status } = row.original
      return (
        <div className="flex flex-col gap-1.5">
          <AcknowledgementStatusLabel status={status} />
          <span className="whitespace-nowrap text-muted-foreground">
            {sent} sent · {completed} completed
          </span>
          {sent > 0 && (
            <div className="flex w-full">
              <ProgressBar percentage={(completed / sent) * 100} />
            </div>
          )}
        </div>
      )
    },
  },
]
