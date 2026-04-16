'use client'

import React, { useState } from 'react'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type AssessmentResponse, AssessmentResponseOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { useAssessmentResponsesWithFilter, useAssessmentResponse } from '@/lib/graphql-hooks/assessment-response'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { Badge } from '@repo/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { formatDate } from '@/utils/date'

interface AssessmentsTabProps {
  personnelId: string
  personnelEmail: string
}

type AssessmentResponseRow = Pick<AssessmentResponse, 'id' | 'assessmentID' | 'email' | 'assignedAt' | 'dueDate' | 'completedAt' | 'createdAt' | 'isDraft' | 'startedAt'>

const getStatusBadge = (row: AssessmentResponseRow) => {
  if (row.completedAt) {
    return (
      <Badge variant="green" className="shrink-0">
        Completed
      </Badge>
    )
  }
  if (row.isDraft) {
    return <Badge variant="outline">Draft</Badge>
  }
  if (row.startedAt) {
    return (
      <Badge variant="blue" className="shrink-0">
        In Progress
      </Badge>
    )
  }
  return <Badge variant="outline">Pending</Badge>
}

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

  const { data, isLoading, AssessmentResponses } = useAssessmentResponsesWithFilter({
    where: {
      or: [{ hasIdentityHolderWith: [{ id: personnelId }] }, { emailEqualFold: personnelEmail }],
    },
    orderBy,
    pagination,
  })

  const { data: responseDetail, isLoading: isDetailLoading } = useAssessmentResponse(selectedResponseId ?? undefined)

  const totalCount = data?.assessmentResponses?.totalCount
  const pageInfo = data?.assessmentResponses?.pageInfo

  const columns: ColumnDef<AssessmentResponseRow>[] = [
    {
      accessorKey: 'assessmentID',
      header: 'Assessment ID',
      size: 200,
      cell: ({ row }) => <span className="block truncate font-mono text-xs">{row.original.assessmentID}</span>,
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
      cell: ({ row }) => getStatusBadge(row.original),
    },
  ]

  return (
    <div className="mt-5">
      <DataTable
        columns={columns}
        sortFields={SORT_FIELDS}
        defaultSorting={defaultSorting}
        onSortChange={setOrderBy}
        data={AssessmentResponses as AssessmentResponseRow[]}
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
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>Assessment Response</SheetTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedResponseId(null)}>
              <X size={16} />
            </Button>
          </SheetHeader>

          {isDetailLoading ? (
            <div className="p-4 text-muted-foreground">Loading...</div>
          ) : responseDetail?.assessmentResponse ? (
            <div className="space-y-4 p-4">
              <DetailRow label="Assessment ID" value={responseDetail.assessmentResponse.assessmentID} />
              <DetailRow label="Email" value={responseDetail.assessmentResponse.email} />
              <DetailRow
                label="Status"
                value={
                  responseDetail.assessmentResponse.completedAt
                    ? 'Completed'
                    : responseDetail.assessmentResponse.isDraft
                      ? 'Draft'
                      : responseDetail.assessmentResponse.startedAt
                        ? 'In Progress'
                        : 'Pending'
                }
              />
              <DetailRow label="Assigned At" value={formatDate(responseDetail.assessmentResponse.assignedAt)} />
              <DetailRow label="Started At" value={formatDate(responseDetail.assessmentResponse.startedAt)} />
              <DetailRow label="Completed At" value={formatDate(responseDetail.assessmentResponse.completedAt)} />
              <DetailRow label="Due Date" value={formatDate(responseDetail.assessmentResponse.dueDate)} />
              <DetailRow label="Created At" value={formatDate(responseDetail.assessmentResponse.createdAt)} />
              <DetailRow label="Updated At" value={formatDate(responseDetail.assessmentResponse.updatedAt)} />
            </div>
          ) : (
            <div className="p-4 text-muted-foreground">No data available</div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

const DetailRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-border pb-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm">{value || '-'}</span>
  </div>
)

export default AssessmentsTab
