import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { type NextRequest, NextResponse } from 'next/server'

// GET is exposed to the client for simple polling. The upstream health check
// is an operations/run POST endpoint, so this handler bridges the two.
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const provider = request.nextUrl.searchParams.get('provider')?.trim()
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    const res = await secureFetch(`${openlaneAPIUrl}/v1/integrations/${encodeURIComponent(provider)}/operations/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        payload: {
          operation: 'health.default',
          config: {},
          force: true,
        },
      }),
    })

    const raw = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: raw || `Health check failed for ${provider}` }, { status: res.status })
    }

    try {
      const payload = JSON.parse(raw) as { status?: string; summary?: string; details?: Record<string, unknown> }
      return NextResponse.json(payload)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON response while checking integration health' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error checking integration health:', error)
    return NextResponse.json({ error: 'An error occurred while checking integration health' }, { status: 500 })
  }
}
