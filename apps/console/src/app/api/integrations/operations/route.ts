import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { parseProxyResponse } from '../proxy-response'

type RunOperationRequestBody = {
  integrationId?: string
  operation?: string
  config?: Record<string, unknown>
}

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth()
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await request.json()) as RunOperationRequestBody
    const integrationId = payload.integrationId?.trim()
    const operation = payload.operation?.trim()

    if (!integrationId || !operation) {
      return NextResponse.json({ error: 'Integration ID and operation are required' }, { status: 400 })
    }

    const upstreamResponse = await secureFetch(`${openlaneAPIUrl}/v1/integrations/${encodeURIComponent(integrationId)}/operations/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: { operation, config: payload.config } }),
    })

    const rawBody = await upstreamResponse.text()
    return parseProxyResponse(rawBody, upstreamResponse.status, upstreamResponse.ok, `Operation ${operation} failed for ${integrationId}`)
  } catch (error) {
    console.error('Error running integration operation:', error)
    return NextResponse.json({ error: 'An error occurred while running the integration operation' }, { status: 500 })
  }
}
