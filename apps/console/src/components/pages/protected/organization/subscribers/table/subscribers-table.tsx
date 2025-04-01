'use client'

import { useState, useEffect, useMemo } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { useGetAllSubscribers } from '@/lib/graphql-hooks/subscribes'
import { Subscriber, subscribersColumns } from '@/components/pages/protected/organization/subscribers/table/columns.tsx'
import SubscribersTableToolbar from '@/components/pages/protected/organization/subscribers/table/subscribers-table-toolbar.tsx'
import { GetAllSubscribersQueryVariables, OrderDirection, SubscriberOrderField } from '@repo/codegen/src/schema.ts'
import { SUBSCRIBERS_SORT_FIELDS } from '@/components/pages/protected/organization/subscribers/table/table-config.ts'

export const SubscribersTable = () => {
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([])
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

  const { data, isLoading, isError } = useGetAllSubscribers(whereFilter, orderBy)

  useEffect(() => {
    if (data?.subscribers?.edges) {
      const subscribers = data.subscribers.edges.map((edge) => edge?.node).filter((node) => node !== null) as Subscriber[]
      setFilteredSubscribers(subscribers)
    }
  }, [data])

  useEffect(() => {
    if (data?.subscribers?.edges) {
      const filtered = data.subscribers.edges.filter((edge) => {
        const email = edge?.node?.email.toLowerCase() || ''
        return email.includes(searchTerm)
      })
      const filteredSubscribers = filtered.map((edge) => edge?.node).filter((node) => node !== null) as Subscriber[]
      setFilteredSubscribers(filteredSubscribers)
    }
  }, [searchTerm])

  return (
    <div>
      <SubscribersTableToolbar onFilterChange={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <DataTable columns={subscribersColumns} data={filteredSubscribers} sortFields={SUBSCRIBERS_SORT_FIELDS} onSortChange={setOrderBy} />
    </div>
  )
}
