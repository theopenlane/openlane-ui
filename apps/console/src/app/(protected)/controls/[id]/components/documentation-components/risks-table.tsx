'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getRisksFilterFields } from '@/components/pages/protected/risks/table/table-config'
import { useProgramSelect } from '@/lib/graphql-hooks/programs'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { useDocumentationRisks } from '@/lib/graphql-hooks/documentation'
import { OrderDirection, RiskOrderField } from '@repo/codegen/src/schema'
import type { RiskOrder, RiskWhereInput } from '@repo/codegen/src/schema'
import type { WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { AssociationSection, SearchFilterBar, buildAssociationFilter, getBaseColumns, mergeWhere } from './shared'

type RisksTableProps = {
  controlId: string
  subcontrolIds: string[]
}

const RisksTable: React.FC<RisksTableProps> = ({ controlId, subcontrolIds }) => {
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])
  const columns = useMemo(() => getBaseColumns(), [])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const { programOptions, isSuccess: programsReady } = useProgramSelect({})
  const { enumOptions: riskKindOptions, isSuccess: kindsReady } = useGetCustomTypeEnums({
    where: {
      objectType: 'risk',
      field: 'kind',
    },
  })
  const { enumOptions: riskCategoryOptions, isSuccess: categoriesReady } = useGetCustomTypeEnums({
    where: {
      objectType: 'risk',
      field: 'category',
    },
  })
  const [filterFields, setFilterFields] = useState<ReturnType<typeof getRisksFilterFields>>()

  useEffect(() => {
    if (!programsReady || !kindsReady || !categoriesReady) return
    if (filterFields) return
    setFilterFields(getRisksFilterFields(programOptions, riskKindOptions ?? [], riskCategoryOptions ?? []))
  }, [programsReady, kindsReady, categoriesReady, filterFields, programOptions, riskKindOptions, riskCategoryOptions])

  const where = useMemo(() => {
    const base: RiskWhereInput = {
      nameContainsFold: debouncedSearch,
    }

    const result = whereGenerator<RiskWhereInput>(filters as RiskWhereInput, (key, value) => {
      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as RiskWhereInput
      }
      return { [key]: value } as RiskWhereInput
    })

    return mergeWhere<RiskWhereInput>([associationFilter as RiskWhereInput, base, result])
  }, [filters, debouncedSearch, associationFilter])

  const orderBy = useMemo<RiskOrder[]>(() => [{ field: RiskOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { risks, paginationMeta, isLoading } = useDocumentationRisks({
    where,
    orderBy,
    pagination,
    enabled: true,
  })

  const rows = useMemo(
    () =>
      risks.map((risk) => ({
        id: risk.id,
        name: risk.name,
        updatedAt: risk.updatedAt,
        href: `/risks/${risk.id}`,
      })),
    [risks],
  )

  return (
    <AssociationSection
      title="Risks"
      rows={rows}
      columns={columns}
      loading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={paginationMeta}
      searchBar={
        <SearchFilterBar
          placeholder="Search risks"
          isSearching={search !== debouncedSearch}
          searchValue={search}
          onSearchChange={setSearch}
          filterFields={filterFields ?? undefined}
          onFilterChange={setFilters}
        />
      }
    />
  )
}

export default RisksTable
