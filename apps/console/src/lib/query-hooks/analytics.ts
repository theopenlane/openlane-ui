'use client'

import { useQuery } from '@tanstack/react-query'

export interface AnalyticsResponse {
  visitors: number
  views: number
  duration: number
}

export async function fetchVisitors(): Promise<AnalyticsResponse> {
  const res = await fetch('/api/analytics')

  if (!res.ok) {
    throw new Error('Failed to fetch analytics')
  }

  return res.json()
}

export function useAnalytics() {
  return useQuery<AnalyticsResponse>({
    queryKey: ['analytics'],
    queryFn: fetchVisitors,
    staleTime: 1000 * 60 * 30,
  })
}
