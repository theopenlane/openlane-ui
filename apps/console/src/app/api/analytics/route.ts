import { NextResponse } from 'next/server'
import { subDays, format as formatDate } from 'date-fns'
import { auth } from '@/lib/auth/auth'

const BASE_URL = 'https://api.pirsch.io/api/v1'

type PirschTokenCache = {
  token: string | null
  expiresAtMs: number
}

let pirschTokenCache: PirschTokenCache = {
  token: null,
  expiresAtMs: 0,
}

async function getPirschAccessToken() {
  const clientId = process.env.PIRSCH_CLIENT_ID
  const clientSecret = process.env.PIRSCH_SECRET

  if (!clientId || !clientSecret) {
    return { token: null, error: 'Missing Pirsch credentials' }
  }

  const now = Date.now()
  if (pirschTokenCache.token && pirschTokenCache.expiresAtMs > now + 30_000) {
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

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token, error } = await getPirschAccessToken()
  const { searchParams } = new URL(request.url)
  const domainId = searchParams.get('pirschDomainID')?.trim() ?? ''

  if (!token) return NextResponse.json({ error: error ?? 'Missing Pirsch credentials' }, { status: 500 })
  if (!domainId) return NextResponse.json({ error: 'Missing Pirsch domain ID' }, { status: 400 })

  const to = new Date()
  const from = subDays(to, 30)

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
      return NextResponse.json({ error: 'Pirsch API error', details: errors }, { status: 502 })
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
