'use client'

import { useSearchParams } from 'next/navigation'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import React, { useState, useMemo, useEffect, useContext } from 'react'
import { Evidence, EvidenceOrderField, EvidenceWhereInput, GetEvidenceListQueryVariables, OrderDirection } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetEvidenceList } from '@/lib/graphql-hooks/evidence.ts'
import { useGetEvidenceColumns } from '@/components/pages/protected/evidence/table/columns.tsx'
import { EVIDENCE_SORTABLE_FIELDS } from '@/components/pages/protected/evidence/table/table-config.ts'
import EvidenceTableToolbar from '@/components/pages/protected/evidence/table/evidence-table-toolbar.tsx'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useNotification } from '@/hooks/useNotification'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SearchKeyEnum, useStorageSearch } from '@/hooks/useStorageSearch'
import { canEdit } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'

export const EvidenceTable = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.EVIDENCE, DEFAULT_PAGINATION))
  const [filters, setFilters] = useState<EvidenceWhereInput | null>(null)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [searchTerm, setSearchTerm] = useStorageSearch(SearchKeyEnum.EVIDENCE)
  const { replace } = useSmartRouter()
  const { errorNotification } = useNotification()
  const [selectedEvidence, setSelectedEvidence] = useState<{ id: string }[]>([])
  const { data: permission } = useOrganizationRoles()

  const defaultSorting = getInitialSortConditions(TableKeyEnum.EVIDENCE, EvidenceOrderField, [
    {
      field: EvidenceOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<GetEvidenceListQueryVariables['orderBy']>(defaultSorting)

  const debouncedSearch = useDebounce(searchTerm, 300)

  const where = useMemo(() => {
    if (!filters) {
      return {
        ...(programId ? { hasProgramsWith: [{ id: programId }] } : {}),
        ...(debouncedSearch ? { nameContainsFold: debouncedSearch } : {}),
      }
    }

    const result = whereGenerator<EvidenceWhereInput>(filters, (key, value) => {
      if (key === 'satisfiesFramework' && Array.isArray(value) && value.length > 0) {
        return {
          or: [{ hasControlsWith: [{ standardIDIn: value }] }, { hasSubcontrolsWith: [{ hasControlWith: [{ standardIDIn: value }] }] }],
        }
      }

      return { [key]: value } as EvidenceWhereInput
    })

    const conditions: EvidenceWhereInput = {
      ...result,
      ...(programId ? { hasProgramsWith: [{ id: programId }] } : {}),
      ...(debouncedSearch ? { nameContainsFold: debouncedSearch } : {}),
    }

    return conditions
  }, [filters, programId, debouncedSearch])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { evidences, isError, isLoading: fetching, paginationMeta } = useGetEvidenceList({ where, orderBy: orderByFilter, pagination, enabled: !!filters })
  const defaultVisibility: VisibilityState = {
    id: false,
    collectionProcedure: false,
    source: false,
    creationDate: false,
    renewalDate: false,
    tags: false,
    createdBy: false,
    createdAt: false,
    updatedAt: false,
    description: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.EVIDENCE, defaultVisibility))

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

  const { columns, mappedColumns } = useGetEvidenceColumns({ userMap, selectedEvidence, setSelectedEvidence })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Evidence', href: '/evidence' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load evidence',
      })
    }
  }, [isError, errorNotification])

  const handleRowClick = (rowData: Evidence) => {
    replace({ id: rowData.id })
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
        selectedEvidence={selectedEvidence}
        setSelectedEvidence={setSelectedEvidence}
        canEdit={canEdit}
        permission={permission}
      />

      <DataTable
        sortFields={EVIDENCE_SORTABLE_FIELDS}
        onSortChange={setOrderBy}
        defaultSorting={defaultSorting}
        columns={columns}
        data={evidences}
        onRowClick={handleRowClick}
        loading={fetching || fetchingUsers}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.EVIDENCE}
      />
    </>
  )
}
