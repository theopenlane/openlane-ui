import { NextResponse } from 'next/server'
import { subDays, format as formatDate } from 'date-fns'
import { auth } from '@/lib/auth/auth'

const BASE_URL = 'https://api.pirsch.io/api/v1'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = process.env.PIRSCH_SECRET
  const { searchParams } = new URL(request.url)
  const domainId = searchParams.get('pirschDomainID')?.trim() ?? ''

  if (!token) return NextResponse.json({ error: 'Missing Pirsch credentials' }, { status: 500 })
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
        headers: { Authorization: `${token}` },
        cache: 'no-store',
      }),
      fetch(`${BASE_URL}/statistics/duration/session?${query}`, {
        headers: { Authorization: `${token}` },
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
