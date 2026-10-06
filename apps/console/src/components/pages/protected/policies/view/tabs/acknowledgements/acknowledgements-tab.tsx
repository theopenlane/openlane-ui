'use client'

import { useCallback, useMemo, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { type Row } from '@repo/ui/table-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { usePolicyAcknowledgements } from '@/lib/graphql-hooks/assessment'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useExportAssessmentResponses } from '@/components/pages/protected/questionnaire/utils/use-export-assessment-responses'
import { ACKNOWLEDGEMENT_COLUMNS } from './acknowledgement-columns'
import { AcknowledgementRecipients } from './acknowledgement-recipients'
import { type TAcknowledgementRow, toAcknowledgementRow } from './acknowledgement-row'

type TAcknowledgementsTabProps = {
  policyId: string
  onSendRequest?: () => void
}

const rowId = (row: TAcknowledgementRow) => row.id

export const AcknowledgementsTab = ({ policyId, onSendRequest }: TAcknowledgementsTabProps) => {
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const { acknowledgements, paginationMeta, isPending, error } = usePolicyAcknowledgements({ policyId, pagination })
  const { exportResponses, isExporting } = useExportAssessmentResponses()
  useQueryErrorNotification({ error, description: 'Failed to load acknowledgments' })

  const rows = useMemo(() => acknowledgements.map((acknowledgement) => toAcknowledgementRow(acknowledgement, policyId)), [acknowledgements, policyId])
  const handleExport = useCallback((row: TAcknowledgementRow) => void exportResponses(row.id, row.name), [exportResponses])
  const renderExpandedRow = useCallback(
    (row: Row<TAcknowledgementRow>) => <AcknowledgementRecipients acknowledgement={row.original} onExport={handleExport} isExporting={isExporting(row.original.id)} />,
    [handleExport, isExporting],
  )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium">Assessment responses</h3>
          <p className="text-sm text-muted-foreground">Acknowledgment responses grouped by assessment. Expand an assessment to see its recipients and their responses.</p>
        </div>
        {onSendRequest && (
          <Button type="button" icon={<Send />} iconPosition="left" onClick={onSendRequest}>
            Send acknowledgment request
          </Button>
        )}
      </div>
      <DataTable
        columns={ACKNOWLEDGEMENT_COLUMNS}
        data={rows}
        loading={isPending}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        tableKey={undefined}
        getRowId={rowId}
        renderExpandedRow={renderExpandedRow}
        noResultsText="No acknowledgment requests include this policy yet."
      />
    </section>
  )
}
