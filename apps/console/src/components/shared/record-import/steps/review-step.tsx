'use client'

import React, { useMemo } from 'react'
import { EyeOff, Pencil } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { RecordPreviewTable } from '@/components/shared/record-preview/record-preview-table'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { pluralizeWithCount } from '@/utils/strings'
import type { TColumnMapping, TParsedDelimitedFile, TSourceColumn } from '../lib/types'
import type { TImportPlan } from '../lib/build-import-file'

const PREVIEW_ROWS = 5

type TReviewStepProps = {
  entityLabelPlural: string
  parsed: TParsedDelimitedFile
  columns: TSourceColumn[]
  mapping: Record<number, TColumnMapping>
  plan: TImportPlan
  onEditMapping: () => void
}

const SummaryCard: React.FC<{ title: string; value: string; hint: string }> = ({ title, value, hint }) => (
  <div className="rounded-lg border bg-card p-4">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="mt-2 text-2xl">{value}</p>
    <p className="mt-1 font-mono text-xs text-muted-foreground">{hint}</p>
  </div>
)

export const ReviewStep: React.FC<TReviewStepProps> = ({ entityLabelPlural, parsed, columns, mapping, plan, onEditMapping }) => {
  const previewRows = useMemo(() => parsed.rows.slice(0, PREVIEW_ROWS).map(plan.buildRow), [parsed, plan])
  const ignoredColumns = useMemo(() => columns.filter((column) => !mapping[column.index]?.field).map((column) => column.header), [columns, mapping])
  const { autoFilledFields } = plan

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title={`${entityLabelPlural} to create`} value={parsed.rows.length.toLocaleString()} hint={`from ${parsed.fileName}`} />
        <SummaryCard title="Fields mapped" value={String(plan.headers.length - autoFilledFields.length)} hint={`of ${pluralizeWithCount(columns.length, 'column')}`} />
        <SummaryCard title="Columns ignored" value={String(ignoredColumns.length)} hint="left out of the import" />
        <SummaryCard
          title="Set automatically"
          value={autoFilledFields.length === 0 ? 'None' : autoFilledFields.map((field) => getEnumLabel(field.autoValue ?? '')).join(', ')}
          hint={autoFilledFields.length === 0 ? 'nothing is added for you' : `${autoFilledFields.map((field) => field.label).join(', ')} on every record`}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <p className="text-sm">
            Preview — first {Math.min(PREVIEW_ROWS, parsed.rows.length)} of {pluralizeWithCount(parsed.rows.length, 'row')}
          </p>
          <Button variant="secondary" icon={<Pencil size={16} />} iconPosition="left" onClick={onEditMapping}>
            Edit mapping
          </Button>
        </div>

        <RecordPreviewTable
          ariaLabel={`Preview of the ${entityLabelPlural.toLowerCase()} that will be created`}
          className="[&_th]:uppercase [&_th]:text-muted-foreground"
          headers={plan.labels}
          rows={previewRows}
          emptyMessage="Nothing will be imported with the current mapping."
          caption={
            ignoredColumns.length > 0 && (
              <span className="flex items-center gap-2">
                <EyeOff size={14} />
                Not imported: {ignoredColumns.join(', ')}
              </span>
            )
          }
        />
      </div>
    </div>
  )
}
