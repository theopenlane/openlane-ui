import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { SquarePlus, TriangleAlert, Fingerprint, SlidersHorizontal } from 'lucide-react'
import { useGetControlNotImplementedCount } from '@/lib/graphql-hooks/controls.ts'
import { useGetEvidenceMissingArtifactCount } from '@/lib/graphql-hooks/evidence.ts'
import { useGetOverdueTasksCount } from '@/lib/graphql-hooks/tasks.ts'
import { useGetRiskOpenCount } from '@/lib/graphql-hooks/risks.ts'

const DashboardComplianceOverview = () => {
  const { totalCount: controlNotImplementedCount } = useGetControlNotImplementedCount()
  const { totalCount: evidenceMissingArtifactCount } = useGetEvidenceMissingArtifactCount()
  const { totalCount: taskOverdueCount } = useGetOverdueTasksCount()
  const { totalCount: riskOpenCount } = useGetRiskOpenCount()
  const requiredAttentionCount = controlNotImplementedCount + evidenceMissingArtifactCount + taskOverdueCount + riskOpenCount

  return (
    <Card>
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
        <div className="rounded-lg bg-btn-secondary p-4 border border-muted/20">
          <h3 className="text-sm font-medium flex items-center gap-2">Controls & Evidence</h3>

          <div className="grid grid-cols-2 mt-4 relative">
            <div className="pr-4">
              <p className="text-xs pb-2">
                <span className="pr-1">Controls</span> •<span className="text-muted-foreground pl-1">Not Implemented</span>
              </p>

              <div
                className="inline-flex items-center gap-2 text-2xl font-medium cursor-pointer
             transition-all duration-300 hover:scale-[1.05] hover:-translate-y-0.5 hover:rotate-1
             relative group"
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
                <span className="pr-1">Evidence</span> •<span className="text-muted-foreground pl-1">Items Missing</span>
              </p>

              <div
                className="inline-flex items-center gap-2 text-2xl font-medium cursor-pointer
             transition-all duration-300 hover:scale-[1.05] hover:-translate-y-0.5 hover:rotate-1
             relative group"
              >
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                   blur-lg bg-danger/20 transition-all duration-500"
                ></span>

                <Fingerprint size={20} className="text-danger relative z-10" />
                <span className="relative z-10">{evidenceMissingArtifactCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-btn-secondary p-4 border border-muted/20">
          <h3 className="text-sm font-medium flex items-center gap-2">Risks & Tasks</h3>

          <div className="grid grid-cols-2 mt-4 relative">
            <div className="pr-4">
              <p className="text-xs pb-2">
                <span className="pr-1">Tasks</span> •<span className="text-muted-foreground pl-1">Overdue</span>
              </p>

              <div
                className="inline-flex items-center gap-2 text-2xl font-medium cursor-pointer
             transition-all duration-300 hover:scale-[1.05] hover:-translate-y-0.5 hover:rotate-1
             relative group"
              >
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                   blur-lg bg-danger/20 transition-all duration-500"
                ></span>

                <SquarePlus size={20} className="text-danger relative z-10" />
                <span className="relative z-10">{taskOverdueCount}</span>
              </div>
            </div>

            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted" />

            <div className="pl-4">
              <p className="text-xs pb-2">
                <span className="pr-1">Risks</span> •<span className="text-muted-foreground pl-1">Pending Review</span>
              </p>

              <div
                className="inline-flex items-center gap-2 text-2xl font-medium cursor-pointer
             transition-all duration-300 hover:scale-[1.05] hover:-translate-y-0.5 hover:rotate-1
             relative group"
              >
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                   blur-lg bg-warning/20 transition-all duration-500"
                ></span>

                <TriangleAlert size={20} className="text-warning relative z-10" />
                <span className="relative z-10">{riskOpenCount}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardComplianceOverview
