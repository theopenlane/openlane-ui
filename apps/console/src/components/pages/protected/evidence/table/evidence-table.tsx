'use client'

import { useSearchParams } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import React, { useState, useMemo, useEffect, use } from 'react'
import { type Evidence, type EvidenceOrder, EvidenceOrderField, type EvidenceWhereInput, OrderDirection } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { type VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetEvidenceList } from '@/lib/graphql-hooks/evidence.ts'
import { useGetEvidenceColumns } from '@/components/pages/protected/evidence/table/columns.tsx'
import { EVIDENCE_SORTABLE_FIELDS } from '@/components/pages/protected/evidence/table/table-config.ts'
import EvidenceTableToolbar from '@/components/pages/protected/evidence/table/evidence-table-toolbar.tsx'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useNotification } from '@/hooks/useNotification'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useStorageSearch } from '@/hooks/useStorageSearch'
import { canEdit } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export const EvidenceTable = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')
  const [pagination, setPagination] = useOrgTablePagination(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<EvidenceWhereInput>({})
  const { setCrumbs } = use(BreadcrumbContext)
  const [searchTerm, setSearchTerm] = useStorageSearch(ObjectTypes.EVIDENCE)
  const { replace } = useSmartRouter()
  const { errorNotification } = useNotification()
  const [selectedEvidence, setSelectedEvidence] = useState<{ id: string }[]>([])
  const { data: permission } = useOrganizationRoles()

  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.EVIDENCE, EvidenceOrderField, [
    {
      field: EvidenceOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])

  const debouncedSearch = useDebounce(searchTerm, 300)

  const where = useMemo(() => {
    const result = whereGenerator<EvidenceWhereInput>(filters, (key, value) => {
      if (key === 'satisfiesFramework' && Array.isArray(value) && value.length > 0) {
        return {
          or: [{ hasControlsWith: [{ standardIDIn: value }] }, { hasSubcontrolsWith: [{ hasControlWith: [{ standardIDIn: value }] }] }],
        }
      }

      const nextWhere: EvidenceWhereInput = {}
      Object.assign(nextWhere, { [key]: value })
      return nextWhere
    })

    return {
      ...result,
      ...(programId ? { hasProgramsWith: [{ id: programId }] } : {}),
      ...(debouncedSearch
        ? {
            and: [...(result.and || []), { or: [{ nameContainsFold: debouncedSearch }, { descriptionContainsFold: debouncedSearch }] }],
          }
        : {}),
    }
  }, [filters, programId, debouncedSearch])

  const orderByFilter = useMemo<EvidenceOrder | EvidenceOrder[] | undefined>(() => {
    if (!orderBy || orderBy.length === 0) return undefined
    return orderBy
  }, [orderBy])

  const { evidences, isError, isLoading: fetching, paginationMeta } = useGetEvidenceList({ where, orderBy: orderByFilter, pagination, enabled: true })
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
    isAutomated: false,
    externalUUID: false,
    environmentName: false,
    scopeName: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.EVIDENCE, defaultVisibility))

  const userIds = useMemo(() => {
    if (!evidences) return []
    const ids = new Set<string>()
    evidences.forEach((evidence) => {
      if (evidence.createdBy) ids.add(evidence.createdBy)
      if (evidence.updatedBy) ids.add(evidence.updatedBy)
    })

    return Array.from(ids)
  }, [evidences])

  const { userMap, tokenMap, isLoading: fetchingUsers } = useAuthorMaps(userIds)

  const { columns, mappedColumns } = useGetEvidenceColumns({ userMap, tokenMap, selectedEvidence, setSelectedEvidence })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
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
        sorting={orderBy}
        columns={columns}
        data={evidences}
        onRowClick={handleRowClick}
        loading={fetching || fetchingUsers}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.EVIDENCE}
      />
    </>
  )
}
