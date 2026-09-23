'use client'

import React, { useMemo } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { RecordPreviewTable } from '@/components/shared/record-preview/record-preview-table'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { downloadFile } from '@/utils/downloadFile'
import type { TDestinationField } from './lib/types'

type TFieldReferencePanelProps = {
  id: string
  entityLabel: string
  isLoading: boolean
  fields: TDestinationField[]
  exampleCsv?: string
  exampleFilename: string
}

const FIELD_REFERENCE_HEADERS = ['Column', 'Field', 'Description', 'Example']

export const FieldReferencePanel: React.FC<TFieldReferencePanelProps> = ({ id, entityLabel, fields, isLoading, exampleCsv, exampleFilename }) => {
  const rows = useMemo(() => fields.map((field) => [field.name, field.label, field.description ?? '', field.example ?? '']), [fields])

  return (
    <section id={id} className="rounded-lg border bg-card" aria-labelledby={`${id}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h3 id={`${id}-heading`} className="text-sm font-medium">
            {entityLabel} field reference
          </h3>
          <p className="text-xs text-muted-foreground">Every column the {entityLabel.toLowerCase()} importer accepts. You do not need to match this layout — map your own columns in the next step.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={16} />}
          iconPosition="left"
          disabled={!exampleCsv}
          onClick={() => exampleCsv && downloadFile([exampleCsv], `${exampleFilename}.csv`, 'text/csv')}
        >
          Download example CSV
        </Button>
      </div>
      {isLoading ? (
        <div role="status" aria-live="polite" aria-label="Loading the field reference" className="p-4">
          <Skeleton height={160} className="w-full rounded-md" />
        </div>
      ) : (
        <RecordPreviewTable
          ariaLabel={`${entityLabel} fields`}
          className="max-h-[420px]"
          headers={FIELD_REFERENCE_HEADERS}
          rows={rows}
          emptyMessage="The field reference could not be loaded. Please try again later."
        />
      )}
    </section>
  )
}
