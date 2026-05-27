'use client'

import React, { useMemo, useState } from 'react'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type AssessmentResponse, type AssessmentResponseQuery, AssessmentResponseAssessmentResponseStatus, AssessmentResponseOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { useAssessmentResponsesWithFilter, useAssessmentResponse, useCreateAssessmentResponse } from '@/lib/graphql-hooks/assessment-response'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { Badge } from '@repo/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { PanelRightClose } from 'lucide-react'
import { computeDueDate, formatDate } from '@/utils/date'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import CollapsibleSection from '@/components/shared/collapsible-section/collapsible-section'
import AssessmentResponseView, { countAnswered } from '@/components/pages/protected/questionnaire/shared/assessment-response-view'
import { useNotification } from '@/hooks/useNotification'
import ResponseStateCard from './response-state-card'

interface AssessmentsTabProps {
  personnelId: string
  personnelEmail: string
}

type AssessmentResponseRow = Pick<AssessmentResponse, 'id' | 'assessmentID' | 'email' | 'assignedAt' | 'dueDate' | 'completedAt' | 'status'> & {
  assessment?: Pick<AssessmentResponse['assessment'], 'id' | 'name'> | null
}

const statusVariantMap: Record<AssessmentResponseAssessmentResponseStatus, 'green' | 'blue' | 'default' | 'destructive'> = {
  [AssessmentResponseAssessmentResponseStatus.COMPLETED]: 'green',
  [AssessmentResponseAssessmentResponseStatus.SENT]: 'blue',
  [AssessmentResponseAssessmentResponseStatus.OVERDUE]: 'destructive',
  [AssessmentResponseAssessmentResponseStatus.NOT_STARTED]: 'default',
  [AssessmentResponseAssessmentResponseStatus.DRAFT]: 'default',
}

const StatusBadge: React.FC<{ status: AssessmentResponseAssessmentResponseStatus }> = ({ status }) => (
  <Badge variant={statusVariantMap[status] || 'default'} className="shrink-0">
    {getEnumLabel(status)}
  </Badge>
)

const SORT_FIELDS = [{ label: 'Created At', key: AssessmentResponseOrderField.created_at }]

