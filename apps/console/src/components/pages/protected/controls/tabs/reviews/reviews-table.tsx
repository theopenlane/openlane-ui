'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import type { ReviewWhereInput, User } from '@repo/codegen/src/schema'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useReviewsWithFilter, type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { getColumns } from '@/components/pages/protected/reviews/table/columns'
import { buildAssociationFilter, mergeWhere, SearchFilterBar } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { useSmartRouter } from '@/hooks/useSmartRouter'

type ReviewsTableProps = {
  controlId?: string
  subcontrolIds: string[]
}

const HIDDEN_COLUMNS: Record<string, boolean> = {
  id: false,
  classification: false,
  environmentName: false,
  scopeName: false,
  externalID: false,
  externalOwnerID: false,
  externalURI: false,
  systemOwned: false,
  createdBy: false,
  updatedAt: false,
  updatedBy: false,
  tags: false,
  category: false,
  source: false,
  approved: false,
  approvedAt: false,
}

const COLUMN_ORDER = ['title', 'summary', 'state', 'reporter', 'reportedAt', 'reviewedAt']

const ReviewsTable: React.FC<ReviewsTableProps> = ({ controlId, subcontrolIds }) => {
  const { replace } = useSmartRouter()
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo<ReviewWhereInput>(() => {
    const base: ReviewWhereInput = {}
    if (debouncedSearch) {
      base.titleContainsFold = debouncedSearch
    }
    return mergeWhere<ReviewWhereInput>([associationFilter as ReviewWhereInput, base])
  }, [associationFilter, debouncedSearch])

  const { reviewsNodes, data, isLoading, isFetching } = useReviewsWithFilter({
    where,
    pagination,
    enabled: true,
  })

  const memberIds = useMemo(() => [...new Set(reviewsNodes.flatMap((r) => [r.createdBy, r.updatedBy]).filter((id): id is string => typeof id === 'string' && id.length > 0))], [reviewsNodes])

  const userListWhere = useMemo(() => (memberIds.length > 0 ? { hasUserWith: [{ idIn: memberIds }] } : undefined), [memberIds])
  const { users } = useGetOrgUserList({ where: userListWhere })

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((user) => {
      map[user.id] = user
    })
    return map
  }, [users])

  const columns = useMemo<ColumnDef<ReviewsNodeNonNull>[]>(() => {
    const allCols = getColumns({ userMap, selectedItems: [], setSelectedItems: () => {} })
    return allCols
      .filter((col) => 'accessorKey' in col && col.accessorKey !== 'select')
      .sort((a, b) => {
        const aKey = 'accessorKey' in a ? String(a.accessorKey) : ''
        const bKey = 'accessorKey' in b ? String(b.accessorKey) : ''
        const aIndex = COLUMN_ORDER.indexOf(aKey)
        const bIndex = COLUMN_ORDER.indexOf(bKey)
        return (aIndex === -1 ? COLUMN_ORDER.length : aIndex) - (bIndex === -1 ? COLUMN_ORDER.length : bIndex)
      })
      .map((col) => {
        if ('accessorKey' in col && col.accessorKey === 'title') {
          return {
            ...col,
            cell: ({ row }: { row: { original: ReviewsNodeNonNull } }) => (
              <button type="button" onClick={() => replace({ reviewId: row.original.id })} className="line-clamp-3 text-blue-500 hover:underline">
                {row.original.title || ''}
              </button>
            ),
          }
        }
        return col
      })
  }, [userMap, replace])

  const paginationMeta = useMemo(
    () => ({
      totalCount: data?.reviews?.totalCount ?? 0,
      pageInfo: data?.reviews?.pageInfo,
      isLoading: isFetching,
    }),
    [data, isFetching],
  )

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Reviews</h3>
      <div className="mb-3">
        <SearchFilterBar placeholder="Search reviews" isSearching={search !== debouncedSearch} searchValue={search} onSearchChange={setSearch} filterFields={null} onFilterChange={() => {}} />
      </div>
      <DataTable
        columns={columns}
        data={reviewsNodes}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.CONTROL_REVIEWS}
        columnVisibility={HIDDEN_COLUMNS}
      />
    </div>
  )
}

export default ReviewsTable
