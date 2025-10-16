'use client'

import React, { useMemo, useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { getRiskColumns } from '@/components/pages/protected/risks/table/columns.tsx'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination.ts'
import { GetAllRisksQueryVariables, OrderDirection, RiskTableFieldsFragment, RiskWhereInput, RiskOrderField, ExportExportType, ExportExportFormat } from '@repo/codegen/src/schema.ts'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { useTableRisks } from '@/lib/graphql-hooks/risks.ts'
import { PageHeading } from '@repo/ui/page-heading'
import RisksTableToolbar from '@/components/pages/protected/risks/table/risks-table-toolbar.tsx'
import { DataTable } from '@repo/ui/data-table'
import { RISKS_SORT_FIELDS } from '@/components/pages/protected/risks/table/table-config.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import { canEdit } from '@/lib/authz/utils.ts'
import useFileExport from '@/components/shared/export/use-file-export.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const RiskTable: React.FC = () => {
  const router = useRouter()
  const { convertToReadOnly } = usePlateEditor()

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<RiskWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [selectedRisks, setSelectedRisks] = useState<{ id: string }[]>([])
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { data: permission } = useOrganizationRoles()
  const { handleExport } = useFileExport()
  const [orderBy, setOrderBy] = useState<GetAllRisksQueryVariables['orderBy']>([
    {
      field: RiskOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    businessCosts: false,
    details: false,
    impact: false,
    likelihood: false,
    mitigation: false,
    updatedAt: false,
    updatedBy: false,
    createdAt: false,
    createdBy: false,
    delegate: false,
  })

  const debouncedSearch = useDebounce(searchQuery, 300)
  const searching = searchQuery !== debouncedSearch

  const where = useMemo(() => {
    return {
      ...filters,
      nameContainsFold: debouncedSearch || undefined,
    }
  }, [filters, debouncedSearch])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { risks, paginationMeta, isError } = useTableRisks({
    where,
    orderBy: orderByFilter,
    pagination,
    enabled: !!filters,
  })

  const userIds = useMemo(() => {
    if (!risks) return []
    const ids = new Set<string>()
    risks.forEach((task) => {
      if (task.createdBy) ids.add(task.createdBy)
      if (task.updatedBy) ids.add(task.updatedBy)
    })
    return Array.from(ids)
  }, [risks])

  const { users, isFetching: fetchingUsers } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[0]> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const { columns, mappedColumns } = useMemo(() => getRiskColumns({ userMap, convertToReadOnly, selectedRisks, setSelectedRisks }), [userMap, convertToReadOnly, selectedRisks])

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles),
      }))
    }
  }, [permission?.roles])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Risks', href: '/risks' },
    ])
  }, [setCrumbs])

  const handleRowClick = (rowData: RiskTableFieldsFragment) => {
    router.push(`/risks/${rowData.id}`)
  }

  const handleCreateNew = async () => {
    router.push(`/risks/create`)
  }

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleExportFile = () => {
    if (!risks || risks.length === 0) {
      return
    }

    handleExport({
      exportType: ExportExportType.RISK,
      filters: JSON.stringify(filters),
      fields: columns.filter(isVisibleColumn).map((item) => item.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  const handleBulkEdit = () => {
    setSelectedRisks([])
  }

  return (
    <>
      <PageHeading heading="Risks" />

      <RisksTableToolbar
        handleCreateNew={handleCreateNew}
        searchTerm={searchQuery}
        setSearchTerm={(val) => {
          setSearchQuery(val)
          setPagination(DEFAULT_PAGINATION)
        }}
        searching={searching}
        onFilterChange={setFilters}
        handleExport={handleExportFile}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        mappedColumns={mappedColumns}
        exportEnabled={risks && risks.length > 0}
        handleBulkEdit={handleBulkEdit}
        selectedRisks={selectedRisks}
        setSelectedRisks={setSelectedRisks}
        canEdit={canEdit}
        permission={permission}
      />
      <DataTable
        sortFields={RISKS_SORT_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={risks || []}
        onRowClick={handleRowClick}
        loading={fetchingUsers || (!risks && !isError)}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        stickyHeader
      />
    </>
  )
}

export default RiskTable
