'use client'

import { useSearchParams } from 'next/navigation'
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
import { EVIDENCE_SORTABLE_FIELDS } from '@/components/pages/protected/evidence/table/table-config.ts'
import EvidenceTableToolbar from '@/components/pages/protected/evidence/table/evidence-table-toolbar.tsx'
import { useControlEvidenceStore } from '@/components/pages/protected/controls/hooks/useControlEvidenceStore.ts'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'

export const EvidenceTable = () => {
  const searchParams = useSearchParams()
  const { setSelectedControlEvidence } = useControlEvidenceStore()
  const programId = searchParams.get('programId')
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
      ...(programId ? { hasProgramsWith: [{ id: programId }] } : {}),
      nameContainsFold: debouncedSearch,
    }
    return conditions
  }, [filters, programId, debouncedSearch])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { evidences, isLoading: fetching, paginationMeta } = useGetEvidenceList({ where, orderBy: orderByFilter, pagination, enabled: !!filters })
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    collectionProcedure: false,
    source: false,
    creationDate: false,
    renewalDate: false,
    tags: false,
    createdBy: false,
    createdAt: false,
    updatedAt: false,
    description: false,
  })

  const userIds = useMemo(() => {
    if (!evidences) return []
    const ids = new Set<string>()
    evidences.forEach((evidence) => {
      if (evidence.createdBy) ids.add(evidence.createdBy)
      if (evidence.updatedBy) ids.add(evidence.updatedBy)
    })

    return Array.from(ids)
  }, [evidences])

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

  const { columns, mappedColumns } = useMemo(() => getEvidenceColumns({ userMap }), [userMap])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Evidence', href: '/evidence' },
    ])
  }, [setCrumbs])

  const handleRowClick = (rowData: Evidence) => {
    setSelectedControlEvidence(rowData.id)
  }

  return (
    <>
      <EvidenceTableToolbar
        searching={fetching}
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
        sortFields={EVIDENCE_SORTABLE_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={evidences}
        onRowClick={handleRowClick}
        loading={fetching || fetchingUsers}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />
    </>
  )
}
