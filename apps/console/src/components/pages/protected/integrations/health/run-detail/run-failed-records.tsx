import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { RecordPreviewTable } from '@/components/shared/record-preview/record-preview-table'
import { toHumanLabel } from '@/utils/strings'
import { type TRunRecordFailure } from '@/lib/integrations/run-health'

const FAILED_RECORDS_PREVIEW_COUNT = 50

const HEADERS = ['Type', 'Record', 'Reason']

const RunFailedRecords = ({ failures }: { failures: TRunRecordFailure[] }) => {
  if (failures.length === 0) {
    return null
  }

  const shown = failures.slice(0, FAILED_RECORDS_PREVIEW_COUNT)

  return (
    <Card className="flex flex-col gap-3 p-6">
      <div>
        <h3 className="font-medium">Records that were not imported</h3>
        <p className="text-sm text-muted-foreground">
          {failures.length > shown.length
            ? `Showing the first ${shown.length} of ${failures.length} records.`
            : 'Records that failed in this run, and records it left out because they failed in earlier runs. The rest of the run was saved.'}
        </p>
      </div>
      <RecordPreviewTable
        ariaLabel="Records that were not imported"
        headers={HEADERS}
        rows={shown.map((failure) => [toHumanLabel(failure.schema), failure.resource, failure.message || 'No reason recorded'])}
      />
    </Card>
  )
}

export default RunFailedRecords
