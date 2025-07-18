import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { ArrowDownRight, ArrowUpRight, Hourglass, Minus } from 'lucide-react'
import { statCardStyles } from './stats-cards-styles'
import { usePathname, useSearchParams } from 'next/navigation'
import { useGlobalEvidenceStats, useProgramEvidenceStats } from '@/lib/graphql-hooks/programs'
import { useSubmittedEvidenceTrend, useAcceptedEvidenceTrend, useRejectedEvidenceTrend } from '@/lib/graphql-hooks/evidence'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@repo/ui/tooltip'

interface Stat {
  title: string
  percentage: number
  count: number
  total: number
  trend: number
  trendType: 'up' | 'down' | 'flat'
  color: 'green' | 'red' | 'yellow' | 'gray' | 'blue'
  trendColor?: 'green' | 'red' | 'gray' | 'yellow'
  tooltip?: React.ReactNode // Optional tooltip content
}

// Helper function to determine trend colors only
const getTrendColor = (trendType: 'up' | 'down' | 'flat' | undefined, isRejected = false) => {
  if (isRejected) {
    // For rejected evidence: up is bad (red), down is good (yellow), flat is neutral (gray)
    if (trendType === 'up') return 'red' as const
    if (trendType === 'down') return 'yellow' as const
    return 'gray' as const
  } else {
    // For submitted/accepted evidence: up is good (green), down is bad (red), flat is neutral (gray)
    if (trendType === 'up') return 'green' as const
    if (trendType === 'down') return 'red' as const
    return 'gray' as const
  }
}

const StatCard: React.FC<{ stat: Stat; hasData: boolean; tooltip?: React.ReactNode }> = ({ stat, hasData, tooltip }) => {
  const { title, percentage, count, total, color, trend, trendType, trendColor } = stat
  const { wrapper, content, title: titleClass, percentage: percentageClass, statDetails, progressWrapper, progressBar, trendBadge } = statCardStyles({ color })

  console.log('StatCard debug:', {
    color,
    progressBarClass: progressBar(),
    progressWrapperClass: progressWrapper(),
    percentage,
    title,
    count,
    total,
  })

  // Get trend badge color based on trend direction
  const getTrendBadgeColor = () => {
    if (trendColor) return trendColor
    if (trend === 0 || trend === undefined) return 'gray'
    return trendType === 'up' ? 'green' : 'red'
  }

  return (
    <Card className={wrapper()}>
      <CardContent className={content() + ' relative'}>
        <div className="flex items-center justify-between">
          {tooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className={titleClass() + ' cursor-help'}>{title}</h3>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          ) : (
            <h3 className={titleClass()}>{title}</h3>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={trendBadge({ color: getTrendBadgeColor() })}>
                {trendType === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : trendType === 'down' ? <ArrowDownRight size={12} className="mr-1" /> : <Minus size={12} className="mr-1" />}
                {trend}%
              </div>
            </TooltipTrigger>
            <TooltipContent>Week-over-week percentage change in evidence for the selected program</TooltipContent>
          </Tooltip>
        </div>
        {!hasData ? (
          <div className="flex items-center gap-2 justify-start mt-5 ">
            <Hourglass size={24} strokeWidth={1} className="text-brand" />
            <span>No data...</span>
          </div>
        ) : (
          <>
            <div className={percentageClass()}>{percentage}%</div>
            <div className={statDetails()}>
              <p className="text-base">{`${percentage}% (${count})`}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-base cursor-help">{`${total} Controls`}</p>
                </TooltipTrigger>
                <TooltipContent>
                  Total number of controls included in the audit program. In the case of all programs, this is the total number of controls across all programs within the organization.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className={progressWrapper()}>
              <div
                className={progressBar()}
                style={{
                  width: percentage > 0 ? `${percentage}%` : '1px',
                  minWidth: '1px',
                }}
              ></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const StatsCards: React.FC = () => {
  const searchParams = useSearchParams()
  const path = usePathname()
  const programId = searchParams.get('id') as string

  const programStats = useProgramEvidenceStats(programId)
  const globalStats = useGlobalEvidenceStats({ enabled: !path.startsWith('/programs') })
  const submittedTrend = useSubmittedEvidenceTrend(programId)
  const acceptedTrend = useAcceptedEvidenceTrend(programId)
  const rejectedTrend = useRejectedEvidenceTrend(programId)

  const data = (programId ? programStats.data : globalStats.data) as { total: number; submitted: number; accepted: number; rejected: number } | undefined

  const total = data?.total ?? 0

  // In dynamicStats, allow optional tooltip property
  const dynamicStats: Stat[] = [
    {
      title: 'Evidence Submitted',
      percentage: total ? Math.round(((data?.submitted ?? 0) / total) * 100) : 0,
      count: data?.submitted ?? 0,
      total,
      trend: submittedTrend.data?.trend ?? 0,
      trendType: submittedTrend.data?.trendType ?? 'flat',
      color: 'blue',
      trendColor: getTrendColor(submittedTrend.data?.trendType),
      tooltip: 'Evidence submitted is the percentage of evidence that has been submitted but not reviewed internally or by an auditor.',
    },
    {
      title: 'Evidence Accepted',
      percentage: total ? Math.round(((data?.accepted ?? 0) / total) * 100) : 0,
      count: data?.accepted ?? 0,
      total,
      trend: acceptedTrend.data?.trend ?? 0,
      trendType: acceptedTrend.data?.trendType ?? 'flat',
      color: 'green',
      trendColor: getTrendColor(acceptedTrend.data?.trendType),
      tooltip: 'Evidence accepted is the percentage of evidence that has been accepted by the auditor.',
    },
    {
      title: 'Evidence Rejected',
      percentage: total ? Math.round(((data?.rejected ?? 0) / total) * 100) : 0,
      count: data?.rejected ?? 0,
      total,
      trend: rejectedTrend.data?.trend ?? 0,
      trendType: rejectedTrend.data?.trendType ?? 'flat',
      color: 'red',
      trendColor: getTrendColor(rejectedTrend.data?.trendType, true),
      tooltip: 'Evidence rejected is the percentage of evidence that has been rejected by the auditor and needs to be resubmitted.',
    },
  ]

  return (
    <TooltipProvider>
      <div className="flex gap-8 justify-center">
        {dynamicStats.map((stat, index) => (
          <StatCard key={index} stat={stat} hasData={total > 0} tooltip={stat.tooltip} />
        ))}
      </div>
    </TooltipProvider>
  )
}

export default StatsCards
