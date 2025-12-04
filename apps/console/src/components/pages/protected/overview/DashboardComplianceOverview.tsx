import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { SquarePlus, TriangleAlert, Fingerprint, SlidersHorizontal } from 'lucide-react'
import { useGetControlCountsByStatus, useGetControlNotImplementedCount } from '@/lib/graphql-hooks/controls.ts'

const DashboardComplianceOverview = () => {
  const { data, isLoading } = useGetControlNotImplementedCount()
  console.log(data)

  return (
    <Card>
      <CardTitle className="px-6 pt-6 pb-0 text-lg font-semibold flex justify-between">
        <span>Compliance Overview</span>
        <span className="text-sm text-muted-foreground leading-5">5 Items Require Attention</span>
      </CardTitle>

      <CardContent className="px-6 pb-6 pt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-btn-secondary p-4 border border-muted/20">
          <h3 className="text-sm font-medium flex items-center gap-2">Controls & Evidence</h3>

          <div className="grid grid-cols-2 mt-4 relative">
            <div className="pr-4">
              <p className="text-xs">
                <span className="pr-1">Controls</span> • <span className="text-muted-foreground pl-1">Not Implemented</span>
              </p>
              <p className="text-2xl font-bold flex items-center gap-2 ">
                <SlidersHorizontal size={16} className="text-success" /> 5
              </p>
            </div>

            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted/30" />

            <div className="pl-4">
              <p className="text-xs">
                <span className="pr-1">Evidence</span> • <span className="text-muted-foreground pl-1">Items Missing</span>
              </p>
              <p className="text-2xl font-bold flex items-center gap-2 text-danger">
                <Fingerprint size={16} /> 5
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-btn-secondary p-4 border border-muted/20">
          <h3 className="text-sm font-medium flex items-center gap-2">Risks & Tasks</h3>

          <div className="grid grid-cols-2 mt-4 relative">
            <div className="pr-4">
              <p className="text-xs">
                <span className="pr-1">Tasks</span> • <span className="text-muted-foreground pl-1">Overdue</span>
              </p>
              <p className="text-2xl font-bold flex items-center gap-2 text-danger">
                <SquarePlus size={16} /> 5
              </p>
            </div>

            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-muted/30" />

            <div className="pl-4">
              <p className="text-xs">
                <span className="pr-1">Risks</span> • <span className="text-muted-foreground pl-1">Pending Review</span>
              </p>
              <p className="text-2xl font-bold flex items-center gap-2 text-warning">
                <TriangleAlert size={16} /> 5
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardComplianceOverview
