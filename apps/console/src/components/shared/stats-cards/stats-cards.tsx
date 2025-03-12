import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { ArrowUpRight, ArrowDownRight, Hourglass } from 'lucide-react'
import { statCardStyles } from './stats-cards-styles'
import { useGetAllEvidences } from '@/lib/graphql-hooks/evidence'
import { useSearchParams } from 'next/navigation'

interface Stat {
  title: string
  percentage: number
  count: number
  total: number
  trend: number
  trendType: 'up' | 'down'
  color: 'green' | 'red' | 'yellow'
}

const stats: Stat[] = [
  {
    title: 'Evidence submitted',
    percentage: 88,
    count: 178,
    total: 250,
    trend: 5.97,
    trendType: 'up',
    color: 'green',
  },
  {
    title: 'Evidence accepted',
    percentage: 8,
    count: 12,
    total: 250,
    trend: 5.97,
    trendType: 'down',
    color: 'red',
  },
  {
    title: 'Evidence overdue',
    percentage: 29,
    count: 35,
    total: 250,
    trend: 5.97,
    trendType: 'up',
    color: 'yellow',
  },
]

const StatCard: React.FC<{ stat: Stat; hasData: boolean }> = ({ stat, hasData }) => {
  const { title, percentage, count, total, trend, trendType, color } = stat
  const { wrapper, content, title: titleClass, trendBadge, percentage: percentageClass, statDetails, progressWrapper, progressBar } = statCardStyles({ color })

  return (
    <Card className={wrapper()}>
      <CardContent className={content()}>
        <h3 className={titleClass()}>{title}</h3>

        {/* If no data, show placeholder */}
        {!hasData ? (
          <div className="flex items-center gap-2 justify-start mt-5 ">
            <Hourglass size={24} strokeWidth={1} className="text-brand" />
            <span>No data...</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className={trendBadge()}>
                {trendType === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                {trend}%
              </div>
            </div>
            <div className={percentageClass()}>{percentage}%</div>
            <div className={statDetails()}>
              <div>
                {percentage}% ({count})
              </div>
              <div>{total} Controls</div>
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
  const programId = searchParams.get('id') as string

  const { data: data, isLoading, error } = useGetAllEvidences({ hasProgramsWith: programId ? [{ id: programId }] : undefined })

  const hasData = !!data?.evidences.edges?.length

  return (
    <div className="flex gap-8 justify-center">
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} hasData={hasData} />
      ))}
    </div>
  )
}

export default StatsCards
