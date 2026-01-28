'use client'

import React from 'react'
import { Users, Eye, Clock, PenTool } from 'lucide-react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { useGetNDAStats } from '@/lib/graphql-hooks/trust-center-NDA'
import { useAnalytics } from '@/lib/query-hooks/analytics'

interface AnalyticsCardsProps {
  ndaApprovalRequired: boolean | null | undefined
  pirschDomainID?: string | null
}

export default function AnalyticsCards({ ndaApprovalRequired, pirschDomainID }: AnalyticsCardsProps) {
  const { data: visitorData, isLoading: isLoadingVisitors, isError: isErrorVisitors } = useAnalytics(pirschDomainID)

  const { count: ndaCount, isLoading: isLoadingNDA } = useGetNDAStats({
    ndaApprovalRequired: !!ndaApprovalRequired,
    enabled: ndaApprovalRequired !== undefined,
  })

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const stats = [
    {
      title: 'Unique Visitors',
      value: isLoadingVisitors ? '...' : (visitorData?.visitors ?? 0).toLocaleString(),
      icon: <Users size={20} />,
    },
    {
      title: 'Page Visits',
      value: isLoadingVisitors ? '...' : (visitorData?.views ?? 0).toLocaleString(),
      icon: <Eye size={20} />,
    },
    {
      title: 'Visit Duration',
      value: isLoadingVisitors ? '...' : formatDuration(visitorData?.duration ?? 0),
      icon: <Clock size={20} />,
    },
    {
      title: ndaApprovalRequired ? 'NDA Requests Waiting' : 'NDA Requests',
      value: isLoadingNDA ? '...' : ndaCount.toLocaleString(),
      icon: <PenTool size={20} />,
    },
  ]

  if (isErrorVisitors || isLoadingVisitors) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <CardItem key={index} title={stat.title} value={stat.value} icon={stat.icon} />
      ))}
    </div>
  )
}

interface CardItemProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

const CardItem: React.FC<CardItemProps> = ({ title, value, icon }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-btn-secondary border border-muted text-muted-foreground">{icon}</div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
    </CardContent>
  </Card>
)
