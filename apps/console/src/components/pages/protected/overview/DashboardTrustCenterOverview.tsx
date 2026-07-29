import { FileSignature, ListChecks, PenTool, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { STATS_WINDOW_DAYS } from '@/constants/stats'
import { useGetOverdueTasksCount } from '@/lib/graphql-hooks/task'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { ndaRequestsWhere, useGetNdaRequestCount } from '@/lib/graphql-hooks/trust-center-nda-request'
import { useAnalytics } from '@/lib/query-hooks/analytics'
import { NDA_REQUEST_TAB_PARAM, NDA_SIGNED_TAB } from '@/components/pages/protected/trust-center/NDAs/table/nda-request-tabs'
import DashboardOverviewCard, { type TDashboardOverviewStat } from './DashboardOverviewCard'
import { useOpenOverdueTasks } from './use-open-overdue-tasks'

const DashboardTrustCenterOverview = () => {
  const router = useRouter()
  const { trustCenter } = useGetTrustCenter()

  const { totalCount: ndaRequestsNeedingApproval, isLoading: isLoadingNdaRequests } = useGetNdaRequestCount({ where: ndaRequestsWhere.needingApproval() })
  const { totalCount: signedNdaCount, isLoading: isLoadingSignedNdas } = useGetNdaRequestCount({ where: ndaRequestsWhere.signedWithinWindow() })
  const { totalCount: taskOverdueCount, isLoading: isLoadingTasks } = useGetOverdueTasksCount()
  const { data: visitorData, isLoading: isLoadingVisitors } = useAnalytics(trustCenter?.pirschDomainID)
  const openOverdueTasks = useOpenOverdueTasks()

  const requiredAttentionCount = ndaRequestsNeedingApproval + taskOverdueCount

  const stats: TDashboardOverviewStat[] = [
    {
      key: 'nda-requests',
      label: 'NDA Requests',
      subtitle: 'Requiring Approval',
      value: ndaRequestsNeedingApproval,
      isLoading: isLoadingNdaRequests,
      Icon: PenTool,
      accent: 'warning',
      onClick: () => router.push('/trust-center/NDAs'),
    },
    {
      key: 'tasks',
      label: 'Tasks',
      subtitle: 'Overdue',
      value: taskOverdueCount,
      isLoading: isLoadingTasks,
      Icon: ListChecks,
      accent: 'info',
      onClick: openOverdueTasks,
    },
    {
      key: 'visitors',
      label: 'Visitors',
      subtitle: `Unique (last ${STATS_WINDOW_DAYS} days)`,
      value: visitorData?.visitors ?? null,
      isLoading: isLoadingVisitors,
      Icon: Users,
      accent: 'success',
      onClick: () => router.push('/trust-center/analytics'),
    },
    {
      key: 'signed-ndas',
      label: 'Signed NDAs',
      subtitle: `Last ${STATS_WINDOW_DAYS} days`,
      value: signedNdaCount,
      isLoading: isLoadingSignedNdas,
      Icon: FileSignature,
      accent: 'evidence',
      onClick: () => router.push(`/trust-center/NDAs?${NDA_REQUEST_TAB_PARAM}=${NDA_SIGNED_TAB}`),
    },
  ]

  return <DashboardOverviewCard title="Trust Center Overview" attentionCount={requiredAttentionCount} stats={stats} />
}

export default DashboardTrustCenterOverview
