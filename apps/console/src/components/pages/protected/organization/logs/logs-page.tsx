'use client'
import React, { useMemo, useState } from 'react'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetAuditLogs } from '@/lib/graphql-hooks/organization.ts'
import LogsTableToolbar from '@/components/pages/protected/organization/logs/logs-table-toolbar.tsx'
import LogCards from '@/components/pages/protected/organization/logs/log-cards.tsx'

const LogsPage: React.FC = () => {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const whereFilter = useMemo(() => {
    const conditions: Record<string, any> = {
      ...filters,
    }

    return conditions
  }, [filters])

  const { logs, isLoading: fetching } = useGetAuditLogs({ where: whereFilter, pagination })

  return (
    <>
      <LogsTableToolbar onFilterChange={setFilters} />
      <LogCards logs={logs} loading={fetching} />
    </>
  )
}

export default LogsPage
