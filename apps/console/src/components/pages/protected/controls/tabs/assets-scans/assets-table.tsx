'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import type { AssetWhereInput } from '@repo/codegen/src/schema'
import type { User } from '@repo/codegen/src/schema'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useAssetsWithFilter, type AssetsNodeNonNull } from '@/lib/graphql-hooks/asset'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { getColumns } from '@/components/pages/protected/assets/table/columns'
import { SearchFilterBar } from '@/components/shared/crud-base/tabs/shared'
import { useSmartRouter } from '@/hooks/useSmartRouter'

type AssetsTableProps = {
  controlId?: string
}

const HIDDEN_COLUMNS: Record<string, boolean> = {
  id: false,
  name: false,
  accessModelName: false,
  assetDataClassificationName: false,
  assetSubtypeName: false,
  costCenter: false,
  cpe: false,
  createdAt: false,
  createdBy: false,
  criticalityName: false,
  description: false,
  containsPii: false,
  encryptionStatusName: false,
  estimatedMonthlyCost: false,
  identifier: false,
  physicalLocation: false,
  purchaseDate: false,
  region: false,
  securityTierName: false,
  sourceIdentifier: false,
  sourceType: false,
  tags: false,
  updatedBy: false,
  website: false,
}

const AssetsTable: React.FC<AssetsTableProps> = ({ controlId }) => {
  const { replace } = useSmartRouter()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo<AssetWhereInput>(() => {
    const base: AssetWhereInput = {}
    if (controlId) {
      base.hasControlsWith = [{ id: controlId }]
    }
    if (debouncedSearch) {
      base.nameContainsFold = debouncedSearch
    }
    return base
  }, [controlId, debouncedSearch])

  const { assetsNodes, data, isLoading, isFetching } = useAssetsWithFilter({
    where,
    pagination,
    enabled: Boolean(controlId),
  })

  const memberIds = useMemo(() => [...new Set(assetsNodes.flatMap((a) => [a.createdBy, a.updatedBy]).filter((id): id is string => typeof id === 'string' && id.length > 0))], [assetsNodes])

  const userListWhere = useMemo(() => (memberIds.length > 0 ? { hasUserWith: [{ idIn: memberIds }] } : undefined), [memberIds])
  const { users } = useGetOrgUserList({ where: userListWhere })

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((user) => {
      map[user.id] = user
    })
    return map
  }, [users])

  const columns = useMemo<ColumnDef<AssetsNodeNonNull>[]>(() => {
    const allCols = getColumns({ userMap, selectedItems: [], setSelectedItems: () => {} })
    return allCols
      .filter((col) => 'accessorKey' in col && col.accessorKey !== 'select')
      .map((col) => {
        if ('accessorKey' in col && col.accessorKey === 'displayName') {
          return {
            ...col,
            cell: ({ row }: { row: { original: AssetsNodeNonNull } }) => (
              <button type="button" onClick={() => replace({ assetId: row.original.id })} className="block truncate text-blue-500 hover:underline">
                {row.original.displayName || ''}
              </button>
            ),
          }
        }
        return col
      })
  }, [userMap, replace])

  const paginationMeta = useMemo(
    () => ({
      totalCount: data?.assets?.totalCount ?? 0,
      pageInfo: data?.assets?.pageInfo,
      isLoading: isFetching,
    }),
    [data, isFetching],
  )

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Assets</h3>
      <div className="mb-3">
        <SearchFilterBar placeholder="Search assets" isSearching={search !== debouncedSearch} searchValue={search} onSearchChange={setSearch} filterFields={null} onFilterChange={() => {}} />
      </div>
      <DataTable
        columns={columns}
        data={assetsNodes}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.CONTROL_ASSETS}
        columnVisibility={HIDDEN_COLUMNS}
      />
    </div>
  )
}

export default AssetsTable
