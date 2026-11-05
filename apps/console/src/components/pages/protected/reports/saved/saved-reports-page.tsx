'use client'

import React, { use, useCallback, useEffect, useMemo } from 'react'
import { LoaderCircle, Play, Plus, Search as SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { PageHeading } from '@repo/ui/page-heading'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type ColumnDef } from '@repo/ui/table-types'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { tableActionAnchor } from '@/components/shared/element-anchor/element-anchor'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useOrgTablePagination } from '@/hooks/use-org-table-state'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { type TSavedReportNode, type TSavedReportRef, useGetSavedReports } from '@/lib/graphql-hooks/report'
import { CUSTOM_REPORT_HREF, SAVED_REPORTS_HREF, savedReportDataLabel, savedReportHref, savedReportsEmptyMessage } from '@/lib/report/saved-report'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { ReportVisibilityLabel } from './report-visibility'
import { SavedReportMenu, useSavedReportActions } from './use-saved-report-actions'

const SavedReportsPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const { searchText, setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const [pagination, setPagination, resetPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.SAVED_REPORTS)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Saved Reports', href: SAVED_REPORTS_HREF },
    ])
  }, [setCrumbs])

  const handleSearchChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchText(event.currentTarget.value)
    resetPagination()
  }

  const { reports, paginationMeta, isPending, isFetching, error } = useGetSavedReports({ search: debouncedTerm, pagination })

  useQueryErrorNotification({ error, description: 'Failed to load saved reports' })

  const reportIds = useMemo(() => reports.map((report) => report.id), [reports])
  const handleEdit = useCallback((report: TSavedReportRef) => router.push(savedReportHref(report.id, { edit: true })), [router])
  const { menuActionsFor, dialogs } = useSavedReportActions({ reportIds, onEdit: handleEdit })

  const columns = useMemo<ColumnDef<TSavedReportNode>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        minSize: 240,
        cell: ({ row }) => (
          <Link href={savedReportHref(row.original.id)} className="text-blue-500 hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      { id: 'reportOn', accessorKey: 'variables', header: 'Report on', enableSorting: false, minSize: 160, cell: ({ row }) => savedReportDataLabel(row.original.variables) },
      { accessorKey: 'visibility', header: 'Sharing', enableSorting: false, minSize: 140, cell: ({ row }) => <ReportVisibilityLabel visibility={row.original.visibility} /> },
      { accessorKey: 'updatedAt', header: 'Last updated', enableSorting: false, minSize: 140, cell: ({ row }) => <DateCell value={row.original.updatedAt} /> },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        minSize: 160,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button asChild variant="secondary" icon={<Play size={14} />} iconPosition="left">
              <Link href={savedReportHref(row.original.id)}>Run</Link>
            </Button>
            <SavedReportMenu reportName={row.original.name} actions={menuActionsFor(row.original)} />
          </div>
        ),
      },
    ],
    [menuActionsFor],
  )

  const isSearching = getIsSearching(isFetching)

  return (
    <div className="flex flex-col gap-4">
      <PageHeading heading="Saved Reports" />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Input
          icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search reports"
          aria-label="Search reports"
          value={searchText}
          onChange={handleSearchChange}
          variant="searchTable"
        />
        <Button asChild icon={<Plus size={16} />} iconPosition="left" {...tableActionAnchor(ObjectTypes.REPORT, 'create')}>
          <Link href={CUSTOM_REPORT_HREF}>New report</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={reports}
        loading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.SAVED_REPORTS}
        getRowId={(row) => row.id}
        noResultsText={savedReportsEmptyMessage(debouncedTerm, !!error)}
      />

      {dialogs}
    </div>
  )
}

export default SavedReportsPage
