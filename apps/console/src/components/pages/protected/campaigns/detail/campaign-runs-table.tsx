'use client'

import React, { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { formatDate } from '@/utils/date'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
type CampaignRunRow = {
  id: string
  runDate: string
  totalTargets: number
  completed: number
  inProgress: number
  status: string
  expiration: string
}

type CampaignData = {
  id: string
  lastRunAt?: unknown
  launchedAt?: unknown
  status?: unknown
  dueDate?: unknown
}

type CampaignRunsTableProps = {
  campaign: CampaignData
  stats: {
    total: number
    completed: number
    inProgress: number
  }
}

const CampaignRunsTable: React.FC<CampaignRunsTableProps> = ({ campaign, stats }) => {
  const data = useMemo<CampaignRunRow[]>(() => {
    const runDate = campaign.lastRunAt || campaign.launchedAt
    if (!runDate) return []
    return [
      {
        id: campaign.id,
        runDate: formatDate(runDate as string),
        totalTargets: stats.total,
        completed: stats.completed,
        inProgress: stats.inProgress,
        status: getEnumLabel(campaign.status as string) || '',
        expiration: campaign.dueDate ? formatDate(campaign.dueDate as string) : '—',
      },
    ]
  }, [campaign, stats])

  const columns = useMemo<ColumnDef<CampaignRunRow>[]>(
    () => [
      {
        accessorKey: 'runDate',
        header: 'Run Date',
      },
      {
        accessorKey: 'totalTargets',
        header: '# Targets',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const { status, completed, inProgress } = row.original
          const parts = [status]
          if (completed > 0) parts.push(`${completed} completed`)
          if (inProgress > 0) parts.push(`${inProgress} in progress`)
          return (
            <div className="flex items-center gap-2">
              <span>{parts[0]}</span>
              {parts.length > 1 && <span className="text-muted-foreground text-xs">({parts.slice(1).join(', ')})</span>}
            </div>
          )
        },
      },
      {
        accessorKey: 'expiration',
        header: 'Expiration',
      },
    ],
    [],
  )

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Campaign Runs</h3>
      <DataTable columns={columns} data={data} loading={false} tableKey={TableKeyEnum.CAMPAIGN_RUNS} noResultsText="No campaign runs yet" />
    </div>
  )
}

export default CampaignRunsTable
