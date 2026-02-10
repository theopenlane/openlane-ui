'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Users, CheckCircle, Calendar, Send, FileText } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetAssessmentDetail } from '@/lib/graphql-hooks/assessments'
import { formatDate } from '@/utils/date'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { AISummaryCard } from './ai-summary-card'
import { DeliveryTab } from './delivery-tab/delivery-tab'
import { ResponsesTab } from './responses-tab/responses-tab'
import type { DeliveryRow } from './delivery-tab/delivery-columns'
import type { LucideIcon } from 'lucide-react'

type DetailTabValue = 'delivery' | 'responses'
const DEFAULT_TAB: DetailTabValue = 'delivery'
const TAB_QUERY_PARAM = 'tab'
const VALID_TABS: DetailTabValue[] = ['delivery', 'responses']

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
      <PageHeading eyebrow="Questionnaires" heading={assessment.name} />

      <div className="grid grid-cols-3 gap-4 mt-6">
        <StatCard icon={Users} label="Recipients" value={totalRecipients} isLoading={false} />
        <StatCard icon={CheckCircle} label="Responses" value={completedResponses} isLoading={false} />
        <StatCard icon={Calendar} label="Due Date" value={dueDate} isLoading={false} />
      </div>

      <div className="mt-6">
        <AISummaryCard jsonconfig={assessment.jsonconfig} responses={responseRows} />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline" className="mt-6">
        <div className="relative pb-1 mb-1">
          <TabsList className="w-auto flex justify-start">
            <TabsTrigger value="delivery" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <Send className="mr-2 h-4 w-4" />
              <span>Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="responses" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <FileText className="mr-2 h-4 w-4" />
              <span>Responses</span>
            </TabsTrigger>
          </TabsList>
          <div className="pointer-events-none absolute inset-x-0 bottom-0.5 left-0.5 h-px shadow-[inset_0_-1px_0_0_var(--color-border)]" />
        </div>
        <TabsContent value="delivery" className="mt-6">
          <DeliveryTab responses={deliveryRows} assessmentId={id} />
        </TabsContent>
        <TabsContent value="responses" className="mt-6">
          <ResponsesTab responses={responseRows} jsonconfig={assessment.jsonconfig} />
        </TabsContent>
      </Tabs>
    </>
  )
}

export default QuestionnaireDetailPage
