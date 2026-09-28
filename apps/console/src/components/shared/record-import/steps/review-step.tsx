'use client'

import React, { useMemo } from 'react'
import { CalendarCheck, EyeOff, ListChecks, Pencil } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { RecordPreviewTable } from '@/components/shared/record-preview/record-preview-table'
import { formatList, pluralizeWithCount, toLowerLabel } from '@/utils/strings'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { DATE_ORDER_LABELS } from '@/utils/loose-date'
import type { TColumnMapping, TDestinationField, TImportAutomaticValue, TParsedDelimitedFile, TSourceColumn } from '../lib/types'
import type { TImportPlan } from '../lib/build-mapped-import'

const PREVIEW_ROWS = 5
const REORDER_ROW_LIMIT = 200

const describeConversion = ({ label, rowCount, dateOrder }: TImportPlan['convertedFields'][number]): string =>
  `${label} (${pluralizeWithCount(rowCount, 'row')}${dateOrder ? `, read as ${DATE_ORDER_LABELS[dateOrder]}` : ''})`

type TReviewStepProps = {
  entityLabelPlural: string
  entityLabel: string
  parsed: TParsedDelimitedFile
  rowOrder: number[]
  columns: TSourceColumn[]
  mapping: Record<number, TColumnMapping>
  plan: TImportPlan
  automaticValues?: readonly TImportAutomaticValue[]
  reorderable: boolean
  onMoveRow: (from: number, to: number) => void
  onEditMapping: () => void
}

const autoValueDisplay = (field: TDestinationField): string => field.autoValueLabel ?? getEnumLabel(field.autoValue ?? '')

const SummaryCard: React.FC<{ title: string; value: string; hint: string }> = ({ title, value, hint }) => (
  <div className="rounded-lg border bg-card p-4">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="mt-2 text-2xl">{value}</p>
    <p className="mt-1 font-mono text-xs text-muted-foreground">{hint}</p>
  </div>
)

export const ReviewStep: React.FC<TReviewStepProps> = ({ entityLabel, entityLabelPlural, parsed, rowOrder, columns, mapping, plan, automaticValues = [], reorderable, onMoveRow, onEditMapping }) => {
  const canReorder = reorderable && parsed.rows.length <= REORDER_ROW_LIMIT
  const buildDisplayRow = useMemo(() => {
    const displayByPosition = plan.headers.map((header) => {
      const autoFilled = plan.autoFilledFields.find((field) => field.name === header)
      return autoFilled && autoValueDisplay(autoFilled)
    })
    return (row: string[]) => plan.buildRow(row).map((cell, position) => displayByPosition[position] ?? cell)
  }, [plan])
  const builtRows = useMemo(() => (canReorder ? parsed.rows.map(buildDisplayRow) : null), [canReorder, parsed, buildDisplayRow])
  const previewRows = useMemo(
    () => (builtRows ? rowOrder.map((rowIndex) => builtRows[rowIndex]) : rowOrder.slice(0, PREVIEW_ROWS).map((rowIndex) => buildDisplayRow(parsed.rows[rowIndex]))),
    [builtRows, rowOrder, parsed, buildDisplayRow],
  )
  const reorder = useMemo(() => (canReorder ? { rowIds: rowOrder.map(String), itemLabel: entityLabel, onMoveRow } : undefined), [canReorder, rowOrder, entityLabel, onMoveRow])
  const ignoredColumns = useMemo(() => columns.filter((column) => !mapping[column.index]?.field).map((column) => column.header), [columns, mapping])
  const { autoFilledFields, remappedFields, convertedFields } = plan
  const automatic = [...autoFilledFields.map((field) => ({ label: field.label, value: autoValueDisplay(field) })), ...automaticValues]
  const caption = (ignoredColumns.length > 0 || remappedFields.length > 0 || convertedFields.length > 0) && (
    <span className="flex flex-col gap-1">
      {convertedFields.length > 0 && (
        <span className="flex items-center gap-2">
          <CalendarCheck size={14} />
          Dates converted: {formatList(convertedFields.map(describeConversion))}
        </span>
      )}
      {remappedFields.length > 0 && (
        <span className="flex items-center gap-2">
          <ListChecks size={14} />
          Values remapped: {formatList(remappedFields.map(({ label, count }) => `${label} (${pluralizeWithCount(count, 'value')})`))}
        </span>
      )}
      {ignoredColumns.length > 0 && (
        <span className="flex items-center gap-2">
          <EyeOff size={14} />
          Not imported: {formatList(ignoredColumns)}
        </span>
      )}
    </span>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title={`${entityLabelPlural} to create`} value={parsed.rows.length.toLocaleString()} hint={`from ${parsed.fileName}`} />
        <SummaryCard title="Fields mapped" value={String(plan.headers.length - autoFilledFields.length)} hint={`of ${pluralizeWithCount(columns.length, 'column')}`} />
        <SummaryCard title="Columns ignored" value={String(ignoredColumns.length)} hint="left out of the import" />
        <SummaryCard
          title="Set automatically"
          value={automatic.length === 0 ? 'None' : formatList(automatic.map(({ value }) => value))}
          hint={automatic.length === 0 ? 'nothing is added for you' : `${formatList(automatic.map(({ label }) => label))} on every record`}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <p className="text-sm">
            {canReorder
              ? `Drag to set the order ${toLowerLabel(entityLabelPlural)} appear in — ${pluralizeWithCount(parsed.rows.length, 'row')}`
              : `Preview — first ${Math.min(PREVIEW_ROWS, parsed.rows.length)} of ${pluralizeWithCount(parsed.rows.length, 'row')}`}
            {reorderable && !canReorder && (
              <span className="block text-xs text-muted-foreground">
                Files over {REORDER_ROW_LIMIT} rows cannot be reordered here, so {toLowerLabel(entityLabelPlural)} keep the order of your file.
              </span>
            )}
          </p>
          <Button variant="secondary" icon={<Pencil size={16} />} iconPosition="left" onClick={onEditMapping}>
            Edit mapping
          </Button>
        </div>

        <RecordPreviewTable
          ariaLabel={`Preview of the ${toLowerLabel(entityLabelPlural)} that will be created`}
          className="[&_th]:uppercase [&_th]:text-muted-foreground"
          headers={plan.labels}
          rows={previewRows}
          emptyMessage="Nothing will be imported with the current mapping."
          caption={caption}
          reorder={reorder}
        />
      </div>
    </div>
  )
}