const AssessmentsTab: React.FC<AssessmentsTabProps> = ({ personnelId, personnelEmail }) => {
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.ASSESSMENT_RESPONSE, DEFAULT_PAGINATION))
  const defaultSorting = getInitialSortConditions(TableKeyEnum.ASSESSMENT_RESPONSE, AssessmentResponseOrderField, [
    {
      field: AssessmentResponseOrderField.created_at,
      direction: OrderDirection.DESC,
    },
  ])
  const [orderBy, setOrderBy] = useState(defaultSorting)
  const columnVisibility: VisibilityState = {}
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null)
  const { successNotification, errorNotification } = useNotification()

  const { data, isLoading, AssessmentResponses } = useAssessmentResponsesWithFilter({
    where: {
      or: [{ hasIdentityHolderWith: [{ id: personnelId }] }, { emailEqualFold: personnelEmail }],
    },
    orderBy,
    pagination,
  })

  const { data: responseDetail, isLoading: isDetailLoading } = useAssessmentResponse(selectedResponseId ?? undefined)
  const { mutateAsync: createResponse, isPending: isResending } = useCreateAssessmentResponse()

  const response = responseDetail?.assessmentResponse

  const { answered, total } = useMemo(() => countAnswered(response?.assessment?.jsonconfig, response?.document?.data), [response])

  const handleResend = async () => {
    if (!response) return
    try {
      const dueDate = computeDueDate(response.assessment?.responseDueDuration)
      const recipientEmail = response.email ?? personnelEmail
      await createResponse({
        input: {
          assessmentID: response.assessmentID,
          identityHolderID: personnelId,
          ...(recipientEmail && { email: recipientEmail }),
          ...(dueDate && { dueDate }),
        },
      })
      successNotification({ title: 'Reminder sent', description: recipientEmail ? `Resent to ${recipientEmail}` : 'Assessment reminder resent' })
    } catch {
      errorNotification({ title: 'Failed to send reminder', description: 'Could not resend the assessment' })
    }
  }

  const totalCount = data?.assessmentResponses?.totalCount
  const pageInfo = data?.assessmentResponses?.pageInfo

  const rows: AssessmentResponseRow[] = AssessmentResponses

  const columns: ColumnDef<AssessmentResponseRow>[] = [
    {
      id: 'assessment',
      header: 'Assessment',
      size: 240,
      cell: ({ row }) => <span className="block truncate">{row.original.assessment?.name ?? '-'}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 200,
      cell: ({ row }) => <span className="block truncate">{row.original.email || '-'}</span>,
    },
    {
      accessorKey: 'assignedAt',
      header: 'Assigned',
      size: 140,
      cell: ({ row }) => <DateCell value={row.original.assignedAt} />,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      size: 140,
      cell: ({ row }) => <DateCell value={row.original.dueDate} />,
    },
    {
      accessorKey: 'completedAt',
      header: 'Completed',
      size: 140,
      cell: ({ row }) => <DateCell value={row.original.completedAt} />,
    },
    {
      id: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]

  return (
    <div className="mt-5">
      <DataTable
        columns={columns}
        sortFields={SORT_FIELDS}
        defaultSorting={defaultSorting}
        onSortChange={setOrderBy}
        data={rows}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: totalCount, pageInfo: pageInfo, isLoading: isLoading }}
        columnVisibility={columnVisibility}
        onRowClick={(row) => setSelectedResponseId(row.id)}
        tableKey={TableKeyEnum.ASSESSMENT_RESPONSE}
      />

      <Sheet open={!!selectedResponseId} onOpenChange={(open) => !open && setSelectedResponseId(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="sr-only">Assessment Response</SheetTitle>
            <div className="flex items-center gap-2">
              <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={() => setSelectedResponseId(null)} />
              <span className="text-lg">Assessment Response</span>
            </div>
          </SheetHeader>

          {isDetailLoading ? (
            <div className="p-4 text-muted-foreground">Loading...</div>
          ) : response ? (
            <div className="space-y-4 p-4">
              {response.status === AssessmentResponseAssessmentResponseStatus.COMPLETED ? (
                <>
                  <AssessmentResponseView jsonconfig={response.assessment?.jsonconfig} data={response.document?.data} />
                  <CollapsibleSection label="Metadata" defaultOpen={false}>
                    <ResponseMetadata response={response} />
                  </CollapsibleSection>
                </>
              ) : (
                <>
                  <ResponseMetadata response={response} />
                  <ResponseStateCard status={response.status} answered={answered} total={total} dueDate={response.dueDate} onResend={handleResend} isResending={isResending} />
                </>
              )}
            </div>
          ) : (
            <div className="p-4 text-muted-foreground">No data available</div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

type AssessmentResponseDetail = NonNullable<AssessmentResponseQuery['assessmentResponse']>

const ResponseMetadata: React.FC<{ response: AssessmentResponseDetail }> = ({ response }) => (
  <div className="space-y-2">
    <DetailRow label="Assessment" value={response.assessment?.name} />
    <DetailRow label="Email" value={response.email} />
    <DetailRow label="Status" value={getEnumLabel(response.status)} />
    <DetailRow label="Assigned At" value={formatDate(response.assignedAt)} />
    <DetailRow label="Started At" value={formatDate(response.startedAt)} />
    <DetailRow label="Completed At" value={formatDate(response.completedAt)} />
    <DetailRow label="Due Date" value={formatDate(response.dueDate)} />
    <DetailRow label="Created At" value={formatDate(response.createdAt)} />
    <DetailRow label="Updated At" value={formatDate(response.updatedAt)} />
  </div>
)

const DetailRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-border pb-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm">{value || '-'}</span>
  </div>
)

export default AssessmentsTab
