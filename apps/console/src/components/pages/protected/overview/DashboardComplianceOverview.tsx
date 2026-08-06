import { TriangleAlert, Fingerprint, SlidersHorizontal, ListChecks } from 'lucide-react'
import { useGetControlNotImplementedCount } from '@/lib/graphql-hooks/control'
import { useGetEvidenceMissingArtifactCount } from '@/lib/graphql-hooks/evidence.ts'
import { useGetOverdueTasksCount } from '@/lib/graphql-hooks/task'
import { useGetRiskOpenAndIdentifiedCount } from '@/lib/graphql-hooks/risk'
import { saveFilters, type TFilterState } from '@/components/shared/table-filter/filter-storage.ts'
import { ControlControlStatus, EvidenceEvidenceStatus, RiskRiskStatus } from '@repo/codegen/src/schema.ts'
import { useRouter } from 'next/navigation'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useOrganization } from '@/hooks/useOrganization'
import DashboardOverviewCard, { type TDashboardOverviewStat } from './DashboardOverviewCard'
import { useOpenOverdueTasks } from './use-open-overdue-tasks'

const DashboardComplianceOverview = () => {
  const { currentOrgId } = useOrganization()
  const router = useRouter()
  const { totalCount: controlNotImplementedCount, isLoading: isLoadingControls } = useGetControlNotImplementedCount()
  const { totalCount: evidenceMissingArtifactCount, isLoading: isLoadingEvidence } = useGetEvidenceMissingArtifactCount()
  const { totalCount: taskOverdueCount, isLoading: isLoadingTasks } = useGetOverdueTasksCount()
  const { totalCount: riskOpenAndIdentifiedCount, isLoading: isLoadingRisks } = useGetRiskOpenAndIdentifiedCount()
  const requiredAttentionCount = controlNotImplementedCount + evidenceMissingArtifactCount + taskOverdueCount + riskOpenAndIdentifiedCount
  const openOverdueTasks = useOpenOverdueTasks()

  const handleOpenControlDashboard = () => {
    const filters: TFilterState = {
      statusIn: [ControlControlStatus.NOT_IMPLEMENTED],
    }

    saveFilters(TableKeyEnum.CONTROL, filters, currentOrgId)
    router.push('/controls')
  }

  const handleOpenEvidenceDashboard = () => {
    const filters: TFilterState = {
      statusIn: [EvidenceEvidenceStatus.MISSING_ARTIFACT],
    }

    saveFilters(TableKeyEnum.EVIDENCE, filters, currentOrgId)
    router.push('/evidence')
  }

  const handleOpenRiskDashboard = () => {
    const filters: TFilterState = {
      statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED],
    }

    saveFilters(TableKeyEnum.RISK, filters, currentOrgId)
    router.push('/exposure/risks')
  }

  const stats: TDashboardOverviewStat[] = [
    {
      key: 'controls',
      label: 'Controls',
      subtitle: 'Not Implemented',
      value: controlNotImplementedCount,
      isLoading: isLoadingControls,
      Icon: SlidersHorizontal,
      accent: 'success',
      onClick: handleOpenControlDashboard,
    },
    {
      key: 'evidence',
      label: 'Evidence',
      subtitle: 'Items Missing',
      value: evidenceMissingArtifactCount,
      isLoading: isLoadingEvidence,
      Icon: Fingerprint,
      accent: 'evidence',
      onClick: handleOpenEvidenceDashboard,
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
      key: 'risks',
      label: 'Risks',
      subtitle: 'Pending Review',
      value: riskOpenAndIdentifiedCount,
      isLoading: isLoadingRisks,
      Icon: TriangleAlert,
      accent: 'warning',
      onClick: handleOpenRiskDashboard,
    },
  ]

  return <DashboardOverviewCard title="Compliance Overview" attentionCount={requiredAttentionCount} stats={stats} />
}

export default DashboardComplianceOverview
