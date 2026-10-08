'use client'

import React, { useMemo, useState } from 'react'
import { CheckCheck, RefreshCw } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { type Option } from '@repo/ui/multiple-selector'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Callout } from '@/components/shared/callout/callout'
import { ImportIssuesCallout } from '@/components/shared/record-import/import-issues-callout'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { pluralizeWithCount } from '@/utils/strings'
import { CREATE_TARGET, isActiveRow, needsReview, SKIP_TARGET, type TResolvedRow } from './subprocessor-import-rows'
import { SubprocessorMatchRow } from './subprocessor-match-row'
import { SubprocessorImportDefaults } from './subprocessor-import-defaults'
import { CustomSubprocessorDetailsDialog } from './custom-subprocessor-details-dialog'
import { type TSubprocessorImportState } from './use-subprocessor-import'

const ROW_FILTERS = ['all', 'review', 'matched', 'new', 'excluded'] as const
type TRowFilter = (typeof ROW_FILTERS)[number]

const ROW_FILTER_LABELS: Record<TRowFilter, string> = {
  all: 'All',
  review: 'Needs review',
  matched: 'Matched',
  new: 'New',
  excluded: 'Not imported',
}

const ROW_FILTER_PREDICATES: Record<TRowFilter, (row: TResolvedRow) => boolean> = {
  all: () => true,
  review: needsReview,
  matched: (row) => row.status === 'matched' || row.status === 'suggested',
  new: (row) => row.status === 'new',
  excluded: (row) => !isActiveRow(row),
}

const isRowFilter = (value: string): value is TRowFilter => (ROW_FILTERS as readonly string[]).includes(value)

const countRows = (rows: TResolvedRow[]): Record<TRowFilter, number> =>
  ROW_FILTERS.reduce<Record<TRowFilter, number>>((counts, key) => ({ ...counts, [key]: rows.filter(ROW_FILTER_PREDICATES[key]).length }), {
    all: 0,
    review: 0,
    matched: 0,
    new: 0,
    excluded: 0,
  })

type TRowSnapshot = { filter: TRowFilter; rowIndexes: ReadonlySet<number> }

const ALL_ROWS: TRowSnapshot = { filter: 'all', rowIndexes: new Set() }

const snapshotRows = (filter: TRowFilter, rows: TResolvedRow[]): TRowSnapshot => ({
  filter,
  rowIndexes: new Set(rows.filter(ROW_FILTER_PREDICATES[filter]).map((row) => row.source.rowIndex)),
})

type TSubprocessorMatchStepProps = {
  state: TSubprocessorImportState
}

export const SubprocessorMatchStep: React.FC<TSubprocessorMatchStepProps> = ({ state }) => {
  const { rows, statusCounts, catalog, categorySelectOptions, canCreateCategory, updateRow, confirmAllSuggestions, blockingIssues, retry, isLoading, isError } = state
  const [snapshot, setSnapshot] = useState<TRowSnapshot>(ALL_ROWS)
  const [editingRow, setEditingRow] = useState<TResolvedRow | null>(null)
  const { filter } = snapshot

  const targetOptions = useMemo<Option[]>(
    () => [
      { value: CREATE_TARGET, label: 'Create as a custom subprocessor' },
      { value: SKIP_TARGET, label: "Don't import this row" },
      ...catalog.map((subprocessor) => ({ value: subprocessor.id, label: subprocessor.name, description: subprocessor.systemOwned ? 'Openlane catalog' : 'Your custom subprocessor' })),
    ],
    [catalog],
  )

  const filterCounts = useMemo(() => countRows(rows), [rows])
  const visibleRows = useMemo(() => (filter === 'all' ? rows : rows.filter((row) => snapshot.rowIndexes.has(row.source.rowIndex))), [rows, filter, snapshot])
  const isSnapshotStale = filter !== 'all' && visibleRows.some((row) => !ROW_FILTER_PREDICATES[filter](row))

  if (isError) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        <p>The subprocessor catalog could not be loaded, so rows cannot be matched.</p>
        <Button variant="secondary" className="mt-4" icon={<RefreshCw size={16} />} iconPosition="left" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" aria-label="Loading the subprocessor catalog" className="flex flex-col gap-3">
        <Skeleton height={72} className="w-full rounded-lg" />
        <Skeleton height={240} className="w-full rounded-lg" />
      </div>
    )
  }

  const summary = [
    `${pluralizeWithCount(statusCounts.matched + statusCounts.suggested, 'row')} matched to existing subprocessors`,
    `${pluralizeWithCount(statusCounts.new, 'new custom subprocessor')}`,
    ...(statusCounts.linked > 0 ? [`${statusCounts.linked} already in your Trust Center`] : []),
    ...(statusCounts.duplicate > 0 ? [`${pluralizeWithCount(statusCounts.duplicate, 'duplicate')}`] : []),
    ...(statusCounts.skipped > 0 ? [`${statusCounts.skipped} skipped`] : []),
  ]

  return (
    <div className="flex flex-col gap-4">
      <Callout variant="simple" title={summary.join(' · ')}>
        Names are matched against Openlane&apos;s subprocessor catalog and your own custom subprocessors. Rows that don&apos;t match are created as custom subprocessors, with a logo from their
        website.
      </Callout>

      <SubprocessorImportDefaults state={state} categoryOptions={categorySelectOptions} />

      {blockingIssues.length > 0 && <ImportIssuesCallout issues={blockingIssues} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Tabs variant="solid" className="max-w-full" value={filter} onValueChange={(value) => isRowFilter(value) && setSnapshot(snapshotRows(value, rows))}>
            <TabsList className="w-fit max-w-full overflow-x-auto">
              {ROW_FILTERS.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {ROW_FILTER_LABELS[key]} ({filterCounts[key]})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {isSnapshotStale && (
            <Button variant="link" className="text-blue-500" onClick={() => setSnapshot(snapshotRows(filter, rows))}>
              Refresh list
            </Button>
          )}
        </div>
        {statusCounts.suggested > 0 && (
          <Button variant="secondary" icon={<CheckCheck size={16} />} iconPosition="left" onClick={confirmAllSuggestions}>
            Confirm {pluralizeWithCount(statusCounts.suggested, 'suggestion')}
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table containerClassName="overflow-x-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Row</TableHead>
              <TableHead>In your file</TableHead>
              <TableHead>Subprocessor</TableHead>
              <TableHead>Countries</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-32">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <SubprocessorMatchRow
                key={row.source.rowIndex}
                row={row}
                targetOptions={targetOptions}
                categoryOptions={categorySelectOptions}
                canCreateCategory={canCreateCategory}
                onChange={updateRow}
                onEditDetails={setEditingRow}
              />
            ))}
          </TableBody>
        </Table>
        {visibleRows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No rows match this filter.</p>}
      </div>

      <CustomSubprocessorDetailsDialog row={editingRow} onOpenChange={(open) => !open && setEditingRow(null)} onSave={(rowIndex, details) => updateRow(rowIndex, { details })} />
    </div>
  )
}
