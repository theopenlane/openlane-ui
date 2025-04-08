'use client'

import { useState, useMemo } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { useFilteredSubscribers } from '@/lib/graphql-hooks/subscribes'
import { subscribersColumns } from '@/components/pages/protected/organization/subscribers/table/columns.tsx'
import SubscribersTableToolbar from '@/components/pages/protected/organization/subscribers/table/subscribers-table-toolbar.tsx'
import { GetAllSubscribersQueryVariables, OrderDirection, SubscriberOrderField } from '@repo/codegen/src/schema.ts'
import { SUBSCRIBERS_SORT_FIELDS } from '@/components/pages/protected/organization/subscribers/table/table-config.ts'

export const SubscribersTable = () => {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState<GetAllSubscribersQueryVariables['orderBy']>([
    {
      field: SubscriberOrderField.email,
      direction: OrderDirection.DESC,
    },
  ])

  const whereFilter = useMemo(() => {
    const conditions: Record<string, any> = {
      ...filters,
    }

    return conditions
  }, [filters])

  const { subscribers, isLoading, isError } = useFilteredSubscribers(searchTerm, whereFilter, orderBy)

  return (
    <div>
      <SubscribersTableToolbar onFilterChange={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <DataTable columns={subscribersColumns} data={subscribers} sortFields={SUBSCRIBERS_SORT_FIELDS} onSortChange={setOrderBy} loading={isLoading} />
    </div>
  )
}
