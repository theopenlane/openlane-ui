'use client'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetAuditLogsInfinite } from '@/lib/graphql-hooks/organization.ts'
import LogsTableToolbar from '@/components/pages/protected/organization/logs/logs-table-toolbar.tsx'
import LogCards from '@/components/pages/protected/organization/logs/log-cards.tsx'
import InfiniteScroll from '@repo/ui/infinite-scroll'
import { AuditLogWhereInput } from '@repo/codegen/src/schema.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'

const LogsPage: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [filters, setFilters] = useState<AuditLogWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const whereFilter = useMemo(() => {
    if (!filters?.table) {
      return undefined
    }

    const conditions: AuditLogWhereInput = {
      ...filters,
    }

    return conditions
  }, [filters])

  const { logs, isLoading: fetching, paginationMeta, fetchNextPage } = useGetAuditLogsInfinite({ where: whereFilter, pagination, enabled: !!whereFilter })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Audit Logs', href: '/logs' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (pagination.page === 1) {
      return
    }
    fetchNextPage()
  }, [pagination, fetchNextPage])

  const handlePaginationChange = (pagination: TPagination) => {
    setPagination(pagination)
  }

  return (
    <>
      <LogsTableToolbar onFilterChange={setFilters} />
      <InfiniteScroll pagination={pagination} onPaginationChange={handlePaginationChange} paginationMeta={paginationMeta} key="card">
        <LogCards logs={logs} loading={fetching} />
      </InfiniteScroll>
    </>
  )
}

export default LogsPage
