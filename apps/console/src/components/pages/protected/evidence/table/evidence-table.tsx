'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useMemo, useEffect, useContext } from 'react'
import { Evidence, EvidenceOrderField, EvidenceWhereInput, GetEvidenceListQueryVariables, OrderDirection } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetEvidenceList } from '@/lib/graphql-hooks/evidence.ts'
import { getEvidenceColumns } from '@/components/pages/protected/evidence/table/columns.tsx'
import { EVIDENCE_FILTERABLE_FIELDS } from '@/components/pages/protected/evidence/table/table-config.ts'
import EvidenceTableToolbar from '@/components/pages/protected/evidence/table/evidence-table-toolbar.tsx'

export const EvidenceTable = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<EvidenceWhereInput | null>(null)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [searchTerm, setSearchTerm] = useState('')

  const [orderBy, setOrderBy] = useState<GetEvidenceListQueryVariables['orderBy']>([
    {
      field: EvidenceOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])

  const debouncedSearch = useDebounce(searchTerm, 300)

  const where = useMemo(() => {
    const conditions: EvidenceWhereInput = {
      ...filters,
      hasProgramsWith: [{ id: programId }],
      nameContainsFold: debouncedSearch,
    }

    return conditions
  }, [filters, programId, debouncedSearch])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { evidences, isLoading: fetching, paginationMeta } = useGetEvidenceList({ where, orderBy: orderByFilter, pagination, enabled: !!filters })
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { columns, mappedColumns } = getEvidenceColumns()

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Evidence', href: '/evidence' },
    ])
  }, [setCrumbs])

  const handleCreateNew = async () => {
    router.push(`/policies/create`)
  }

  const handleRowClick = (rowData: Evidence) => {
    router.push(`/evidences/${rowData.id}/view`)
  }

  return (
    <>
      <EvidenceTableToolbar
        searching={fetching}
        handleCreateNew={handleCreateNew}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />

      <DataTable
        sortFields={EVIDENCE_FILTERABLE_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={evidences}
        onRowClick={handleRowClick}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />
    </>
  )
}
