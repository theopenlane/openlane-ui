'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useCreateAssessmentResponse, useGetAssessmentDetail } from '@/lib/graphql-hooks/assessments'
import { useNotification } from '@/hooks/useNotification'
import { getDeliveryColumns, type DeliveryRow } from './delivery-columns'
import type { TPagination } from '@repo/ui/pagination-types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@repo/ui/dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { extractQuestions } from '../responses-tab/extract-questions'
import { renderAnswer } from '../utils/render-answer'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import type { AssessmentResponseWhereInput } from '@repo/codegen/src/schema'

type DeliveryTabProps = {
  assessmentId: string
  jsonconfig: unknown
  where?: AssessmentResponseWhereInput
  onRowsChange?: (rows: DeliveryRow[]) => void
}

export const DeliveryTab = ({ assessmentId, jsonconfig, where, onRowsChange }: DeliveryTabProps) => {
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const { mutateAsync: createResponse } = useCreateAssessmentResponse()
  const { successNotification, errorNotification } = useNotification()
  const [selectedResponse, setSelectedResponse] = useState<DeliveryRow | null>(null)
  const {
    responses: deliveryResponses,
    paginationMeta,
    isLoading,
  } = useGetAssessmentDetail({
    id: assessmentId,
    where,
    pagination,
  })

  const questions = useMemo(() => extractQuestions(jsonconfig), [jsonconfig])
  const responses = useMemo(
    () =>
      (deliveryResponses ?? []).filter(Boolean).map((r) => ({
        id: r!.id,
        email: r!.email,
        assignedAt: r!.assignedAt,
        dueDate: r!.dueDate,
        status: r!.status,
        sendAttempts: r!.sendAttempts,
        emailDeliveredAt: r!.emailDeliveredAt,
        completedAt: r!.completedAt,
        document: r!.document,
      })),
    [deliveryResponses],
  )

  useEffect(() => {
    setPagination((previousPagination) => ({
      ...previousPagination,
      page: 1,
      query: {
        first: previousPagination.pageSize,
      },
    }))
  }, [where])

  useEffect(() => {
    onRowsChange?.(responses)
  }, [onRowsChange, responses])

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
        paginationMeta={paginationMeta}
        loading={isLoading}
        tableKey={TableKeyEnum.QUESTIONNAIRE_DELIVERY}
      />

      <Dialog open={!!selectedResponse} onOpenChange={(open) => !open && setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Response from {selectedResponse?.email}</DialogTitle>
            <DialogDescription>Answers submitted by this recipient.</DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <DialogClose asChild>
              <CancelButton title="Close" />
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
