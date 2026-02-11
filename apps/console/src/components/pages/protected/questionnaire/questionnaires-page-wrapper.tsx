'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { FileWarning, NotebookPen, Check, Clock2, LayoutTemplate } from 'lucide-react'
import { QuestionnairesTable } from '@/components/pages/protected/questionnaire/table/questionnaire-table'
import { TemplatesTable } from '@/components/pages/protected/template/table/template-table'
import { useAssessments } from '@/lib/graphql-hooks/assessments'
import { AssessmentResponseAssessmentResponseStatus } from '@repo/codegen/src/schema'
import Skeleton from '@/components/shared/skeleton/skeleton'
import type { LucideIcon } from 'lucide-react'

type QuestionnaireTabValue = 'questionnaires' | 'templates'
const DEFAULT_TAB: QuestionnaireTabValue = 'questionnaires'
const TAB_QUERY_PARAM = 'tab'
const VALID_TABS: QuestionnaireTabValue[] = ['questionnaires', 'templates']

const MINIMAL_PAGINATION = { page: 1, pageSize: 1, query: { first: 1 } }

type SummaryCardProps = {
  icon: LucideIcon
  label: string
  count: number
  isLoading: boolean
}

const SummaryCard = ({ icon: Icon, label, count, isLoading }: SummaryCardProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-homepage-card-item border-switch-bg-inactive">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        {isLoading ? <Skeleton className="mt-1 h-8 w-12 rounded" /> : <p className="text-3xl font-semibold">{count}</p>}
      </CardContent>
    </Card>
  )
}

const QuestionnaireSummaryCards = () => {
  const { paginationMeta: totalMeta, isLoading: totalLoading } = useAssessments({
    pagination: MINIMAL_PAGINATION,
  })

  const { paginationMeta: completedMeta, isLoading: completedLoading } = useAssessments({
    where: {
      hasAssessmentResponsesWith: [{ status: AssessmentResponseAssessmentResponseStatus.COMPLETED }],
    },
    pagination: MINIMAL_PAGINATION,
  })

  const { paginationMeta: pendingMeta, isLoading: pendingLoading } = useAssessments({
    where: {
      hasAssessmentResponsesWith: [{ statusIn: [AssessmentResponseAssessmentResponseStatus.NOT_STARTED, AssessmentResponseAssessmentResponseStatus.SENT] }],
    },
    pagination: MINIMAL_PAGINATION,
  })

  const { paginationMeta: overdueMeta, isLoading: overdueLoading } = useAssessments({
    where: {
      hasAssessmentResponsesWith: [{ status: AssessmentResponseAssessmentResponseStatus.OVERDUE }],
    },
    pagination: MINIMAL_PAGINATION,
  })

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard icon={NotebookPen} label="Total" count={totalMeta.totalCount} isLoading={totalLoading} />
      <SummaryCard icon={Check} label="Completed" count={completedMeta.totalCount} isLoading={completedLoading} />
      <SummaryCard icon={Clock2} label="Pending" count={pendingMeta.totalCount} isLoading={pendingLoading} />
      <SummaryCard icon={FileWarning} label="Overdue" count={overdueMeta.totalCount} isLoading={overdueLoading} />
    </div>
  )
}

export const QuestionnairesPageWrapper = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabParamValue = searchParams.get(TAB_QUERY_PARAM)
  const activeTab: QuestionnaireTabValue = tabParamValue && VALID_TABS.includes(tabParamValue as QuestionnaireTabValue) ? (tabParamValue as QuestionnaireTabValue) : DEFAULT_TAB

  const updateTabParam = useCallback(
    (tab: QuestionnaireTabValue) => {
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
    if (VALID_TABS.includes(value as QuestionnaireTabValue)) {
      updateTabParam(value as QuestionnaireTabValue)
    }
  }

  return (
    <>
      <PageHeading heading="Questionnaires" />
      <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline">
        <div className="relative pb-1 mb-1">
          <TabsList className="w-auto flex justify-start">
            <TabsTrigger value="questionnaires" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <NotebookPen className="mr-2 h-4 w-4" />
              <span>Questionnaires</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
          </TabsList>
          <div className="pointer-events-none absolute inset-x-0 bottom-0.5 left-0.5 h-px shadow-[inset_0_-1px_0_0_var(--color-border)]" />
        </div>
        <TabsContent value="questionnaires" className="space-y-6 mt-6">
          <QuestionnaireSummaryCards />
          <QuestionnairesTable />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <TemplatesTable />
        </TabsContent>
      </Tabs>
    </>
  )
}
