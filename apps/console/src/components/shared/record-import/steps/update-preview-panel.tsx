'use client'

import React, { useState } from 'react'
import { RotateCw } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Callout } from '@/components/shared/callout/callout'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { formatTruncatedList, pluralizeWithCount, toLowerLabel } from '@/utils/strings'
import { describeRows, toFileRowNumber } from '../lib/validate-mapping'
import type { TUpdatePreviewState } from '../lib/use-update-preview'
import type { TMatchedRow } from '../lib/update-preview'
import type { TDestinationField } from '../lib/types'
import { SummaryCard } from './summary-card'

const CHANGED_ROWS_SHOWN = 25
const SKIPPED_KEYS_SHOWN = 5

type TUpdatePreviewPanelProps = {
  state: TUpdatePreviewState
  entityLabel: string
  entityLabelPlural: string
  lookupField?: TDestinationField
}

const ValueCell: React.FC<{ value?: string; emptyLabel: string; strike?: boolean }> = ({ value, emptyLabel, strike }) => (
  <TableCell compact className="max-w-80 align-top">
    {value ? <span className={strike ? 'break-words text-muted-foreground line-through' : 'break-words'}>{value}</span> : <span className="italic text-muted-foreground">{emptyLabel}</span>}
  </TableCell>
)

const ChangeRows: React.FC<{ target: TMatchedRow; lookupLabel?: string }> = ({ target, lookupLabel }) =>
  target.changes.map((change, changeIndex) => (
    <TableRow compact key={`${target.rowIndex}:${change.label}`}>
      {changeIndex === 0 && (
        <>
          <TableCell compact rowSpan={target.changes.length} className="align-top tabular-nums text-muted-foreground">
            {toFileRowNumber(target.rowIndex)}
          </TableCell>
          <TableCell compact rowSpan={target.changes.length} className="max-w-60 align-top">
            <span className="block break-words">{target.record.label}</span>
            <span className="text-xs text-muted-foreground">Matched by {target.matchedBy === 'id' ? 'ID' : lookupLabel}</span>
          </TableCell>
        </>
      )}
      <TableCell compact className="align-top">
        {change.label}
      </TableCell>
      <ValueCell value={change.current} emptyLabel={change.current === undefined ? 'Not shown' : 'Empty'} strike />
      <ValueCell value={change.formattingOnly ? `${change.next} (formatting changes)` : change.next} emptyLabel="Cleared" />
    </TableRow>
  ))

export const UpdatePreviewPanel: React.FC<TUpdatePreviewPanelProps> = ({ state, entityLabel, entityLabelPlural, lookupField }) => {
  const [showAll, setShowAll] = useState(false)
  const [showAllSkipped, setShowAllSkipped] = useState(false)
  const { preview, isLoading, isError, refetch } = state
  const entityLower = toLowerLabel(entityLabel)
  const entitiesLower = toLowerLabel(entityLabelPlural)

  if (isError) {
    return (
      <Callout
        variant="danger"
        compact
        action={
          <Button variant="secondary" icon={<RotateCw size={16} />} iconPosition="left" onClick={refetch}>
            Retry
          </Button>
        }
      >
        The current {entitiesLower} could not be loaded, so the changes cannot be previewed. Please try again later.
      </Callout>
    )
  }

  if (isLoading || !preview) return <StatusLine>Matching rows to existing {entitiesLower}…</StatusLine>

  const { matched, changed, skipped, duplicateRowIndexes } = preview
  const shownChangedRows = showAll ? changed : changed.slice(0, CHANGED_ROWS_SHOWN)
  const skippedKeys = skipped.map(({ key, reason }) => (reason === 'ambiguous' ? `${key} (matches more than one ${entityLower})` : key))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Will change" value={changed.length.toLocaleString()} hint={`${entitiesLower} with a different value`} />
        <SummaryCard title="No changes detected" value={(matched.length - changed.length).toLocaleString()} hint="already match your file" />
        <SummaryCard title="Skipped" value={skipped.length.toLocaleString()} hint={`rows not matched to a ${entityLower}`} />
      </div>

      {duplicateRowIndexes.length > 0 && (
        <Callout variant="danger" compact>
          In your file, {describeRows(duplicateRowIndexes, duplicateRowIndexes.length)} the same {entityLower} as an earlier row. Remove the repeated rows, or match each row to a different{' '}
          {entityLower}.
        </Callout>
      )}

      {skipped.length > 0 && (
        <Callout variant="warning" compact>
          In your file,{' '}
          {describeRows(
            skipped.map(({ rowIndex }) => rowIndex),
            skipped.length,
          )}{' '}
          no single matching {entityLower} you can access, so {skipped.length === 1 ? 'it is' : 'they are'} skipped:{' '}
          {showAllSkipped ? skippedKeys.join(', ') : formatTruncatedList(skippedKeys, skippedKeys.length, SKIPPED_KEYS_SHOWN)}. {lookupField?.description}
          {skippedKeys.length > SKIPPED_KEYS_SHOWN && (
            <Button variant="link" className="ml-1 text-blue-500" onClick={() => setShowAllSkipped((current) => !current)}>
              {showAllSkipped ? 'Show fewer' : `Show all ${skippedKeys.length.toLocaleString()}`}
            </Button>
          )}
        </Callout>
      )}

      <div className="rounded-lg border bg-card">
        <p className="border-b p-4 text-sm">
          Changes — {pluralizeWithCount(changed.length, entityLower)} {changed.length === 1 ? 'differs' : 'differ'} from your file
          <span className="block text-xs text-muted-foreground">
            Every matched row is sent, including those with no changes. A field whose current value is “Not shown” is not compared, so it is always listed.
          </span>
        </p>
        {changed.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No mapped column differs from the current {entitiesLower}.</p>
        ) : (
          <Table aria-label={`Changes to existing ${entitiesLower}`} className="[&_th]:uppercase [&_th]:text-muted-foreground">
            <TableHeader>
              <TableRow compact>
                <TableHead compact scope="col" className="w-16">
                  Row
                </TableHead>
                <TableHead compact scope="col">
                  {entityLabel}
                </TableHead>
                <TableHead compact scope="col">
                  Field
                </TableHead>
                <TableHead compact scope="col">
                  Current
                </TableHead>
                <TableHead compact scope="col">
                  New
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shownChangedRows.map((target) => (
                <ChangeRows key={target.rowIndex} target={target} lookupLabel={lookupField?.label} />
              ))}
            </TableBody>
          </Table>
        )}
        {changed.length > CHANGED_ROWS_SHOWN && (
          <div className="border-t p-3 text-center">
            <Button variant="link" className="text-blue-500" onClick={() => setShowAll((current) => !current)}>
              {showAll ? `Show the first ${CHANGED_ROWS_SHOWN} rows` : `Show all ${changed.length.toLocaleString()} changed rows`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
