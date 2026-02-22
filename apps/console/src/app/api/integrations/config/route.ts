import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { NextRequest, NextResponse } from 'next/server'

type ConfigRequestBody = {
  provider?: string
  payload?: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const token = session?.user?.accessToken

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as ConfigRequestBody
  const provider = body.provider?.trim()
  const payload = body.payload ?? {}

  if (!provider) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
  }

  const res = await secureFetch(`${openlaneAPIUrl}/v1/integrations/${encodeURIComponent(provider)}/config`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payload }),
  })

  const raw = await res.text()
  if (!res.ok) {
    return NextResponse.json({ error: raw || `Failed to configure ${provider}` }, { status: res.status })
  }

  try {
    const json = JSON.parse(raw) as unknown
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON response while configuring integration' }, { status: 500 })
  }
}
