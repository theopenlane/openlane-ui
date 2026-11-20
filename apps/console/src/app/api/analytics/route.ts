import { NextResponse } from 'next/server'
import { subDays, format as formatDate } from 'date-fns'
import { GET_TRUST_CENTER_DASHBOARD } from '@repo/codegen/query/trust-center'
import { type GetTrustCenterDashboardQuery } from '@repo/codegen/src/schema'
import { STATS_WINDOW_DAYS } from '@/constants/stats'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { queryGraphqlServer } from '@/lib/server/fetch-graphql'
import { getServerCredentials } from '@/lib/server/server-credentials'

const BASE_URL = 'https://api.pirsch.io/api/v1'
const PIRSCH_TOKEN_REFRESH_MARGIN_MS = 30_000 // 30s

type PirschTokenCache = {
  token: string | null
  expiresAtMs: number
}

let pirschTokenCache: PirschTokenCache = {
  token: null,
  expiresAtMs: 0,
}

const getPirschAccessToken = async () => {
  const clientId = process.env.PIRSCH_CLIENT_ID
  const clientSecret = process.env.PIRSCH_SECRET

  if (!clientId || !clientSecret) {
    return { token: null, error: 'Missing Pirsch credentials' }
  }

  const now = Date.now()
  if (pirschTokenCache.token && pirschTokenCache.expiresAtMs > now + PIRSCH_TOKEN_REFRESH_MARGIN_MS) {
    return { token: pirschTokenCache.token, error: null }
  }

  const res = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('Pirsch token error:', errorText)
    return { token: null, error: 'Failed to fetch Pirsch token' }
  }

  const data: { access_token?: string; expires_at?: string } = await res.json()
  const token = data.access_token?.trim()
  const expiresAtMs = data.expires_at ? Date.parse(data.expires_at) : 0

  if (!token || !expiresAtMs || Number.isNaN(expiresAtMs)) {
    console.error('Pirsch token payload invalid:', data)
    return { token: null, error: 'Invalid Pirsch token response' }
  }

  pirschTokenCache = { token, expiresAtMs }
  return { token, error: null }
}

const resolveTrustCenterDomainId = async (): Promise<string | NextResponse> => {
  const credentials = await getServerCredentials()
  if (!credentials) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await queryGraphqlServer<GetTrustCenterDashboardQuery>(GET_TRUST_CENTER_DASHBOARD, {}, credentials.accessToken, credentials.sessionCookie)
  if (!data) {
    return NextResponse.json({ error: 'Unable to load trust center' }, { status: 502 })
  }

  const domainId = getNodes(data.trustCenters)[0]?.pirschDomainID?.trim()
  return domainId || NextResponse.json({ error: 'Trust center has no analytics domain' }, { status: 404 })
}

export const GET = async () => {
  const domainId = await resolveTrustCenterDomainId()
  if (typeof domainId !== 'string') return domainId

  const { token, error } = await getPirschAccessToken()
  if (!token) return NextResponse.json({ error: error ?? 'Missing Pirsch credentials' }, { status: 500 })

  const to = new Date()
  const from = subDays(to, STATS_WINDOW_DAYS)

  const query = new URLSearchParams({
    id: domainId,
    from: formatDate(from, 'yyyy-MM-dd'),
    to: formatDate(to, 'yyyy-MM-dd'),
  })

  try {
    const [resStats, resDuration] = await Promise.all([
      fetch(`${BASE_URL}/statistics/visitor?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${BASE_URL}/statistics/duration/session?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ])

    if (!resStats.ok || !resDuration.ok) {
      const errors = {
        stats: await resStats.text(),
        duration: await resDuration.text(),
      }
      console.error('Pirsch API error:', errors)
      return NextResponse.json({ error: 'Pirsch API error' }, { status: 502 })
    }

    const statsData: Array<{ visitors: number; views: number }> = await resStats.json()
    const durationData: Array<{ average_time_spent_seconds: number }> = await resDuration.json()

    const totalVisitors = statsData.reduce((sum, rec) => sum + (rec.visitors ?? 0), 0)
    const totalViews = statsData.reduce((sum, rec) => sum + (rec.views ?? 0), 0)

    const avgDuration = durationData.length > 0 ? durationData.reduce((sum, rec) => sum + (rec.average_time_spent_seconds ?? 0), 0) / durationData.length : 0

    return NextResponse.json({
      visitors: totalVisitors,
      views: totalViews,
      duration: Math.round(avgDuration),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
