'use client'

import React from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type ColumnDef, type Row } from '@repo/ui/table-types'
import { ExpandAllRowsButton, ExpandRowButton } from '@/components/shared/crud-base/columns/expand-row-button'
import { pluralizeWithCount } from '@/utils/strings'
import { RiskScoringQuestionsTable } from './risk-scoring-questions-table'
import { formatScoreValue, type TRiskScoringCategory } from './risk-scoring-utils'

type TRiskScoringCategoryTableProps = {
  categories: TRiskScoringCategory[]
}

const categoryRowId = (row: TRiskScoringCategory) => row.category

const renderExpandedRow = (row: Row<TRiskScoringCategory>) => <RiskScoringQuestionsTable category={row.original} />

const COLUMNS: ColumnDef<TRiskScoringCategory>[] = [
  {
    id: 'expand',
    header: ({ table }) => <ExpandAllRowsButton table={table} label="category answers" />,
    size: 80,
    minSize: 80,
    maxSize: 80,
    cell: ({ row }) => <ExpandRowButton row={row} label={`${row.original.label} answers`} />,
  },
  {
    accessorKey: 'label',
    header: 'Category',
    minSize: 240,
    cell: ({ row }) => (
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span>{row.original.label}</span>
        <span className="text-xs text-muted-foreground">{pluralizeWithCount(row.original.answeredCount, 'answer')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'score',
    header: 'Score',
    size: 90,
    minSize: 90,
    cell: ({ row }) => <span className="tabular-nums">{formatScoreValue(row.original.score)}</span>,
  },
]

export const RiskScoringCategoryTable: React.FC<TRiskScoringCategoryTableProps> = ({ categories }) => (
  <DataTable columns={COLUMNS} data={categories} tableKey={undefined} getRowId={categoryRowId} renderExpandedRow={renderExpandedRow} noResultsText="No answers yet." />
)
