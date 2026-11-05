'use client'

import React, { use, useCallback, useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Play, Plus, Search as SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReportOrderField, type ReportWhereInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Button } from '@repo/ui/button'
import { DataTable, type SortCondition } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { PageHeading } from '@repo/ui/page-heading'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type ColumnDef } from '@repo/ui/table-types'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { tableActionAnchor } from '@/components/shared/element-anchor/element-anchor'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { SAVED_REPORTS_DEFAULT_ORDER, type TSavedReportNode, type TSavedReportRef, useGetSavedReports } from '@/lib/graphql-hooks/report'
import { CUSTOM_REPORT_HREF, SAVED_REPORTS_HREF, savedReportDataLabel, savedReportHref, savedReportOwnerId, savedReportsEmptyMessage } from '@/lib/report/saved-report'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { ReportVisibilityLabel } from './report-visibility'
import { SavedReportOwner } from './saved-report-owner'
import { mapSavedReportFilterKey, SAVED_REPORTS_SORT_FIELDS, useSavedReportFilterFields, useSavedReportQuickFilters } from './saved-reports-table-config'
import { SavedReportMenu, useSavedReportActions } from './use-saved-report-actions'

const SavedReportsPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const { searchText, setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const [pagination, setPagination, resetPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.SAVED_REPORTS)
  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.SAVED_REPORTS, ReportOrderField, SAVED_REPORTS_DEFAULT_ORDER)
  const [filterState, setFilterState] = useState<ReportWhereInput | null>(null)
  const filterFields = useSavedReportFilterFields()
  const quickFilters = useSavedReportQuickFilters()

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

  const handleFilterChange = useCallback(
    (next: ReportWhereInput) => {
      setFilterState(next)
      resetPagination()
    },
    [resetPagination],
  )

  const handleSortChange = (next: SortCondition<ReportOrderField>[]) => {
    setOrderBy(next)
    resetPagination()
  }

  const filters = useMemo(() => (filterState ? whereGenerator<ReportWhereInput>(filterState, mapSavedReportFilterKey) : null), [filterState])
  const hasFilters = Object.keys(filters ?? {}).length > 0

  const { reports, paginationMeta, isPending, isFetching, error } = useGetSavedReports({
    search: debouncedTerm,
    filters,
    orderBy: orderBy.length > 0 ? orderBy : SAVED_REPORTS_DEFAULT_ORDER,
    pagination,
  })

  useQueryErrorNotification({ error, description: 'Failed to load saved reports' })

  const reportIds = useMemo(() => reports.map((report) => report.id), [reports])
  const { authorMaps } = useAuthorMaps(reports.map(savedReportOwnerId))
  const handleEdit = useCallback((report: TSavedReportRef) => router.push(savedReportHref(report.id, { edit: true })), [router])
  const { menuActionsFor, dialogs } = useSavedReportActions({ reportIds, onEdit: handleEdit })

  const columns = useMemo<ColumnDef<TSavedReportNode>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 340,
        minSize: 240,
        cell: ({ row }) => (
          <Link href={savedReportHref(row.original.id)} className="text-blue-500 hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      { id: 'reportOn', accessorKey: 'variables', header: 'Report on', enableSorting: false, size: 130, minSize: 110, cell: ({ row }) => savedReportDataLabel(row.original.variables) },
      { accessorKey: 'reportOwnerID', header: 'Owner', size: 190, minSize: 140, cell: ({ row }) => <SavedReportOwner report={row.original} authorMaps={authorMaps} /> },
      { accessorKey: 'visibility', header: 'Visibility', size: 150, minSize: 130, cell: ({ row }) => <ReportVisibilityLabel visibility={row.original.visibility} /> },
      { accessorKey: 'updatedAt', header: 'Last updated', size: 170, minSize: 140, cell: ({ row }) => <DateCell value={row.original.updatedAt} /> },
      {
        id: 'actions',
        header: '',
        size: 160,
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
    [authorMaps, menuActionsFor],
  )

  const isSearching = getIsSearching(isFetching)

  return (
    <div className="flex flex-col gap-4">
      <PageHeading heading="Saved Reports" />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search reports"
            aria-label="Search reports"
            value={searchText}
            onChange={handleSearchChange}
            variant="searchTable"
          />
          <TableFilter filterFields={filterFields} onFilterChange={handleFilterChange} pageKey={TableKeyEnum.SAVED_REPORTS} quickFilters={quickFilters} />
        </div>
        <Button asChild icon={<Plus size={16} />} iconPosition="left" {...tableActionAnchor(ObjectTypes.REPORT, 'create')}>
          <Link href={CUSTOM_REPORT_HREF}>New report</Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={reports}
        loading={isPending}
        sortFields={SAVED_REPORTS_SORT_FIELDS}
        sorting={orderBy}
        onSortChange={handleSortChange}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.SAVED_REPORTS}
        getRowId={(row) => row.id}
        noResultsText={savedReportsEmptyMessage(debouncedTerm, !!error, hasFilters)}
      />

      {dialogs}
    </div>
  )
}

export default SavedReportsPage
