'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDocumentationPrograms } from '@/lib/graphql-hooks/documentation'
import { OrderDirection, ProgramOrderField } from '@repo/codegen/src/schema'
import type { ProgramOrder, ProgramWhereInput } from '@repo/codegen/src/schema'
import type { TPagination } from '@repo/ui/pagination-types'
import { AssociationSection, SearchFilterBar, buildAssociationFilter, getBaseColumns, mergeWhere } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'

type ProgramsTableProps = {
  controlId?: string
  subcontrolIds: string[]
}

const ProgramsTable: React.FC<ProgramsTableProps> = ({ controlId, subcontrolIds }) => {
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])
  const columns = useMemo(() => getBaseColumns(), [])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo<ProgramWhereInput>(
    () =>
      mergeWhere<ProgramWhereInput>([
        associationFilter as ProgramWhereInput,
        {
          nameContainsFold: debouncedSearch,
        },
      ]),
    [associationFilter, debouncedSearch],
  )

  const orderBy = useMemo<ProgramOrder[]>(() => [{ field: ProgramOrderField.updated_at, direction: OrderDirection.DESC }], [])

  const { programs, paginationMeta, isLoading } = useDocumentationPrograms({
    where,
    orderBy,
    pagination,
    enabled: true,
  })

  const rows = useMemo(
    () =>
      programs.map((program) => ({
        id: program.id,
        name: program.name,
        updatedAt: program.updatedAt,
        href: `/programs/${program.id}`,
      })),
    [programs],
  )

  return (
    <AssociationSection
      title="Programs"
      rows={rows}
      columns={columns}
      loading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={paginationMeta}
      searchBar={<SearchFilterBar placeholder="Search programs" isSearching={search !== debouncedSearch} searchValue={search} onSearchChange={setSearch} />}
    />
  )
}

export default ProgramsTable
