import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { TriangleAlert, Fingerprint, SlidersHorizontal, ListChecks } from 'lucide-react'
import { useGetControlNotImplementedCount } from '@/lib/graphql-hooks/control'
import { useGetEvidenceMissingArtifactCount } from '@/lib/graphql-hooks/evidence.ts'
import { useGetOverdueTasksCount } from '@/lib/graphql-hooks/task'
import { useGetRiskOpenAndIdentifiedCount } from '@/lib/graphql-hooks/risk'
import { saveFilters, saveQuickFilters, TFilterState } from '@/components/shared/table-filter/filter-storage.ts'
import { ControlControlStatus, EvidenceEvidenceStatus, RiskRiskStatus } from '@repo/codegen/src/schema.ts'
import { DateFormatStorage, TQuickFilter } from '@/components/shared/table-filter/table-filter-helper.ts'
import { format, startOfDay } from 'date-fns'
import { useRouter } from 'next/navigation'
import { TableKeyEnum } from '@repo/ui/table-key'

const DashboardComplianceOverview = () => {
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

    saveFilters(TableKeyEnum.CONTROL, filters)
    router.push('/controls')
  }

  const handleOpenEvidenceDashboard = () => {
    const filters: TFilterState = {
      statusIn: [EvidenceEvidenceStatus.MISSING_ARTIFACT],
    }

    saveFilters(TableKeyEnum.EVIDENCE, filters)
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

    saveQuickFilters(TableKeyEnum.TASK, filters)
    router.push('/tasks')
  }

  const handleOpenRiskDashboard = () => {
    const filters: TFilterState = {
      statusIn: [RiskRiskStatus.OPEN, RiskRiskStatus.IDENTIFIED],
    }

    saveFilters(TableKeyEnum.RISK, filters)
    router.push('/risks')
  }

  return (
    <Card className="bg-homepage-card border-homepage-card-border homepage-card-border">
      <CardTitle className="px-6 pt-6 pb-0 text-lg font-semibold flex justify-between">
        <span>Compliance Overview</span>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
            <span
              className={`
        inline-flex h-1.5 w-1.5 rounded-full animate-pulse
        ${requiredAttentionCount === 0 ? 'bg-success' : 'bg-warning'}
      `}
            />
            <span className="text-muted-foreground text-sm leading-5 font-normal">
              {requiredAttentionCount === 0 ? 'No Items Require Attention' : `${requiredAttentionCount} Items Require Attention`}
            </span>
          </span>
        </div>
      </CardTitle>

      <CardContent className="px-6 pb-6 pt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-homepage-card-item-transparent p-4 border border-homepage-card-border">
          <h3 className="text-sm font-medium flex items-center gap-2">Controls & Evidence</h3>

          <div className="grid grid-cols-2 mt-4 relative">
            <div className="pr-4">
              <p className="text-xs pb-2">
                <span className="pr-1">Controls</span>
                <span className="text-muted-foreground pl-1">
                  <span className="pr-1"> • </span>Not Implemented
                </span>
              </p>

              <div
                className="inline-flex items-center gap-2 text-2xl font-medium cursor-pointer
             transition-all duration-300 hover:scale-[1.05] hover:-translate-y-0.5 hover:rotate-1
             relative group"
                onClick={handleOpenControlDashboard}
              >
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                   blur-lg bg-success/20 transition-all duration-500"
                ></span>

                <SlidersHorizontal size={20} className="text-success relative z-10" />
                <span className="relative z-10">{controlNotImplementedCount}</span>
              </div>
            </div>

            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted" />

            <div className="pl-4">
              <p className="text-xs pb-2">
                <span className="pr-1">Evidence</span>
                <span className="text-muted-foreground pl-1">
                  <span className="pr-1"> • </span>Items Missing
                </span>
              </p>

              <div
                className="inline-flex items-center gap-2 text-2xl font-medium cursor-pointer
             transition-all duration-300 hover:scale-[1.05] hover:-translate-y-0.5 hover:rotate-1
             relative group"
                onClick={handleOpenEvidenceDashboard}
              >
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                   blur-lg bg-evidence-icon/20 transition-all duration-500"
                ></span>

                <Fingerprint size={20} className="text-evidence-icon relative z-10" />
                <span className="relative z-10">{evidenceMissingArtifactCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-homepage-card-item-transparent p-4 border border-homepage-card-border">
          <h3 className="text-sm font-medium flex items-center gap-2">Risks & Tasks</h3>

          <div className="grid grid-cols-2 mt-4 relative">
            <div className="pr-4">
              <p className="text-xs pb-2">
                <span className="pr-1">Tasks</span>
                <span className="text-muted-foreground pl-1">
                  <span className="pr-1"> • </span>Overdue
                </span>
              </p>

              <div
                className="inline-flex items-center gap-2 text-2xl font-medium cursor-pointer
             transition-all duration-300 hover:scale-[1.05] hover:-translate-y-0.5 hover:rotate-1
             relative group"
                onClick={handleOpenTaskDashboard}
              >
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                   blur-lg bg-info/40 transition-all duration-500"
                ></span>

                <ListChecks size={20} className="text-info relative z-10" />
                <span className="relative z-10">{taskOverdueCount}</span>
              </div>
            </div>

            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted" />

            <div className="pl-4">
              <p className="text-xs pb-2">
                <span className="pr-1">Risks</span>
                <span className="text-muted-foreground pl-1">
                  <span className="pr-1"> • </span>Pending Review
                </span>
              </p>

              <div
                className="inline-flex items-center gap-2 text-2xl font-medium cursor-pointer
             transition-all duration-300 hover:scale-[1.05] hover:-translate-y-0.5 hover:rotate-1
             relative group"
                onClick={handleOpenRiskDashboard}
              >
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                   blur-lg bg-warning/20 transition-all duration-500"
                ></span>

                <TriangleAlert size={20} className="text-warning relative z-10" />
                <span className="relative z-10">{riskOpenAndIdentifiedCount}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardComplianceOverview
