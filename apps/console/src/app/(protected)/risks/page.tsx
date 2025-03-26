'use client'

import React from 'react'
import { useGetAllRisks } from '@/lib/graphql-hooks/risks'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeading } from '@repo/ui/page-heading'
import { TableCell, TableRow } from '@repo/ui/table'
import { RiskFieldsFragment } from '@repo/codegen/src/schema'

const RiskTablePage: React.FC = () => {
  const { data, isError } = useGetAllRisks()

  if (isError || !data) return null

  const risks: RiskFieldsFragment[] = data?.risks?.edges as RiskFieldsFragment[]

  const columns: ColumnDef<RiskFieldsFragment>[] = [
    {
      accessorKey: 'displayID',
      header: 'Risk',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const details = row.original.details?.split('\n').slice(0, 3).join('\n')
        const tags = row.original.tags || []
        return (
          <div>
            <pre className="whitespace-pre-wrap text-sm">{details}</pre>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag, i) => (
                  <span key={i} className="bg-muted text-xs text-muted-foreground px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'riskType',
      header: 'Type',
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'score',
      header: 'Score',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeading heading="Risks" />
      <DataTable
        columns={columns}
        data={risks}
        noResultsText="No risks found"
        noDataMarkup={
          <TableRow>
            <TableCell colSpan={columns.length}>
              <div className="text-center text-sm text-muted-foreground">No risks found</div>
            </TableCell>
          </TableRow>
        }
      />
    </div>
  )
}

export default RiskTablePage
