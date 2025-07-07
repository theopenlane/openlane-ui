import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Hourglass } from 'lucide-react'
import { statCardStyles } from './stats-cards-styles'
import { usePathname, useSearchParams } from 'next/navigation'
import { useGlobalEvidenceStats, useProgramEvidenceStats } from '@/lib/graphql-hooks/programs'

interface Stat {
  title: string
  percentage: number
  count: number
  total: number
  trend: number
  trendType: 'up' | 'down'
  color: 'green' | 'red' | 'yellow'
}

const StatCard: React.FC<{ stat: Stat; hasData: boolean }> = ({ stat, hasData }) => {
  const { title, percentage, count, total, color } = stat
  const { wrapper, content, title: titleClass, percentage: percentageClass, statDetails, progressWrapper, progressBar } = statCardStyles({ color })

  return (
    <Card className={wrapper()}>
      <CardContent className={content()}>
        <h3 className={titleClass()}>{title}</h3>
        {!hasData ? (
          <div className="flex items-center gap-2 justify-start mt-5 ">
            <Hourglass size={24} strokeWidth={1} className="text-brand" />
            <span>No data...</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              {/* <div className={trendBadge()}>
                {trendType === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                {trend}%
              </div> */}
            </div>
            <div className={percentageClass()}>{percentage}%</div>
            <div className={statDetails()}>
              <p className="text-base">{`${percentage}% (${count})`}</p>
              <p className="text-base">{`${total} Controls`}</p>
            </div>
            <div className={progressWrapper()}>
              <div className={progressBar()} style={{ width: `${percentage}%` }}></div>
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

  const data = programId ? programStats.data : globalStats.data

  const total = data?.total ?? 0

  const dynamicStats: Stat[] = [
    {
      title: 'Evidence submitted',
      percentage: total ? Math.round(((data?.submitted ?? 0) / total) * 100) : 0,
      count: data?.submitted ?? 0,
      total,
      trend: 0,
      trendType: 'up',
      color: 'green',
    },
    {
      title: 'Evidence accepted',
      percentage: total ? Math.round(((data?.accepted ?? 0) / total) * 100) : 0,
      count: data?.accepted ?? 0,
      total,
      trend: 0,
      trendType: 'down',
      color: 'red',
    },
    {
      title: 'Evidence overdue',
      percentage: total ? Math.round(((data?.overdue ?? 0) / total) * 100) : 0,
      count: data?.overdue ?? 0,
      total,
      trend: 0,
      trendType: 'up',
      color: 'yellow',
    },
  ]

  return (
    <div className="flex gap-8 justify-center">
      {dynamicStats.map((stat, index) => (
        <StatCard key={index} stat={stat} hasData={total > 0} />
      ))}
    </div>
  )
}

export default StatsCards
