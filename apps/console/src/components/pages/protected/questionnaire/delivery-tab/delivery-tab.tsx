'use client'

import { useCallback, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
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

  return (
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
  )
}
