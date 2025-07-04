'use client'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useGetAuditLogsInfinite } from '@/lib/graphql-hooks/organization.ts'
import LogsTableToolbar from '@/components/pages/protected/organization/logs/logs-table-toolbar.tsx'
import LogCards from '@/components/pages/protected/organization/logs/log-cards.tsx'
import InfiniteScroll from '@repo/ui/infinite-scroll'
import { AuditLog, AuditLogWhereInput } from '@repo/codegen/src/schema.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { exportToCSV } from '@/utils/exportToCSV.ts'
import { useSession } from 'next-auth/react'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { isAuditLogViewer } from '@/lib/authz/utils.ts'
import ProtectedArea from '@/components/shared/protected-area/protected-area.tsx'
import { exportToJSON } from '@/utils/exportToJSON.ts'

const LogsPage: React.FC = () => {
  const { data: session } = useSession()
  const { data: permission, isLoading } = useOrganizationRole(session)
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
  const exportableColumns = [
    {
      label: 'ID',
      accessor: (log: AuditLog) => log.id,
    },
    {
      label: 'Operation',
      accessor: (log: AuditLog) => log.operation ?? '',
    },
    {
      label: 'Object',
      accessor: (log: AuditLog) => log.table ?? '',
    },
    {
      label: 'Time',
      accessor: (log: AuditLog) => log.time ?? '',
    },
    {
      label: 'Updated By',
      accessor: (log: AuditLog) => log.updatedBy ?? '',
    },
    {
      label: 'Field Name(s)',
      accessor: (log: AuditLog) => log.changes?.map((c) => c.FieldName).join('; ') ?? '',
    },
    {
      label: 'Old Value(s)',
      accessor: (log: AuditLog) => log.changes?.map((c) => c.Old ?? '').join('; ') ?? '',
    },
    {
      label: 'New Value(s)',
      accessor: (log: AuditLog) => log.changes?.map((c) => c.New ?? '').join('; ') ?? '',
    },
  ]

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

  const handleCSVExport = () => {
    exportToCSV(logs, exportableColumns, 'audit_logs')
  }

  const handleJSONExport = () => {
    exportToJSON(logs, exportableColumns, 'audit_logs')
  }

  return (
    <>
      {!isLoading && !isAuditLogViewer(permission?.roles) && <ProtectedArea />}
      {!isLoading && isAuditLogViewer(permission?.roles) && (
        <>
          <LogsTableToolbar onFilterChange={setFilters} handleCSVExport={handleCSVExport} handleJSONExport={handleJSONExport} />
          <InfiniteScroll pagination={pagination} onPaginationChange={handlePaginationChange} paginationMeta={paginationMeta} key="card">
            <LogCards logs={logs} loading={fetching} />
          </InfiniteScroll>
        </>
      )}
    </>
  )
}

export default LogsPage
