'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { usePoliciesFilters } from '@/components/pages/protected/policies/table/table-config'
import { useDocumentationPolicies } from '@/lib/graphql-hooks/documentation'
import { InternalPolicyDocumentStatus, InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema'
import type { GetInternalPoliciesListQueryVariables, InternalPolicyWhereInput } from '@repo/codegen/src/schema'
import type { WhereCondition } from '@/types'
import type { TPagination } from '@repo/ui/pagination-types'
import { AssociationSection, SearchFilterBar, buildAssociationFilter, getBaseColumns, mergeWhere } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'

type PoliciesTableProps = {
  controlId?: string
  subcontrolIds: string[]
}

const PoliciesTable: React.FC<PoliciesTableProps> = ({ controlId, subcontrolIds }) => {
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])
  const columns = useMemo(() => getBaseColumns(), [])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const filterFields = usePoliciesFilters()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo(() => {
    const base: InternalPolicyWhereInput = {
      nameContainsFold: debouncedSearch,
    }

    const result = whereGenerator<InternalPolicyWhereInput>(filters as InternalPolicyWhereInput, (key, value) => {
      if (key === 'hasControlsWith') {
        return { hasControlsWith: [{ refCodeContainsFold: value as string }] }
      }
      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as InternalPolicyWhereInput
      }
      if (key === 'hasSubcontrolsWith') {
        return { hasSubcontrolsWith: [{ refCodeContainsFold: value as string }] }
      }
      return { [key]: value }
    })

    const hasStatusCondition = (obj: InternalPolicyWhereInput): boolean => {
      if ('status' in obj || 'statusNEQ' in obj || 'statusIn' in obj || 'statusNotIn' in obj) return true
      if (Array.isArray(obj.and) && obj.and.some(hasStatusCondition)) return true
      if (Array.isArray(obj.or) && obj.or.some(hasStatusCondition)) return true
      return false
    }

    if (!hasStatusCondition(result)) {
      result.statusNotIn = [InternalPolicyDocumentStatus.ARCHIVED]
    }

    return mergeWhere<InternalPolicyWhereInput>([associationFilter as InternalPolicyWhereInput, base, result])
  }, [filters, debouncedSearch, associationFilter])

  const orderBy = useMemo<GetInternalPoliciesListQueryVariables['orderBy']>(() => [{ field: InternalPolicyOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { policies, paginationMeta, isLoading } = useDocumentationPolicies({
    where,
    orderBy,
    pagination,
    enabled: true,
  })

  const rows = useMemo(
    () =>
      policies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        updatedAt: policy.updatedAt,
        href: `/policies/${policy.id}/view`,
      })),
    [policies],
  )

  return (
    <AssociationSection
      title="Internal Policies"
      rows={rows}
      columns={columns}
      loading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={paginationMeta}
      searchBar={
        <SearchFilterBar
          placeholder="Search policies"
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

export default PoliciesTable
