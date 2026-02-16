'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Users, CheckCircle, Calendar, Send, FileText, Download } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useAssessmentRecipientsTotalCount, useAssessmentResponsesTotalCount, useGetAssessmentDetail } from '@/lib/graphql-hooks/assessment'
import { formatDate } from '@/utils/date'
import { exportToCSV } from '@/utils/exportToCSV'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { FilterIcons, QuestionnaireFilterIconName } from '@/components/shared/enum-mapper/questionnaire-enum'
import { AssessmentResponseAssessmentResponseStatus } from '@repo/codegen/src/schema'
import type { AssessmentResponseWhereInput, GetAssessmentDetailQuery, GetAssessmentDetailQueryVariables } from '@repo/codegen/src/schema'
import type { FilterField, WhereCondition } from '@/types'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { AISummaryCard } from './ai-summary-card'
import { DeliveryTab } from './delivery-tab/delivery-tab'
import { ResponsesTab } from './responses-tab/responses-tab'
import { extractQuestions } from './responses-tab/extract-questions'
import type { LucideIcon } from 'lucide-react'
import { SendQuestionnaireDialog } from './dialog/send-questionnaire-dialog'
import { renderAnswer } from './utils/render-answer'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ASSESSMENT_DETAIL } from '@repo/codegen/query/assessment'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'

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
    options: enumToOptions(AssessmentResponseAssessmentResponseStatus),
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
  const { client } = useGraphQLClient()
  const { errorNotification } = useNotification()
  const { assessment, responses, isLoading } = useGetAssessmentDetail({ id })
  const [deliveryFilters, setDeliveryFilters] = useState<WhereCondition>({})
  const [deliveryTotalCount, setDeliveryTotalCount] = useState(0)
  const [isExportingDelivery, setIsExportingDelivery] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)

  const deliveryWhereFilter = useMemo(
    () =>
      whereGenerator<AssessmentResponseWhereInput>(deliveryFilters as AssessmentResponseWhereInput, (key, value) => {
        if (key === 'status') {
          return Array.isArray(value)
            ? ({
                statusIn: value as AssessmentResponseAssessmentResponseStatus[],
              } as AssessmentResponseWhereInput)
            : ({
                status: value as AssessmentResponseAssessmentResponseStatus,
              } as AssessmentResponseWhereInput)
        }

        return { [key]: value } as AssessmentResponseWhereInput
      }),
    [deliveryFilters],
  )

  const { totalCount: totalRecipients, isLoading: isRecipientsCountLoading } = useAssessmentRecipientsTotalCount(id)
  const { totalCount: completedResponses, isLoading: isResponsesCountLoading } = useAssessmentResponsesTotalCount(id)

  const handleDeliveryFilterChange = useCallback((whereCondition: WhereCondition) => {
    setDeliveryFilters(whereCondition)
  }, [])

  const handleDeliveryTotalCountChange = useCallback((count: number) => {
    setDeliveryTotalCount(count)
  }, [])

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

  const fetchAllDeliveryRows = useCallback(async () => {
    const rows: Array<{
      email: string
      status: AssessmentResponseAssessmentResponseStatus
      assignedAt: string
      dueDate?: string | null
      completedAt?: string | null
      sendAttempts: number
    }> = []
    let after: string | null | undefined
    const pageSize = 100
    const visitedCursors = new Set<string>()

    while (true) {
      const response = await client.request<GetAssessmentDetailQuery, GetAssessmentDetailQueryVariables>(GET_ASSESSMENT_DETAIL, {
        getAssessmentId: id,
        where: deliveryWhereFilter,
        first: pageSize,
        after,
      })

      const connection = response.assessment?.assessmentResponses
      const nodes = (connection?.edges ?? []).map((edge) => edge?.node).filter(Boolean)

      rows.push(
        ...nodes.map((node) => ({
          email: node!.email,
          status: node!.status,
          assignedAt: node!.assignedAt,
          dueDate: node!.dueDate,
          completedAt: node!.completedAt,
          sendAttempts: node!.sendAttempts,
        })),
      )

      if (!connection?.pageInfo?.hasNextPage || !connection.pageInfo.endCursor) {
        break
      }

      if (visitedCursors.has(connection.pageInfo.endCursor)) {
        break
      }
      visitedCursors.add(connection.pageInfo.endCursor)
      after = connection.pageInfo.endCursor
    }

    return rows
  }, [client, id, deliveryWhereFilter])

  const handleExportDelivery = useCallback(async () => {
    if (!deliveryTotalCount) return
    setIsExportingDelivery(true)
    try {
      const allRows = await fetchAllDeliveryRows()
      if (!allRows.length) return
      exportToCSV(
        allRows,
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
    } catch {
      errorNotification({
        title: 'Export failed',
        description: 'Could not export delivery records.',
      })
    } finally {
      setIsExportingDelivery(false)
    }
  }, [deliveryTotalCount, fetchAllDeliveryRows, errorNotification])

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
        <StatCard icon={Users} label="Recipients" value={totalRecipients} isLoading={isRecipientsCountLoading} />
        <StatCard icon={CheckCircle} label="Responses" value={completedResponses} isLoading={isResponsesCountLoading} />
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
              <TableFilter filterFields={deliveryFilterFields} onFilterChange={handleDeliveryFilterChange} pageKey={TableKeyEnum.QUESTIONNAIRE_DELIVERY} />
              <Button variant="secondary" onClick={handleExportDelivery} disabled={isExportingDelivery || !deliveryTotalCount}>
                <Download className="mr-2 h-4 w-4" />
                {isExportingDelivery ? 'Exporting...' : 'Export'}
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
          <DeliveryTab assessmentId={id} jsonconfig={assessment.jsonconfig} where={deliveryWhereFilter} onTotalCountChange={handleDeliveryTotalCountChange} />
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
