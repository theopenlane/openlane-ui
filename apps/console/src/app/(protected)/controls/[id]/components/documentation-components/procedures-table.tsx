'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { useProceduresFilters } from '@/components/pages/protected/procedures/table/table-config'
import { useDocumentationProcedures } from '@/lib/graphql-hooks/documentation'
import { OrderDirection, ProcedureDocumentStatus, ProcedureOrderField } from '@repo/codegen/src/schema'
import type { GetProceduresListQueryVariables, ProcedureWhereInput } from '@repo/codegen/src/schema'
import type { WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { AssociationSection, SearchFilterBar, buildAssociationFilter, getBaseColumns, mergeWhere } from './shared'

type ProceduresTableProps = {
  controlId: string
  subcontrolIds: string[]
}

const ProceduresTable: React.FC<ProceduresTableProps> = ({ controlId, subcontrolIds }) => {
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])
  const columns = useMemo(() => getBaseColumns(), [])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const filterFields = useProceduresFilters()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo(() => {
    const base: ProcedureWhereInput = {
      nameContainsFold: debouncedSearch,
    }

    const result = whereGenerator<ProcedureWhereInput>(filters as ProcedureWhereInput, (key, value) => {
      if (key === 'hasControlsWith') {
        return { hasControlsWith: [{ refCodeContainsFold: value as string }] } as ProcedureWhereInput
      }
      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as ProcedureWhereInput
      }
      if (key === 'hasSubcontrolsWith') {
        return { hasSubcontrolsWith: [{ refCodeContainsFold: value as string }] } as ProcedureWhereInput
      }
      return { [key]: value } as ProcedureWhereInput
    })

    const hasStatusCondition = (obj: ProcedureWhereInput): boolean => {
      if ('status' in obj || 'statusNEQ' in obj || 'statusIn' in obj || 'statusNotIn' in obj) return true
      if (Array.isArray(obj.and) && obj.and.some(hasStatusCondition)) return true
      if (Array.isArray(obj.or) && obj.or.some(hasStatusCondition)) return true
      return false
    }

    if (!hasStatusCondition(result)) {
      result.statusNotIn = [ProcedureDocumentStatus.ARCHIVED]
    }

    return mergeWhere<ProcedureWhereInput>([associationFilter as ProcedureWhereInput, base, result])
  }, [filters, debouncedSearch, associationFilter])

  const orderBy = useMemo<GetProceduresListQueryVariables['orderBy']>(() => [{ field: ProcedureOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { procedures, paginationMeta, isLoading } = useDocumentationProcedures({
    where,
    orderBy,
    pagination,
    enabled: true,
  })

  const rows = useMemo(
    () =>
      procedures.map((procedure) => ({
        id: procedure.id,
        name: procedure.name,
        updatedAt: procedure.updatedAt,
        href: `/procedures/${procedure.id}/view`,
      })),
    [procedures],
  )

  return (
    <AssociationSection
      title="Procedures"
      rows={rows}
      columns={columns}
      loading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={paginationMeta}
      searchBar={
        <SearchFilterBar
          placeholder="Search procedures"
          isSearching={search !== debouncedSearch}
          searchValue={search}
          onSearchChange={setSearch}
          filterFields={filterFields ?? undefined}
          filterKey={TableFilterKeysEnum.CONTROL_DOC_PROCEDURE}
          onFilterChange={setFilters}
        />
      }
    />
  )
}

export default ProceduresTable
