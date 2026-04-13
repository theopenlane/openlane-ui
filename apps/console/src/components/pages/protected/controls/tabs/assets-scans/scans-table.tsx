'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import type { ScanWhereInput } from '@repo/codegen/src/schema'
import type { User } from '@repo/codegen/src/schema'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useScansWithFilter, type ScansNodeNonNull } from '@/lib/graphql-hooks/scan'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { getColumns } from '@/components/pages/protected/scans/table/columns'
import { SearchFilterBar } from '@/components/shared/crud-base/tabs/shared'
import { useSmartRouter } from '@/hooks/useSmartRouter'

type ScansTableProps = {
  controlId?: string
}

const HIDDEN_COLUMNS: Record<string, boolean> = {
  id: false,
  scanSchedule: false,
  environmentName: false,
  scopeName: false,
  assignedTo: false,
  performedBy: false,
  reviewedBy: false,
  createdAt: false,
  createdBy: false,
  updatedAt: false,
  updatedBy: false,
}

const ScansTable: React.FC<ScansTableProps> = ({ controlId }) => {
  const { replace } = useSmartRouter()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo<ScanWhereInput>(() => {
    const base: ScanWhereInput = {}
    if (controlId) {
      base.hasControlsWith = [{ id: controlId }]
    }
    if (debouncedSearch) {
      base.targetContainsFold = debouncedSearch
    }
    return base
  }, [controlId, debouncedSearch])

  const { scansNodes, data, isLoading, isFetching } = useScansWithFilter({
    where,
    pagination,
    enabled: Boolean(controlId),
  })

  const memberIds = useMemo(() => [...new Set(scansNodes.flatMap((s) => [s.createdBy, s.updatedBy]).filter((id): id is string => typeof id === 'string' && id.length > 0))], [scansNodes])

  const userListWhere = useMemo(() => (memberIds.length > 0 ? { hasUserWith: [{ idIn: memberIds }] } : undefined), [memberIds])
  const { users } = useGetOrgUserList({ where: userListWhere })

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((user) => {
      map[user.id] = user
    })
    return map
  }, [users])

  const columns = useMemo<ColumnDef<ScansNodeNonNull>[]>(() => {
    const allCols = getColumns({ userMap, selectedItems: [], setSelectedItems: () => {} })
    return allCols
      .filter((col) => 'accessorKey' in col && col.accessorKey !== 'select')
      .map((col) => {
        if ('accessorKey' in col && col.accessorKey === 'target') {
          return {
            ...col,
            cell: ({ row }: { row: { original: ScansNodeNonNull } }) => (
              <button type="button" onClick={() => replace({ scanId: row.original.id })} className="block truncate text-blue-500 hover:underline">
                {row.original.target || ''}
              </button>
            ),
          }
        }
        return col
      })
  }, [userMap, replace])

  const paginationMeta = useMemo(
    () => ({
      totalCount: data?.scans?.totalCount ?? 0,
      pageInfo: data?.scans?.pageInfo,
      isLoading: isFetching,
    }),
    [data, isFetching],
  )

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Scans</h3>
      <div className="mb-3">
        <SearchFilterBar placeholder="Search scans" isSearching={search !== debouncedSearch} searchValue={search} onSearchChange={setSearch} filterFields={null} onFilterChange={() => {}} />
      </div>
      <DataTable
        columns={columns}
        data={scansNodes}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.CONTROL_SCANS}
        columnVisibility={HIDDEN_COLUMNS}
      />
    </div>
  )
}

export default ScansTable
