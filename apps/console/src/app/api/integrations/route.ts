import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { NextRequest, NextResponse } from 'next/server'

type StartBody = {
  provider?: string
  scopes?: string[]
  redirect_uri?: string
}

export async function POST(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_OPENLANE_URL
  const session = await auth()
  const token = session?.user?.accessToken

  console.log('token', token)

  const body = (await req.json().catch(() => ({}))) as StartBody

  const provider = body.provider
  const scopes = body.scopes
  const redirect_uri = 'http://localhost:17608/v1/integrations/oauth/callback'

  const r = await secureFetch(`${base}/v1/integrations/oauth/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ provider, scopes, redirect_uri }),
  })

  console.log('RESPONSEEEEEEEEEEEEEEEEEEEE', r)

  if (!r.ok) {
    const msg = await r.text()
    return NextResponse.json({ error: msg || 'Failed to start OAuth' }, { status: r.status })
  }

  const json = await r.json()
  return NextResponse.json(json)
}
