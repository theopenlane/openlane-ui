'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import type { ReviewWhereInput, User } from '@repo/codegen/src/schema'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useReviewsWithFilter, type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { buildAssociationFilter, mergeWhere, SearchFilterBar } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type ReviewsTableProps = {
  controlId?: string
  subcontrolIds: string[]
}

const HIDDEN_COLUMNS: Record<string, boolean> = {
  id: false,
  details: false,
  classification: false,
  environmentName: false,
  scopeName: false,
  externalID: false,
  externalOwnerID: false,
  externalURI: false,
  createdBy: false,
  updatedAt: false,
  updatedBy: false,
}

const getReviewColumns = (userMap: Record<string, User>): ColumnDef<ReviewsNodeNonNull>[] => [
  { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
  { accessorKey: 'title', header: 'Title', size: 200, cell: ({ cell }) => cell.getValue() || '' },
  { accessorKey: 'summary', header: 'Summary', size: 250, cell: ({ cell }) => <div className="truncate max-w-[250px]">{(cell.getValue() as string) || ''}</div> },
  {
    accessorKey: 'state',
    header: 'State',
    size: 120,
    cell: ({ cell }) => {
      const value = cell.getValue() as string
      return <div>{value ? getEnumLabel(value) : '-'}</div>
    },
  },
  { accessorKey: 'approved', header: 'Approved', size: 100, cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} /> },
  { accessorKey: 'reporter', header: 'Reporter', size: 140, cell: ({ cell }) => (cell.getValue() as string) || '-' },
  { accessorKey: 'category', header: 'Category', size: 130, cell: ({ cell }) => (cell.getValue() as string) || '-' },
  {
    accessorKey: 'source',
    header: 'Source',
    size: 120,
    cell: ({ cell }) => {
      const value = cell.getValue() as string
      return <div>{value ? getEnumLabel(value) : '-'}</div>
    },
  },
  { accessorKey: 'classification', header: 'Classification', size: 130, cell: ({ cell }) => (cell.getValue() as string) || '-' },
  { accessorKey: 'details', header: 'Details', size: 200, cell: ({ cell }) => <div className="truncate max-w-[200px]">{(cell.getValue() as string) || ''}</div> },
  { accessorKey: 'reviewedAt', header: 'Reviewed At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
  { accessorKey: 'reportedAt', header: 'Reported At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
  { accessorKey: 'approvedAt', header: 'Approved At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
  { accessorKey: 'environmentName', header: 'Environment', size: 120 },
  { accessorKey: 'scopeName', header: 'Scope', size: 120 },
  { accessorKey: 'externalID', header: 'External ID', size: 150 },
  { accessorKey: 'externalOwnerID', header: 'External Owner', size: 140 },
  { accessorKey: 'externalURI', header: 'External URI', size: 160 },
  { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
  {
    accessorKey: 'createdBy',
    header: 'Created By',
    size: 160,
    cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} />,
  },
  { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" /> },
  {
    accessorKey: 'updatedBy',
    header: 'Updated By',
    size: 160,
    cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} />,
  },
]

const ReviewsTable: React.FC<ReviewsTableProps> = ({ controlId, subcontrolIds }) => {
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

  const columns = useMemo(() => getReviewColumns(userMap), [userMap])

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
      <DataTable columns={columns} data={reviewsNodes} loading={isLoading} pagination={pagination} onPaginationChange={setPagination} paginationMeta={paginationMeta} tableKey={TableKeyEnum.CONTROL_REVIEWS} columnVisibility={HIDDEN_COLUMNS} />
    </div>
  )
}

export default ReviewsTable
