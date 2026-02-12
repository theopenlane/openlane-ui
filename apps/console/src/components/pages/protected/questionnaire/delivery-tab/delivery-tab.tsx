'use client'

import { useCallback, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useCreateAssessmentResponse } from '@/lib/graphql-hooks/assessments'
import { useNotification } from '@/hooks/useNotification'
import { getDeliveryColumns, type DeliveryRow } from './delivery-columns'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@repo/ui/alert-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { extractQuestions } from '../responses-tab/extract-questions'
import { renderAnswer } from '../utils/render-answer'

type DeliveryTabProps = {
  responses: DeliveryRow[]
  assessmentId: string
  jsonconfig: unknown
}

export const DeliveryTab = ({ responses, assessmentId, jsonconfig }: DeliveryTabProps) => {
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const { mutateAsync: createResponse } = useCreateAssessmentResponse()
  const { successNotification, errorNotification } = useNotification()
  const [selectedResponse, setSelectedResponse] = useState<DeliveryRow | null>(null)

  const questions = useMemo(() => extractQuestions(jsonconfig), [jsonconfig])

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

  const handleViewResponse = useCallback((row: DeliveryRow) => {
    setSelectedResponse(row)
  }, [])

  const columns = useMemo(() => getDeliveryColumns({ onResend: handleResend, onViewResponse: handleViewResponse }), [handleResend, handleViewResponse])

  const responseData = useMemo(() => {
    if (!selectedResponse?.document?.data || !questions.length) return []
    const data = selectedResponse.document.data as Record<string, unknown>
    return questions.map((q) => ({
      question: q.title,
      answer: renderAnswer(data[q.name]),
    }))
  }, [selectedResponse, questions])

  return (
    <>
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

      <AlertDialog open={!!selectedResponse} onOpenChange={(open) => !open && setSelectedResponse(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Response from {selectedResponse?.email}</AlertDialogTitle>
            <AlertDialogDescription>Answers submitted by this recipient.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            {responseData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No answers found.</p>
            ) : (
              responseData.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-sm font-medium">{item.question}</p>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <CancelButton />
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
