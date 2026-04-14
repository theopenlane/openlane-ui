'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SearchFilterBar } from '@/components/shared/crud-base/tabs/shared'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useCampaignTargetsWithFilter, type CampaignTargetsNodeNonNull } from '@/lib/graphql-hooks/campaign-target'
import { formatDate } from '@/utils/date'

type RecipientsTableProps = {
  campaignId: string
  onRecipientClick: (recipient: CampaignTargetsNodeNonNull) => void
}

const getRecipientStatus = (recipient: CampaignTargetsNodeNonNull) => {
  if (recipient.completedAt) return { label: 'Completed', color: 'bg-green-500' }
  if (recipient.sentAt) return { label: 'Sent', color: 'bg-blue-500' }
  return { label: 'Pending', color: 'bg-gray-500' }
}

const RecipientsTable: React.FC<RecipientsTableProps> = ({ campaignId, onRecipientClick }) => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo(() => {
    const base: Record<string, unknown> = { hasCampaignWith: [{ id: campaignId }] }
    if (debouncedSearch) {
      base.or = [{ fullNameContainsFold: debouncedSearch }, { emailContainsFold: debouncedSearch }]
    }
    return base
  }, [campaignId, debouncedSearch])

  const {
    CampaignTargetsNodes: recipients,
    data,
    isLoading,
    isFetching,
  } = useCampaignTargetsWithFilter({
    where,
    pagination,
    enabled: !!campaignId,
  })

  const columns = useMemo<ColumnDef<CampaignTargetsNodeNonNull>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Name',
        cell: ({ row }) => (
          <button type="button" onClick={() => onRecipientClick(row.original)} className="block truncate text-blue-500 hover:underline">
            {row.original.fullName || '—'}
          </button>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = getRecipientStatus(row.original)
          return (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
              {s.label}
            </div>
          )
        },
      },
      {
        accessorKey: 'sentAt',
        header: 'Sent At',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.sentAt ? formatDate(row.original.sentAt as string) : '—'}</span>,
      },
      {
        accessorKey: 'completedAt',
        header: 'Completed At',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.completedAt ? formatDate(row.original.completedAt as string) : '—'}</span>,
      },
    ],
    [onRecipientClick],
  )

  const paginationMeta = useMemo(
    () => ({
      totalCount: data?.campaignTargets?.totalCount ?? 0,
      pageInfo: data?.campaignTargets?.pageInfo,
      isLoading: isFetching,
    }),
    [data, isFetching],
  )

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Recipients</h3>
      <div className="mb-3">
        <SearchFilterBar placeholder="Search recipients" isSearching={search !== debouncedSearch} searchValue={search} onSearchChange={setSearch} filterFields={null} onFilterChange={() => {}} />
      </div>
      <DataTable
        columns={columns}
        data={recipients}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.CAMPAIGN_RECIPIENTS}
        noResultsText="No recipients found"
      />
    </div>
  )
}

export default RecipientsTable
