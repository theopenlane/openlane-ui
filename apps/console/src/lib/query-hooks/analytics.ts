'use client'

import { useQuery } from '@tanstack/react-query'

export interface AnalyticsResponse {
  visitors: number
  views: number
  duration: number
}

const fetchVisitors = async (): Promise<AnalyticsResponse> => {
  const res = await fetch('/api/analytics')

  if (!res.ok) {
    throw new Error('Failed to fetch analytics')
  }

  return res.json()
}

export const useAnalytics = (pirschDomainID?: string | null) =>
  useQuery<AnalyticsResponse>({
    queryKey: ['analytics', pirschDomainID],
    queryFn: fetchVisitors,
    enabled: !!pirschDomainID,
    staleTime: 1000 * 60 * 30, // 30min
  })
