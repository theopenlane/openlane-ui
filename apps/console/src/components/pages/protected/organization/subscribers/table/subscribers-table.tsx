'use client'

import { useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { useGetAllSubscribers } from '@/lib/graphql-hooks/subscribes'
import { exportableSubscriberColumns, subscribersColumns } from '@/components/pages/protected/organization/subscribers/table/columns.tsx'
import SubscribersTableToolbar from '@/components/pages/protected/organization/subscribers/table/subscribers-table-toolbar.tsx'
import { GetAllSubscribersQueryVariables, OrderDirection, SubscriberOrderField, SubscriberWhereInput } from '@repo/codegen/src/schema.ts'
import { SUBSCRIBERS_SORT_FIELDS } from '@/components/pages/protected/organization/subscribers/table/table-config.ts'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TPagination } from '@repo/ui/pagination-types'
import { useDebounce } from '@uidotdev/usehooks'
import { exportToCSV } from '@/utils/exportToCSV'

export const SubscribersTable = () => {
  const [filters, setFilters] = useState<SubscriberWhereInput | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [orderBy, setOrderBy] = useState<GetAllSubscribersQueryVariables['orderBy']>([
    {
      field: SubscriberOrderField.created_at,
      direction: OrderDirection.DESC,
    },
  ])

  const whereFilter = useMemo(() => {
    return {
      ...filters,
      emailContainsFold: debouncedSearch,
    }
  }, [filters, debouncedSearch])

  const { subscribers, isLoading, paginationMeta } = useGetAllSubscribers({
    where: whereFilter,
    orderBy,
    pagination,
    enabled: !!filters,
  })

  const handleExport = () => {
    exportToCSV(subscribers, exportableSubscriberColumns, 'subscribers')
  }

  return (
    <div>
      <SubscribersTableToolbar
        onFilterChange={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
        handleExport={handleExport}
      />
      <DataTable
        columns={subscribersColumns}
        data={subscribers}
        sortFields={SUBSCRIBERS_SORT_FIELDS}
        onSortChange={setOrderBy}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
      />
    </div>
  )
}
