'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Users, CheckCircle, Calendar, Send, FileText, Download } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetAssessmentDetail } from '@/lib/graphql-hooks/assessments'
import { formatDate } from '@/utils/date'
import { exportToCSV } from '@/utils/exportToCSV'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import { FilterIcons, QuestionnaireFilterIconName } from '@/components/shared/enum-mapper/questionnaire-enum'
import { AssessmentResponseAssessmentResponseStatus } from '@repo/codegen/src/schema'
import type { FilterField, WhereCondition } from '@/types'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { AISummaryCard } from './ai-summary-card'
import { DeliveryTab } from './delivery-tab/delivery-tab'
import { ResponsesTab } from './responses-tab/responses-tab'
import { extractQuestions } from './responses-tab/extract-questions'
import type { DeliveryRow } from './delivery-tab/delivery-columns'
import type { LucideIcon } from 'lucide-react'
import { SendQuestionnaireDialog } from './dialog/send-questionnaire-dialog'
import { renderAnswer } from './utils/render-answer'

type DetailTabValue = 'delivery' | 'responses'
const DEFAULT_TAB: DetailTabValue = 'delivery'
const TAB_QUERY_PARAM = 'tab'
const VALID_TABS: DetailTabValue[] = ['delivery', 'responses']

const deliveryFilterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'multiselect',
    icon: FilterIcons[QuestionnaireFilterIconName.Status],
    options: [
      { value: AssessmentResponseAssessmentResponseStatus.COMPLETED, label: 'Completed' },
      { value: AssessmentResponseAssessmentResponseStatus.SENT, label: 'Sent' },
      { value: AssessmentResponseAssessmentResponseStatus.NOT_STARTED, label: 'Not Started' },
      { value: AssessmentResponseAssessmentResponseStatus.OVERDUE, label: 'Overdue' },
    ],
  },
  {
    key: 'assignedAt',
    label: 'Sent Date',
    type: 'dateRange',
    icon: FilterIcons[QuestionnaireFilterIconName.SentDate],
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    type: 'dateRange',
    icon: FilterIcons[QuestionnaireFilterIconName.DueDate],
  },
]

const applyDeliveryFilters = (rows: DeliveryRow[], where: WhereCondition): DeliveryRow[] => {
  if (!where || !('and' in where)) return rows
  const conditions = (where as { and: WhereCondition[] }).and
  if (!conditions?.length) return rows

  return rows.filter((row) => {
    return conditions.every((condition) => {
      const entries = Object.entries(condition as Record<string, unknown>)
      if (!entries.length) return true

      return entries.every(([key, value]) => {
        if (key === 'status' && Array.isArray(value)) {
          return value.includes(row.status)
        }
        if (key === 'assignedAtGTE' && typeof value === 'string') {
          return row.assignedAt && new Date(row.assignedAt) >= new Date(value)
        }
        if (key === 'assignedAtLT' && typeof value === 'string') {
          return row.assignedAt && new Date(row.assignedAt) < new Date(value)
        }
        if (key === 'dueDateGTE' && typeof value === 'string') {
          return row.dueDate && new Date(row.dueDate) >= new Date(value)
        }
        if (key === 'dueDateLT' && typeof value === 'string') {
          return row.dueDate && new Date(row.dueDate) < new Date(value)
        }
        return true
      })
    })
  })
}

type StatCardProps = {
  icon: LucideIcon
  label: string
  value: string | number
  isLoading: boolean
}

const StatCard = ({ icon: Icon, label, value, isLoading }: StatCardProps) => (
  <Card>
    <CardContent className="flex flex-col p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-homepage-card-item border-switch-bg-inactive">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      {isLoading ? <Skeleton className="mt-1 h-8 w-12 rounded" /> : <p className="text-3xl font-semibold">{value}</p>}
    </CardContent>
  </Card>
)

const QuestionnaireDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setCrumbs } = React.useContext(BreadcrumbContext)
  const { assessment, responses, totalRecipients, completedResponses, isLoading } = useGetAssessmentDetail(id)
  const [deliveryFilters, setDeliveryFilters] = useState<WhereCondition>({})
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)

  const tabParamValue = searchParams.get(TAB_QUERY_PARAM)
  const activeTab: DetailTabValue = tabParamValue && VALID_TABS.includes(tabParamValue as DetailTabValue) ? (tabParamValue as DetailTabValue) : DEFAULT_TAB

  const updateTabParam = useCallback(
    (tab: DetailTabValue) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      if (tab === DEFAULT_TAB) {
        nextParams.delete(TAB_QUERY_PARAM)
      } else {
        nextParams.set(TAB_QUERY_PARAM, tab)
      }
      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams],
  )

  const handleTabChange = (value: string) => {
    if (VALID_TABS.includes(value as DetailTabValue)) {
      updateTabParam(value as DetailTabValue)
    }
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/questionnaires' },
      { label: assessment?.name, isLoading },
    ])
  }, [setCrumbs, assessment?.name, isLoading])

  const dueDate = useMemo(() => {
    if (!responses?.length) return '-'
    const firstDueDate = responses.find((r) => r?.dueDate)?.dueDate
    if (firstDueDate) return formatDate(firstDueDate)
    return '-'
  }, [responses])

  const deliveryRows: DeliveryRow[] = useMemo(
    () =>
      (responses ?? []).filter(Boolean).map((r) => ({
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
    [responses],
  )

  const responseRows = useMemo(
    () =>
      (responses ?? []).filter(Boolean).map((r) => ({
        id: r!.id,
        email: r!.email,
        completedAt: r!.completedAt,
        document: r!.document,
      })),
    [responses],
  )

  const filteredDeliveryRows = useMemo(() => applyDeliveryFilters(deliveryRows, deliveryFilters), [deliveryRows, deliveryFilters])

  const handleExportDelivery = useCallback(() => {
    if (!deliveryRows.length) return
    exportToCSV(
      deliveryRows,
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
  }, [deliveryRows])

  const handleExportResponses = useCallback(() => {
    if (!responseRows.length) return
    const questions = extractQuestions(assessment?.jsonconfig)
    if (!questions.length) return
    const columns = [
      { label: 'Respondent', accessor: (r: (typeof responseRows)[0]) => r.email },
      { label: 'Completed', accessor: (r: (typeof responseRows)[0]) => r.completedAt || '' },
      ...questions.map((q) => ({
        label: q.title,
        accessor: (r: (typeof responseRows)[0]) => {
          const data = (r.document?.data || {}) as Record<string, unknown>
          return renderAnswer(data[q.name])
        },
      })),
    ]
    exportToCSV(responseRows, columns, 'questionnaire_responses')
  }, [responseRows, assessment?.jsonconfig])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="rounded-lg" height={32} width={300} />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="rounded-lg" height={120} />
          <Skeleton className="rounded-lg" height={120} />
          <Skeleton className="rounded-lg" height={120} />
        </div>
        <Skeleton className="rounded-lg" height={200} />
        <Skeleton className="rounded-lg" height={400} />
      </div>
    )
  }

  if (!assessment) {
    return <div className="p-4 text-red-500">Questionnaire not found</div>
  }

  return (
    <>
      <PageHeading
        eyebrow="Questionnaires"
        heading={assessment.name}
        actions={
          <Button type="button" icon={<Send />} iconPosition="left" onClick={() => setIsSendDialogOpen(true)}>
            Send
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mt-6">
        <StatCard icon={Users} label="Recipients" value={totalRecipients} isLoading={false} />
        <StatCard icon={CheckCircle} label="Responses" value={completedResponses} isLoading={false} />
        <StatCard icon={Calendar} label="Due Date" value={dueDate} isLoading={false} />
      </div>

      <div className="mt-6">
        <AISummaryCard jsonconfig={assessment.jsonconfig} responses={responseRows} />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <div className="flex items-center justify-between pb-1 mb-1">
          <TabsList className="w-fit flex justify-start">
            <TabsTrigger value="delivery" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <Send className="mr-2 h-4 w-4" />
              <span>Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="responses" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <FileText className="mr-2 h-4 w-4" />
              <span>Responses</span>
            </TabsTrigger>
          </TabsList>
          {activeTab === 'delivery' && (
            <div className="flex items-center gap-2">
              <TableFilter filterFields={deliveryFilterFields} onFilterChange={setDeliveryFilters} pageKey={TableFilterKeysEnum.QUESTIONNAIRE_DELIVERY} />
              <Button variant="secondary" onClick={handleExportDelivery} disabled={!deliveryRows.length}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          )}
          {activeTab === 'responses' && (
            <Button variant="secondary" onClick={handleExportResponses} disabled={!responseRows.length}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
        <TabsContent value="delivery" className="mt-6">
          <DeliveryTab responses={filteredDeliveryRows} assessmentId={id} jsonconfig={assessment.jsonconfig} />
        </TabsContent>
        <TabsContent value="responses" className="mt-6">
          <ResponsesTab responses={responseRows} jsonconfig={assessment.jsonconfig} />
        </TabsContent>
      </Tabs>

      <SendQuestionnaireDialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen} assessmentId={id} assessmentName={assessment?.name} />
    </>
  )
}

export default QuestionnaireDetailPage
