'use client'

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useGetAssessmentDetail } from '@/lib/graphql-hooks/assessment'
import { useCreateAssessmentResponse, useDeleteAssessmentResponse } from '@/lib/graphql-hooks/assessment-response'
import { useNotification } from '@/hooks/useNotification'
import { getDeliveryColumns, type DeliveryRow } from './delivery-columns'
import type { TPagination } from '@repo/ui/pagination-types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@repo/ui/dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import AssessmentResponseView from '../shared/assessment-response-view'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import type { AssessmentResponseWhereInput } from '@repo/codegen/src/schema'
import { computeDueDate } from '@/utils/date'

type DeliveryTabProps = {
  assessmentId: string
  jsonconfig: unknown
  where?: AssessmentResponseWhereInput
  enabled?: boolean
  onTotalCountChange?: (count: number) => void
  responseDueDuration?: number | null
  canSend?: boolean
  canDelete?: boolean
}

type PaginationAction = { type: 'set'; value: TPagination } | { type: 'reset-to-first-page' }

const paginationReducer = (state: TPagination, action: PaginationAction): TPagination => {
  switch (action.type) {
    case 'set':
      return action.value
    case 'reset-to-first-page':
      return {
        ...state,
        page: 1,
        query: {
          first: state.pageSize,
        },
      }
    default:
      return state
  }
}

export const DeliveryTab = ({ assessmentId, jsonconfig, where, enabled = true, onTotalCountChange, responseDueDuration, canSend = false, canDelete = false }: DeliveryTabProps) => {
  const [pagination, dispatchPagination] = useReducer(paginationReducer, DEFAULT_PAGINATION)
  const { mutateAsync: createResponse } = useCreateAssessmentResponse()
  const { mutateAsync: deleteResponse } = useDeleteAssessmentResponse()
  const { successNotification, errorNotification } = useNotification()
  const [selectedResponse, setSelectedResponse] = useState<DeliveryRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeliveryRow | null>(null)
  const {
    responses: deliveryResponses,
    paginationMeta,
    isLoading,
  } = useGetAssessmentDetail({
    id: assessmentId,
    where,
    pagination,
    enabled,
  })

  const responses = useMemo(
    () =>
      (deliveryResponses ?? [])
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
        .map((r) => ({
          id: r.id,
          email: r.email || r.displayName || '',
          assignedAt: r.assignedAt,
          dueDate: r.dueDate,
          status: r.status,
          sendAttempts: r.sendAttempts,
          emailDeliveredAt: r.emailDeliveredAt,
          completedAt: r.completedAt,
          document: r.document,
        })),
    [deliveryResponses],
  )

  useEffect(() => {
    dispatchPagination({ type: 'reset-to-first-page' })
  }, [where])

  useEffect(() => {
    onTotalCountChange?.(paginationMeta.totalCount ?? 0)
  }, [onTotalCountChange, paginationMeta.totalCount])

  const handleResend = useCallback(
    async (row: DeliveryRow) => {
      try {
        const dueDate = computeDueDate(responseDueDuration)
        await createResponse({
          input: {
            assessmentID: assessmentId,
            email: row.email,
            ...(dueDate && { dueDate }),
          },
        })
        successNotification({ title: 'Questionnaire resent', description: `Resent to ${row.email}` })
      } catch (error) {
        errorNotification({ title: 'Failed to resend', description: parseErrorMessage(error) })
      }
    },
    [assessmentId, responseDueDuration, createResponse, successNotification, errorNotification],
  )

  const handleViewResponse = useCallback((row: DeliveryRow) => {
    setSelectedResponse(row)
  }, [])

  const handleDelete = useCallback((row: DeliveryRow) => {
    setDeleteTarget(row)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return
    }
    try {
      await deleteResponse({ deleteAssessmentResponseId: deleteTarget.id })
      successNotification({ title: 'Recipient deleted', description: `${deleteTarget.email || 'The recipient'} was removed from this questionnaire` })
      setDeleteTarget(null)
      if (responses.length === 1 && pagination.page > 1) {
        dispatchPagination({ type: 'reset-to-first-page' })
      }
    } catch (error) {
      errorNotification({ title: 'Failed to delete recipient', description: parseErrorMessage(error) })
    }
  }, [deleteTarget, deleteResponse, responses.length, pagination.page, successNotification, errorNotification])

  const handlePaginationChange = useCallback((nextPagination: TPagination) => {
    dispatchPagination({ type: 'set', value: nextPagination })
  }, [])

  const columns = useMemo(
    () => getDeliveryColumns({ onResend: handleResend, onViewResponse: handleViewResponse, onDelete: handleDelete, canResend: canSend, canDelete }),
    [handleResend, handleViewResponse, handleDelete, canSend, canDelete],
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={responses}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
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
          <div className="py-2">
            <AssessmentResponseView jsonconfig={jsonconfig} data={selectedResponse?.document?.data} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <CancelButton title="Close" />
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete recipient"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{deleteTarget?.email || 'this recipient'}</b> and any answers they submitted for this questionnaire.
          </>
        }
      />
    </>
  )
}
