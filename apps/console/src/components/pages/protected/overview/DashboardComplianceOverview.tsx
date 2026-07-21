import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { TriangleAlert, Fingerprint, SlidersHorizontal, ListChecks } from 'lucide-react'
import { useGetControlNotImplementedCount } from '@/lib/graphql-hooks/control'
import { useGetEvidenceMissingArtifactCount } from '@/lib/graphql-hooks/evidence.ts'
import { useGetOverdueTasksCount } from '@/lib/graphql-hooks/task'
import { useGetRiskOpenAndIdentifiedCount } from '@/lib/graphql-hooks/risk'
import { saveFilters, saveQuickFilters, type TFilterState } from '@/components/shared/table-filter/filter-storage.ts'
import { ControlControlStatus, EvidenceEvidenceStatus, RiskRiskStatus } from '@repo/codegen/src/schema.ts'
import { DateFormatStorage, type TQuickFilter } from '@/components/shared/table-filter/table-filter-helper.ts'
import { format, startOfDay } from 'date-fns'
import { useRouter } from 'next/navigation'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useOrganization } from '@/hooks/useOrganization'

const DashboardComplianceOverview = () => {
  const { currentOrgId } = useOrganization()
  const router = useRouter()
  const { totalCount: controlNotImplementedCount } = useGetControlNotImplementedCount()
  const { totalCount: evidenceMissingArtifactCount } = useGetEvidenceMissingArtifactCount()
  const { totalCount: taskOverdueCount } = useGetOverdueTasksCount()
  const { totalCount: riskOpenAndIdentifiedCount } = useGetRiskOpenAndIdentifiedCount()
  const requiredAttentionCount = controlNotImplementedCount + evidenceMissingArtifactCount + taskOverdueCount + riskOpenAndIdentifiedCount

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

  const handleOpenTaskDashboard = () => {
    const filters: TQuickFilter = {
      label: 'Overdue',
      key: 'overdue',
      type: 'custom',
      getCondition: () => ({ dueLT: format(startOfDay(new Date()), DateFormatStorage) }),
      isActive: true,
    }

    saveQuickFilters(TableKeyEnum.TASK, filters, currentOrgId)
    router.push('/automation/tasks')
  }

  const handleOpenRiskDashboard = () => {
    const filters: TFilterState = {
      statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED],
    }

    saveFilters(TableKeyEnum.RISK, filters, currentOrgId)
    router.push('/exposure/risks')
  }

  const stats = [
    {
      key: 'controls',
      label: 'Controls',
      subtitle: 'Not Implemented',
      count: controlNotImplementedCount,
      Icon: SlidersHorizontal,
      colorClass: 'text-success',
      chipClass: 'bg-success/12',
      onClick: handleOpenControlDashboard,
    },
    {
      key: 'evidence',
      label: 'Evidence',
      subtitle: 'Items Missing',
      count: evidenceMissingArtifactCount,
      Icon: Fingerprint,
      colorClass: 'text-evidence-icon',
      chipClass: 'bg-evidence-icon/12',
      onClick: handleOpenEvidenceDashboard,
    },
    {
      key: 'tasks',
      label: 'Tasks',
      subtitle: 'Overdue',
      count: taskOverdueCount,
      Icon: ListChecks,
      colorClass: 'text-info',
      chipClass: 'bg-info/12',
      onClick: handleOpenTaskDashboard,
    },
    {
      key: 'risks',
      label: 'Risks',
      subtitle: 'Pending Review',
      count: riskOpenAndIdentifiedCount,
      Icon: TriangleAlert,
      colorClass: 'text-warning',
      chipClass: 'bg-warning/12',
      onClick: handleOpenRiskDashboard,
    },
  ]

  return (
    <Card className="bg-homepage-card border-homepage-card-border homepage-card-border">
      <CardTitle className="px-6 pt-6 pb-0 text-lg font-semibold">
        <span>Compliance Overview</span>
        <div className="flex items-center gap-2 pt-1">
          <span
            className={`
        inline-flex h-1.5 w-1.5 shrink-0 rounded-full animate-pulse
        ${requiredAttentionCount === 0 ? 'bg-success' : 'bg-warning'}
      `}
          />
          <span className="text-muted-foreground text-xs font-normal leading-5">
            {requiredAttentionCount === 0 ? 'No Items Require Attention' : `${requiredAttentionCount} Items Require Attention`}
          </span>
        </div>
      </CardTitle>

      <CardContent className="grid grid-cols-2 gap-3 px-6 pb-6 pt-4 lg:grid-cols-4">
        {stats.map(({ key, label, subtitle, count, Icon, colorClass, chipClass, onClick }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-2 rounded-lg bg-homepage-card-item-transparent p-3 border border-homepage-card-border cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            onClick={onClick}
          >
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xl font-semibold">{count}</span>
              <div className={`p-2 rounded-md inline-flex items-center justify-center ${chipClass}`}>
                <Icon size={18} className={colorClass} />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default DashboardComplianceOverview
