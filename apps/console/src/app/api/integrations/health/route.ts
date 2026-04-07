import { auth } from '@/lib/auth/auth'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'
import { HEALTH_CHECK_OPERATION_NAME } from '@/lib/integrations/utils'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { parseProxyResponse } from '../proxy-response'

type HealthRequestBody = {
  integrationId?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await request.json()) as HealthRequestBody
    const integrationId = payload.integrationId?.trim()
    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    const upstreamURL = `${openlaneAPIUrl}/v1/integrations/${encodeURIComponent(integrationId)}/operations/run`

    const upstreamResponse = await secureFetch(upstreamURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        body: {
          operation: HEALTH_CHECK_OPERATION_NAME,
          config: {},
        },
      }),
    })

    const rawBody = await upstreamResponse.text()
    return parseProxyResponse(rawBody, upstreamResponse.status, upstreamResponse.ok, `Health check failed for ${integrationId}`)
  } catch (error) {
    console.error('Error checking integration health:', error)
    return NextResponse.json({ error: 'An error occurred while checking integration health' }, { status: 500 })
  }
}
