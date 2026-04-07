import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { parseProxyResponse } from '../proxy-response'

type DisconnectRequestBody = {
  integrationId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await request.json()) as DisconnectRequestBody
    const integrationId = payload.integrationId?.trim()

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    const upstreamResponse = await secureFetch(`${openlaneAPIUrl}/v1/integrations/${encodeURIComponent(integrationId)}/disconnect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const rawBody = await upstreamResponse.text()
    return parseProxyResponse(rawBody, upstreamResponse.status, upstreamResponse.ok, 'Failed to disconnect integration')
  } catch (error) {
    console.error('Error disconnecting integration:', error)
    return NextResponse.json({ error: 'An error occurred while disconnecting integration' }, { status: 500 })
  }
}
