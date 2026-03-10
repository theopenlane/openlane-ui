'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useDebounce } from '@uidotdev/usehooks'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ColumnDef } from '@tanstack/react-table'
import type { Risk, RiskTableFieldsFragment, RiskWhereInput, User } from '@repo/codegen/src/schema'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useRisks } from '@/lib/graphql-hooks/risk'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { getRiskColumns } from '@/components/pages/protected/risks/table/columns'
import { buildAssociationFilter, mergeWhere, SearchFilterBar } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'

type RisksTableProps = {
  controlId?: string
  subcontrolIds: string[]
}

const HIDDEN_COLUMNS: Record<string, boolean> = {
  id: false,
  businessCosts: false,
  category: false,
  delegate: false,
  details: false,
  impact: false,
  likelihood: false,
  mitigation: false,
  createdBy: false,
  createdAt: false,
  updatedBy: false,
}

const RisksTable: React.FC<RisksTableProps> = ({ controlId, subcontrolIds }) => {
  const associationFilter = useMemo(() => buildAssociationFilter(controlId, subcontrolIds), [controlId, subcontrolIds])
  const { convertToReadOnly } = usePlateEditor()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const where = useMemo<RiskWhereInput>(() => {
    const base: RiskWhereInput = {}
    if (debouncedSearch) {
      base.nameContainsFold = debouncedSearch
    }
    return mergeWhere<RiskWhereInput>([associationFilter as RiskWhereInput, base])
  }, [associationFilter, debouncedSearch])

  const { risks, paginationMeta, isLoading } = useRisks({
    where,
    pagination,
    enabled: true,
  })

  const memberIds = useMemo(() => [...new Set((risks ?? []).flatMap((r) => [r.createdBy, r.updatedBy]).filter((id): id is string => typeof id === 'string' && id.length > 0))], [risks])

  const userListWhere = useMemo(() => (memberIds.length > 0 ? { hasUserWith: [{ idIn: memberIds }] } : undefined), [memberIds])
  const { users } = useGetOrgUserList({ where: userListWhere })

  const userMap = useMemo(() => {
    const map: Record<string, User> = {}
    users?.forEach((user) => {
      map[user.id] = user as User
    })
    return map
  }, [users])

  const { columns } = useMemo(() => getRiskColumns({ userMap, convertToReadOnly, selectedRisks: [], setSelectedRisks: () => {} }), [userMap, convertToReadOnly])

  const filteredColumns = useMemo<ColumnDef<RiskTableFieldsFragment>[]>(
    () =>
      columns
        .filter((col) => 'accessorKey' in col && col.accessorKey !== 'select')
        .map((col) => {
          if ('accessorKey' in col && col.accessorKey === 'name') {
            return {
              ...col,
              cell: ({ row }: { row: { original: Risk } }) => (
                <Link href={`/exposure/risks/${row.original.id}`} className="block truncate text-blue-500 hover:underline">
                  {row.original.name || ''}
                </Link>
              ),
            }
          }
          return col
        }) as ColumnDef<RiskTableFieldsFragment>[],
    [columns],
  )

  return (
    <div>
      <h3 className="text-base font-semibold mb-2">Risks</h3>
      <div className="mb-3">
        <SearchFilterBar placeholder="Search risks" isSearching={search !== debouncedSearch} searchValue={search} onSearchChange={setSearch} filterFields={null} onFilterChange={() => {}} />
      </div>
      <DataTable
        columns={filteredColumns}
        data={risks ?? []}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={TableKeyEnum.CONTROL_RISKS}
        columnVisibility={HIDDEN_COLUMNS}
      />
    </div>
  )
}

export default RisksTable
