import { useGetStandardControlStats } from '@/lib/graphql-hooks/standards'
import React from 'react'
import MyFrameworksStatsChart from './my-framework-stats-chart'
import { Fingerprint, Settings2 } from 'lucide-react'

type TMyFrameworksStatsProps = {
  standardId: string
  isSystemOwned?: boolean | null | undefined
}

const MyFrameworksStats: React.FC<TMyFrameworksStatsProps> = ({ standardId, isSystemOwned }: TMyFrameworksStatsProps) => {
  const { data } = useGetStandardControlStats(standardId, isSystemOwned ?? false)
  if (!data) return null
  const covered = Number(data.standard.coveredControls.totalCount)
  const automated = Number(data.standard.automatedControls.totalCount)
  const total = data.standard.totalControlsSystemOwned ?? data.standard.totalControlsNonSystemOwned
  const finaltotal = Number(total?.totalCount)

  return (
    <div className="w-full mt-2">
      <div className="border mb-2"></div>
      <MyFrameworksStatsChart data={data} />
      <div className="border mt-2"></div>

      <div className="flex justify-between items-center mt-2 gap-4">
        <div className="flex items-center gap-2 pr-4">
          <Settings2 className="text-text-informational" size={14} />
          <span className="text-sm leading-6 font-medium text-text-informational">Coverage</span>
          <span className="text-sm leading-6 font-medium text-text-informational">
            {covered} / {finaltotal}
          </span>
        </div>
        <div className="border-l h-6"></div>
        <div className="flex items-center gap-2 pl-4">
          <Fingerprint className="text-text-informational" size={14} />
          <span className="text-sm leading-6 font-medium text-text-informational">Automated Evidence</span>
          <span className="text-sm leading-6 font-medium text-text-informational">{automated}</span>
        </div>
      </div>
    </div>
  )
}

export default MyFrameworksStats
