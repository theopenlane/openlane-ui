'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import type { FindingWhereInput } from '@repo/codegen/src/schema'
import type { User } from '@repo/codegen/src/schema'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useFindingsWithFilter, type FindingsNodeNonNull } from '@/lib/graphql-hooks/finding'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { getColumns } from '@/components/pages/protected/findings/table/columns'
import { buildAssociationFilter, mergeWhere, SearchFilterBar } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { useSmartRouter } from '@/hooks/useSmartRouter'

type FindingsTableProps = {
  controlId?: string
  subcontrolIds: string[]
}

const HIDDEN_COLUMNS: Record<string, boolean> = {
  id: false,
  numericSeverity: false,
  score: false,
  exploitability: false,
  impact: false,
  vector: false,
  open: false,
  production: false,
  validated: false,
  public: false,
  blocksProduction: false,
  externalID: false,
  externalOwnerID: false,
  externalURI: false,
  source: false,
  findingClass: false,
  remediationSLA: false,
  environmentName: false,
  scopeName: false,
  reportedAt: false,
  eventTime: false,
  sourceUpdatedAt: false,
  createdAt: false,
  createdBy: false,
  updatedAt: false,
  updatedBy: false,
  displayID: false,
}

const FindingsTable: React.FC<FindingsTableProps> = ({ controlId, subcontrolIds }) => {
  const { replace } = useSmartRouter()
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo<FindingWhereInput>(() => {
    const base: FindingWhereInput = {}
    if (debouncedSearch) {
      base.displayNameContainsFold = debouncedSearch
    }
    return mergeWhere<FindingWhereInput>([associationFilter as FindingWhereInput, base])
  }, [associationFilter, debouncedSearch])

  const { findingsNodes, data, isLoading, isFetching } = useFindingsWithFilter({
    where,
    pagination,
    enabled: true,
  })

  const memberIds = useMemo(() => [...new Set(findingsNodes.flatMap((f) => [f.createdBy, f.updatedBy]).filter((id): id is string => typeof id === 'string' && id.length > 0))], [findingsNodes])

  const userListWhere = useMemo(() => (memberIds.length > 0 ? { hasUserWith: [{ idIn: memberIds }] } : undefined), [memberIds])
  const { users } = useGetOrgUserList({ where: userListWhere })

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((user) => {
      map[user.id] = user
    })
    return map
  }, [users])

  const columns = useMemo<ColumnDef<FindingsNodeNonNull>[]>(() => {
    const allCols = getColumns({ userMap, selectedItems: [], setSelectedItems: () => {} })
    return allCols
      .filter((col) => 'accessorKey' in col && col.accessorKey !== 'select')
      .map((col) => {
        if ('accessorKey' in col && col.accessorKey === 'displayName') {
          return {
            ...col,
            cell: ({ row }: { row: { original: FindingsNodeNonNull } }) => (
              <button type="button" onClick={() => replace({ findingId: row.original.id })} className="block truncate text-blue-500 hover:underline">
                {row.original.displayName || ''}
              </button>
            ),
          }
        }
        return col
      })
  }, [userMap])

  const paginationMeta = useMemo(
    () => ({
      totalCount: data?.findings?.totalCount ?? 0,
      pageInfo: data?.findings?.pageInfo,
      isLoading: isFetching,
    }),
    [data, isFetching],
  )

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Findings</h3>
      <div className="mb-3">
        <SearchFilterBar placeholder="Search findings" isSearching={search !== debouncedSearch} searchValue={search} onSearchChange={setSearch} filterFields={null} onFilterChange={() => {}} />
      </div>
      <DataTable
        columns={columns}
        data={findingsNodes}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.CONTROL_FINDINGS}
        columnVisibility={HIDDEN_COLUMNS}
      />
    </div>
  )
}

export default FindingsTable
