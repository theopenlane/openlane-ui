'use client'

import { useQuery } from '@tanstack/react-query'

export interface AnalyticsResponse {
  visitors: number
  views: number
  duration: number
}

export async function fetchVisitors(pirschDomainID: string): Promise<AnalyticsResponse> {
  const query = new URLSearchParams({ pirschDomainID })
  const res = await fetch(`/api/analytics?${query}`)

  if (!res.ok) {
    throw new Error('Failed to fetch analytics')
  }

  return res.json()
}

export function useAnalytics(pirschDomainID?: string | null) {
  return useQuery<AnalyticsResponse>({
    queryKey: ['analytics', pirschDomainID ?? ''],
    queryFn: () => fetchVisitors(pirschDomainID ?? ''),
    enabled: !!pirschDomainID,
    staleTime: 1000 * 60 * 30,
  })
}
