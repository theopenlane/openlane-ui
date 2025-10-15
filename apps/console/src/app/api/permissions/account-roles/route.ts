import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { openlaneAPIUrl } from '@repo/dally/auth'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await req.json()
  const accessToken = session.user.accessToken

  const response = await secureFetch(`${openlaneAPIUrl}/v1/account/roles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    return NextResponse.json({ error: `Failed to fetch roles: ${response.status}`, details: text }, { status: response.status })
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON response' }, { status: 500 })
  }

  return NextResponse.json(data, { status: response.status })
}
