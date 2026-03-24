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
  paused: number
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
        paused: stats.inProgress,
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
        accessorKey: 'completed',
        header: '# Completed',
      },
      {
        accessorKey: 'paused',
        header: '# Paused',
      },
      {
        accessorKey: 'status',
        header: 'Status',
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
