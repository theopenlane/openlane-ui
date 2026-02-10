'use client'

import { useCallback, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Button } from '@repo/ui/button'
import { Download } from 'lucide-react'
import { exportToCSV } from '@/utils/exportToCSV'
import { useCreateAssessmentResponse } from '@/lib/graphql-hooks/assessments'
import { useNotification } from '@/hooks/useNotification'
import { getDeliveryColumns, type DeliveryRow } from './delivery-columns'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'

type DeliveryTabProps = {
  responses: DeliveryRow[]
  assessmentId: string
}

export const DeliveryTab = ({ responses, assessmentId }: DeliveryTabProps) => {
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const { mutateAsync: createResponse } = useCreateAssessmentResponse()
  const { successNotification, errorNotification } = useNotification()

  const handleResend = useCallback(
    async (row: DeliveryRow) => {
      try {
        await createResponse({
          input: {
            assessmentID: assessmentId,
            email: row.email,
          },
        })
        successNotification({ title: 'Questionnaire resent', description: `Resent to ${row.email}` })
      } catch {
        errorNotification({ title: 'Failed to resend', description: 'Could not resend the questionnaire' })
      }
    },
    [assessmentId, createResponse, successNotification, errorNotification],
  )

  const columns = useMemo(() => getDeliveryColumns(handleResend), [handleResend])

  const handleExport = () => {
    if (!responses.length) return
    exportToCSV(
      responses,
      [
        { label: 'Recipient', accessor: (r) => r.email },
        { label: 'Status', accessor: (r) => r.status },
        { label: 'Sent Date', accessor: (r) => r.assignedAt || '' },
        { label: 'Due Date', accessor: (r) => r.dueDate || '' },
        { label: 'Completed', accessor: (r) => r.completedAt || '' },
        { label: 'Resent', accessor: (r) => r.sendAttempts },
      ],
      'questionnaire_delivery',
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!responses.length}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={responses}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{
          totalCount: responses.length,
          pageInfo: undefined,
          isLoading: false,
        }}
        tableKey={TableKeyEnum.QUESTIONNAIRE_DELIVERY}
      />
    </div>
  )
}
