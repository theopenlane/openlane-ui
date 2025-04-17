'use client'

import React, { useMemo, useState } from 'react'
import { useRisksWithFilter } from '@/lib/graphql-hooks/risks'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeading } from '@repo/ui/page-heading'
import { TableCell, TableRow } from '@repo/ui/table'
import { GetAllRisksQueryVariables, OrderDirection, RiskFieldsFragment, RiskOrder, RiskOrderField } from '@repo/codegen/src/schema'
import RiskDetailsSheet from '@/components/pages/protected/risks/risk-details-sheet'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@uidotdev/usehooks'
import RisksTableToolbar from './table/risks-table-toolbar'
import { Badge } from 'lucide-react'
import { RISKS_SORT_FIELDS } from './table/table-config'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'

const RiskTablePage: React.FC = () => {
  const { replace } = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [orderBy, setOrderBy] = useState<GetAllRisksQueryVariables['orderBy']>([
    {
      field: RiskOrderField.name,
      direction: OrderDirection.DESC,
    },
  ])

  const debouncedSearch = useDebounce(searchQuery, 300)
  const searching = searchQuery !== debouncedSearch

  const where = useMemo(() => {
    return {
      ...filters,
      nameContainsFold: debouncedSearch || undefined,
    }
  }, [filters, debouncedSearch])

  const orderByFilter: RiskOrder[] | undefined = useMemo(() => {
    if (!orderBy) return undefined
    return Array.isArray(orderBy) ? orderBy : [orderBy]
  }, [orderBy])

  const { risks, paginationMeta, isError } = useRisksWithFilter({
    where,
    orderBy: orderByFilter,
    pagination,
  })

  if (isError || !risks) return null

  const columns: ColumnDef<RiskFieldsFragment>[] = [
    { accessorKey: 'displayID', header: 'Risk' },
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const details = row.original.details?.split('\n').slice(0, 3).join('\n')
        const tags = row.original.tags || []
        return (
          <div>
            <p>{details}</p>
            {!!tags.length && (
              <div className="mt-2 border-t border-dotted pt-2 flex flex-wrap gap-2">
                {tags.map((tag: string, index: number) => (
                  <Badge key={index}>{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        )
      },
    },
    { accessorKey: 'riskType', header: 'Type' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'score', header: 'Score' },
    { accessorKey: 'status', header: 'Status' },
  ]

  return (
    <div className="space-y-6">
      <PageHeading heading="Risks" />

      <RisksTableToolbar
        searchTerm={searchQuery}
        setSearchTerm={(val) => {
          setSearchQuery(val)
          setPagination(DEFAULT_PAGINATION)
        }}
        searching={searching}
        onFilterChange={setFilters}
      />

      <DataTable
        sortFields={RISKS_SORT_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={risks}
        onRowClick={(row) => replace(`/risks?id=${row.id}`)}
        loading={!risks && !isError}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        noResultsText="No risks found"
        noDataMarkup={
          <TableRow>
            <TableCell colSpan={columns.length}>
              <div className="text-center text-sm text-muted-foreground">No risks found</div>
            </TableCell>
          </TableRow>
        }
      />

      <RiskDetailsSheet />
    </div>
  )
}

export default RiskTablePage
